const Joi = require('joi');

// Book validation schemas
const createBookSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must be less than 255 characters'
  }),
  author: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Author is required',
    'string.max': 'Author must be less than 255 characters'
  }),
  isbn: Joi.string().pattern(/^[0-9]{10}$|^[0-9]{13}$/).required().messages({
    'string.pattern.base': 'ISBN must be 10 or 13 digits',
    'string.empty': 'ISBN is required'
  }),
  available_quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Available quantity must be a number',
    'number.integer': 'Available quantity must be an integer',
    'number.min': 'Available quantity cannot be negative'
  }),
  shelf_location: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Shelf location must be less than 100 characters'
  })
});

const updateBookSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  author: Joi.string().min(1).max(255).optional(),
  isbn: Joi.string().pattern(/^[0-9]{10}$|^[0-9]{13}$/).optional(),
  available_quantity: Joi.number().integer().min(0).optional(),
  shelf_location: Joi.string().max(100).optional().allow('')
});

// Borrower validation schemas
const createBorrowerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Name is required',
    'string.max': 'Name must be less than 255 characters'
  }),
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
    'string.max': 'Email must be less than 255 characters'
  }),
  registered_date: Joi.date().optional().messages({
    'date.base': 'Registered date must be a valid date'
  })
});

const updateBorrowerSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  registered_date: Joi.date().optional()
});

// Borrowing validation schemas
const createBorrowingSchema = Joi.object({
  borrower_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Borrower ID must be a number',
    'number.integer': 'Borrower ID must be an integer',
    'number.positive': 'Borrower ID must be positive'
  }),
  book_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Book ID must be a number',
    'number.integer': 'Book ID must be an integer',
    'number.positive': 'Book ID must be positive'
  }),
  borrow_date: Joi.date().optional().messages({
    'date.base': 'Borrow date must be a valid date'
  }),
  due_date: Joi.date().greater('now').required().messages({
    'date.base': 'Due date must be a valid date',
    'date.greater': 'Due date must be in the future'
  })
});

const returnBookSchema = Joi.object({
  return_date: Joi.date().optional().messages({
    'date.base': 'Return date must be a valid date'
  })
});

// ID validation
const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID must be a number',
  'number.integer': 'ID must be an integer',
  'number.positive': 'ID must be positive'
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  createBorrowerSchema,
  updateBorrowerSchema,
  createBorrowingSchema,
  returnBookSchema,
  idSchema
};
