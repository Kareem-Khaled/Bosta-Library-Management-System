// Simple security middleware for Library Management System
const rateLimit = require('express-rate-limit');

// General rate limiter
const createRateLimit = (maxRequests = 100) => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.'
    }
  }
});

// Strict rate limiter for book creation endpoint
const bookCreationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Only 5 book creations per 10 minutes
  message: {
    success: false,
    error: {
      message: 'Too many book creation attempts. You can only create 5 books per 10 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for borrowing creation endpoint  
const borrowingCreationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Only 3 borrowing attempts per 5 minutes
  message: {
    success: false,
    error: {
      message: 'Too many borrowing attempts. You can only borrow 3 books per 5 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Basic input sanitization
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
};

module.exports = {
  createRateLimit,
  bookCreationRateLimit,
  borrowingCreationRateLimit,
  sanitizeInput
};
