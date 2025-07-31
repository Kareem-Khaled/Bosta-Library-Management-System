const express = require('express');
const bookService = require('../services/bookService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/validation');
const { bookCreationRateLimit } = require('../middleware/security');
const { createBookSchema, updateBookSchema, idSchema } = require('../validators');
const { middleware: cacheMiddleware, cacheManager } = require('../middleware/cache');

const router = express.Router();

// GET /api/books - Get all books (with caching)
router.get('/', cacheMiddleware.bookList, asyncHandler(async (req, res) => {
  const { search, available } = req.query;
  
  let books;
  if (search) {
    books = await bookService.searchBooks(search);
  } else if (available === 'true') {
    books = await bookService.getAvailableBooks();
  } else {
    books = await bookService.getAllBooks();
  }
  
  res.json({
    success: true,
    data: books,
    count: books.length
  });
}));

// GET /api/books/:id - Get book by ID (with caching)
router.get('/:id', 
  validateRequest(idSchema, 'params'),
  cacheMiddleware.bookDetail,
  asyncHandler(async (req, res) => {
    const book = await bookService.getBookById(req.params.id);
    
    res.json({
      success: true,
      data: book
    });
  })
);

// POST /api/books - Create new book (Rate Limited)
router.post('/',
  bookCreationRateLimit, // Apply rate limiting specifically to book creation
  validateRequest(createBookSchema),
  asyncHandler(async (req, res) => {
    const book = await bookService.createBook(req.body);
    
    // Invalidate book list cache after creation
    cacheManager.invalidateBookCache();
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  })
);

// PUT /api/books/:id - Update book
router.put('/:id',
  validateRequest(idSchema, 'params'),
  validateRequest(updateBookSchema),
  asyncHandler(async (req, res) => {
    const book = await bookService.updateBook(req.params.id, req.body);
    
    // Invalidate specific book cache after update
    cacheManager.invalidateBookCache(req.params.id);
    
    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  })
);

// DELETE /api/books/:id - Delete book
router.delete('/:id',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const result = await bookService.deleteBook(req.params.id);
    
    // Invalidate specific book cache after deletion
    cacheManager.invalidateBookCache(req.params.id);
    
    res.json({
      success: true,
      ...result
    });
  })
);

module.exports = router;
