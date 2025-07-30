// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
  }
}

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = new ConflictError(message);
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    const message = 'Referenced resource does not exist';
    error = new ValidationError(message);
  }

  // PostgreSQL check constraint error
  if (err.code === '23514') {
    const message = 'Data violates database constraints';
    error = new ValidationError(message);
  }

  // Joi validation error
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new ValidationError(message);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  globalErrorHandler,
  asyncHandler
};
