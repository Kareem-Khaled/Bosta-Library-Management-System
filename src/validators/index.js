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
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1'
  }),
  available_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Available quantity must be a number',
    'number.integer': 'Available quantity must be an integer',
    'number.min': 'Available quantity cannot be negative'
  }),
  shelf_location: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Shelf location must be less than 100 characters'
  })
}).custom((value, helpers) => {
  if (value.available_quantity !== undefined && value.available_quantity > value.quantity) {
    return helpers.error('available_quantity.greater_than_quantity');
  }
  return value;
}).messages({
  'available_quantity.greater_than_quantity': 'Available quantity cannot be greater than total quantity'
});

const updateBookSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  author: Joi.string().min(1).max(255).optional(),
  isbn: Joi.string().pattern(/^[0-9]{10}$|^[0-9]{13}$/).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  available_quantity: Joi.number().integer().min(0).optional(),
  shelf_location: Joi.string().max(100).optional().allow('')
}).custom((value, helpers) => {
  if (value.available_quantity !== undefined && value.quantity !== undefined && 
      value.available_quantity > value.quantity) {
    return helpers.error('available_quantity.greater_than_quantity');
  }
  return value;
}).messages({
  'available_quantity.greater_than_quantity': 'Available quantity cannot be greater than total quantity'
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
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('').messages({
    'string.pattern.base': 'Phone number must be a valid international format'
  }),
  registered_date: Joi.date().optional().messages({
    'date.base': 'Registered date must be a valid date'
  })
});

const updateBorrowerSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('').messages({
    'string.pattern.base': 'Phone number must be a valid international format'
  }),
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

// ID validation for URL parameters
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive'
  })
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
