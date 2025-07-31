const NodeCache = require('node-cache');

// Single cache instance with manual TTL control
const cache = new NodeCache({ 
  stdTTL: 0, // No default TTL, we'll set per key
  useClones: false,
  checkperiod: 60 // Check for expired keys every minute
});

// TTL constants for different data types
const TTL = {
  BOOKS: 300,      // 5 minutes - semi-static data
  BORROWERS: 600,  // 10 minutes - rarely changing
  BORROWINGS: 120, // 2 minutes - dynamic data
  OVERDUE: 60      // 1 minute - critical real-time data
};

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * Generic cache middleware factory
 */
function createCacheMiddleware(keyGenerator, ttl) {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      stats.hits++;
      console.log(` Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    stats.misses++;
    console.log(` Cache MISS: ${cacheKey}`);
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200 && data.success) {
        cache.set(cacheKey, data, ttl);
        stats.sets++;
        console.log(` Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
      }
      originalJson.call(res, data);
    };
    
    next();
  };
}

// Key generators
const keyGenerators = {
  bookList: (req) => {
    const { search, available, page, limit } = req.query;
    return `books:list:${search || 'all'}:${available || 'all'}:${page || 1}:${limit || 50}`;
  },
  bookDetail: (req) => `book:${req.params.id}`,
  borrowerList: (req) => {
    const { page, limit } = req.query;
    return `borrowers:list:${page || 1}:${limit || 50}`;
  },
  borrowerDetail: (req) => `borrower:${req.params.id}`,
  borrowingList: (req) => {
    const { book_id, borrower_id, status, page, limit } = req.query;
    return `borrowings:list:${book_id || 'all'}:${borrower_id || 'all'}:${status || 'all'}:${page || 1}:${limit || 50}`;
  },
  borrowingDetail: (req) => `borrowing:${req.params.id}`,
  overdueBorrowings: (req) => 'borrowings:overdue'
};

// Cache middleware
const middleware = {
  // Book caching
  bookList: createCacheMiddleware(keyGenerators.bookList, TTL.BOOKS),
  bookDetail: createCacheMiddleware(keyGenerators.bookDetail, TTL.BOOKS),
  
  // Borrower caching
  borrowerList: createCacheMiddleware(keyGenerators.borrowerList, TTL.BORROWERS),
  borrowerDetail: createCacheMiddleware(keyGenerators.borrowerDetail, TTL.BORROWERS),
  
  // Borrowing caching
  borrowingList: createCacheMiddleware(keyGenerators.borrowingList, TTL.BORROWINGS),
  borrowingDetail: createCacheMiddleware(keyGenerators.borrowingDetail, TTL.BORROWINGS),
  overdueBorrowings: createCacheMiddleware(keyGenerators.overdueBorrowings, TTL.OVERDUE)
};

// Cache invalidation functions
const cacheManager = {
  invalidateBookCache: (bookId = null) => {
    if (bookId) {
      cache.del(`book:${bookId}`);
      console.log(` Book cache invalidated: book:${bookId}`);
    } else {
      // Delete all book-related keys
      const keys = cache.keys();
      const bookKeys = keys.filter(key => key.startsWith('book'));
      cache.del(bookKeys);
      console.log(` All book cache invalidated (${bookKeys.length} keys)`);
    }
    stats.deletes++;
  },

  invalidateBorrowerCache: (borrowerId = null) => {
    if (borrowerId) {
      cache.del(`borrower:${borrowerId}`);
      console.log(` Borrower cache invalidated: borrower:${borrowerId}`);
    } else {
      // Delete all borrower-related keys
      const keys = cache.keys();
      const borrowerKeys = keys.filter(key => key.startsWith('borrower'));
      cache.del(borrowerKeys);
      console.log(` All borrower cache invalidated (${borrowerKeys.length} keys)`);
    }
    stats.deletes++;
  },

  invalidateBorrowingCache: (borrowingId = null) => {
    if (borrowingId) {
      cache.del(`borrowing:${borrowingId}`);
      console.log(` Borrowing cache invalidated: borrowing:${borrowingId}`);
    } else {
      // Delete all borrowing-related keys
      const keys = cache.keys();
      const borrowingKeys = keys.filter(key => key.startsWith('borrowing'));
      cache.del(borrowingKeys);
      console.log(` All borrowing cache invalidated (${borrowingKeys.length} keys)`);
    }
    
    // Borrowing changes might affect book availability, so also clear book cache
    this.invalidateBookCache();
    stats.deletes++;
  },

  getStats: () => {
    const totalKeys = cache.keys().length;
    const hitRate = stats.hits / (stats.hits + stats.misses) * 100;
    return {
      ...stats,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: stats.hits + stats.misses,
      activeKeys: totalKeys,
      cacheSize: cache.getStats()
    };
  },

  clearAll: () => {
    const keyCount = cache.keys().length;
    cache.flushAll();
    console.log(` All cache cleared (${keyCount} keys removed)`);
  }
};

module.exports = {
  cacheManager,
  middleware
};
