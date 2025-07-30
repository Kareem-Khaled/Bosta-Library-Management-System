const { asyncHandler } = require('./errorHandler');

// Validation middleware factory
const validateRequest = (schema, property = 'body') => {
  return asyncHandler(async (req, res, next) => {
    let dataToValidate = req[property];
    
    // Special handling for params - convert string IDs to numbers
    if (property === 'params' && dataToValidate.id) {
      const numericId = parseInt(dataToValidate.id, 10);
      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: 'ID must be a valid number'
          }
        });
      }
      dataToValidate = { ...dataToValidate, id: numericId };
    }
    
    const { error, value } = schema.validate(dataToValidate, {
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
