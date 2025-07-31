const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import ORM models and sync
const sequelize = require('./database/sequelize');
const { Book, Borrower, Borrowing } = require('./models');

const { globalErrorHandler } = require('./middleware/errorHandler');
const { createRateLimit, sanitizeInput } = require('./middleware/security');

// Import ORM routes
const bookRoutes = require('./routes/books');
const borrowerRoutes = require('./routes/borrowers');
const borrowingRoutes = require('./routes/borrowings');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Basic input sanitization
app.use(sanitizeInput);

// Simple rate limiting
app.use(createRateLimit(100));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/books', bookRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/borrowings', borrowingRoutes);

// Cache management routes
const { cacheManager } = require('./middleware/cache');

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  res.json({
    success: true,
    data: cacheManager.getStats(),
    message: 'Cache statistics retrieved successfully'
  });
});

// Clear cache endpoint (for admin use)
app.delete('/api/cache', (req, res) => {
  cacheManager.clearAll();
  res.json({
    success: true,
    message: 'All caches cleared successfully'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    orm: 'Sequelize'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Library Management System API',
    version: '2.0.0',
    orm: 'Sequelize',
    endpoints: {
      health: '/health',
      books: '/api/books',
      borrowers: '/api/borrowers',
      borrowings: '/api/borrowings'
    },
    documentation: {
      books: {
        'GET /api/books': 'Get all books',
        'GET /api/books?search=term': 'Search books',
        'GET /api/books?available=true': 'Get available books',
        'GET /api/books/:id': 'Get book by ID',
        'POST /api/books': 'Create new book (rate limited)',
        'PUT /api/books/:id': 'Update book',
        'DELETE /api/books/:id': 'Delete book'
      },
      borrowers: {
        'GET /api/borrowers': 'Get all borrowers',
        'GET /api/borrowers/:id': 'Get borrower by ID',
        'POST /api/borrowers': 'Create new borrower (rate limited)',
        'PUT /api/borrowers/:id': 'Update borrower',
        'DELETE /api/borrowers/:id': 'Delete borrower'
      },
      borrowings: {
        'GET /api/borrowings': 'Get all borrowings',
        'GET /api/borrowings/:id': 'Get borrowing by ID',
        'GET /api/borrowings/overdue': 'Get overdue borrowings',
        'POST /api/borrowings': 'Create new borrowing (rate limited)',
        'PUT /api/borrowings/:id/return': 'Return a book',
        'DELETE /api/borrowings/:id': 'Delete borrowing'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      status: 404
    }
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server only if not in test environment and not being imported
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`
      Library Management System API is running!
      Server: http://localhost:${PORT}
      Health: http://localhost:${PORT}/health
      API Documentation: http://localhost:${PORT}
      Environment: ${process.env.NODE_ENV || 'development'}
    `);
  });
}

module.exports = app;
