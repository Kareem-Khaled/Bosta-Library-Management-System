const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { globalErrorHandler } = require('./middleware/errorHandler');
const bookRoutes = require('./routes/books');
const borrowerRoutes = require('./routes/borrowers');
const borrowingRoutes = require('./routes/borrowings');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.'
    }
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/books', bookRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/borrowings', borrowingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Library Management System API',
    version: '1.0.0',
    endpoints: {
      books: '/api/books',
      borrowers: '/api/borrowers',
      borrowings: '/api/borrowings',
      health: '/health'
    },
    documentation: {
      books: {
        'GET /api/books': 'Get all books (supports ?search=query&available=true)',
        'GET /api/books/:id': 'Get book by ID',
        'POST /api/books': 'Create new book',
        'PUT /api/books/:id': 'Update book',
        'DELETE /api/books/:id': 'Delete book'
      },
      borrowers: {
        'GET /api/borrowers': 'Get all borrowers (supports ?search=query)',
        'GET /api/borrowers/:id': 'Get borrower by ID',
        'GET /api/borrowers/:id/history': 'Get borrower history',
        'POST /api/borrowers': 'Create new borrower',
        'PUT /api/borrowers/:id': 'Update borrower',
        'DELETE /api/borrowers/:id': 'Delete borrower'
      },
      borrowings: {
        'GET /api/borrowings': 'Get all borrowings (supports ?status=active|overdue)',
        'GET /api/borrowings/:id': 'Get borrowing by ID',
        'POST /api/borrowings': 'Borrow a book',
        'PUT /api/borrowings/:id/return': 'Return a book',
        'DELETE /api/borrowings/:id': 'Delete borrowing record'
      }
    }
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
    Library Management System API is running!
    Server: http://localhost:${PORT}
    Health: http://localhost:${PORT}/health
    API Documentation: http://localhost:${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
