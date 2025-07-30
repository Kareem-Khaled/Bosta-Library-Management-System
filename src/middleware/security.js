// Simple security middleware for Library Management System
const rateLimit = require('express-rate-limit');

// Simple rate limiter
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
  sanitizeInput
};
