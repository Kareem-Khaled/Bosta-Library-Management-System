const { asyncHandler } = require('./errorHandler');

// Validation middleware factory
const validateRequest = (schema, property = 'body') => {
  return asyncHandler(async (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: errorMessage
        }
      });
    }

    req[property] = value;
    next();
  });
};

module.exports = {
  validateRequest
};
