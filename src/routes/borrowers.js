const express = require('express');
const rateLimit = require('express-rate-limit');
const borrowerService = require('../services/borrowerService');
const { validateRequest } = require('../middleware/validation');
const { createBorrowerSchema, updateBorrowerSchema, idSchema } = require('../validators');
const { middleware: cacheMiddleware, cacheManager } = require('../middleware/cache');

const router = express.Router();

// Rate limiting for borrower creation
const createBorrowerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many borrower creation attempts, please try again later.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route GET /api/borrowers
 * @desc Get all borrowers (with caching)
 * @access Public
 */
router.get('/', cacheMiddleware.borrowerList, async (req, res) => {
  try {
    const borrowers = await borrowerService.getAllBorrowers();
    res.json({
      success: true,
      data: borrowers,
      count: borrowers.length
    });
  } catch (error) {
    console.error('Get borrowers error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve borrowers',
        status: 500
      }
    });
  }
});

/**
 * @route GET /api/borrowers/:id
 * @desc Get borrower by ID (with caching)
 * @access Public
 */
router.get('/:id', 
  validateRequest(idSchema, 'params'),
  cacheMiddleware.borrowerDetail,
  async (req, res) => {
  try {
    const { id } = req.params;
    const borrower = await borrowerService.getBorrowerById(parseInt(id));
    
    if (!borrower) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrower not found',
          status: 404
        }
      });
    }

    res.json({
      success: true,
      data: borrower
    });
  } catch (error) {
    console.error('Get borrower error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve borrower',
        status: 500
      }
    });
  }
});

/**
 * @route POST /api/borrowers
 * @desc Create a new borrower
 * @access Public
 */
router.post('/', 
  createBorrowerLimiter, 
  validateRequest(createBorrowerSchema),
  async (req, res) => {
  try {
    const borrower = await borrowerService.createBorrower(req.body);
    
    // Invalidate borrower list cache after creation
    cacheManager.invalidateBorrowerCache();
    
    res.status(201).json({
      success: true,
      data: borrower,
      message: 'Borrower created successfully'
    });
  } catch (error) {
    console.error('Create borrower error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already exists',
          status: 409
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create borrower',
        status: 500
      }
    });
  }
});

/**
 * @route PUT /api/borrowers/:id
 * @desc Update borrower by ID
 * @access Public
 */
router.put('/:id', 
  validateRequest(idSchema, 'params'),
  validateRequest(updateBorrowerSchema),
  async (req, res) => {
  try {
    const { id } = req.params;
    const borrower = await borrowerService.updateBorrower(parseInt(id), req.body);
    
    if (!borrower) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrower not found',
          status: 404
        }
      });
    }

    // Invalidate specific borrower cache after update
    cacheManager.invalidateBorrowerCache(id);

    res.json({
      success: true,
      data: borrower,
      message: 'Borrower updated successfully'
    });
  } catch (error) {
    console.error('Update borrower error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already exists',
          status: 409
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update borrower',
        status: 500
      }
    });
  }
});

/**
 * @route DELETE /api/borrowers/:id
 * @desc Delete borrower by ID
 * @access Public
 */
router.delete('/:id', 
  validateRequest(idSchema, 'params'),
  async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await borrowerService.deleteBorrower(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrower not found',
          status: 404
        }
      });
    }

    // Invalidate specific borrower cache after deletion
    cacheManager.invalidateBorrowerCache(id);

    res.json({
      success: true,
      message: 'Borrower deleted successfully'
    });
  } catch (error) {
    console.error('Delete borrower error:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Cannot delete borrower with active borrowings',
          status: 409
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete borrower',
        status: 500
      }
    });
  }
});

module.exports = router;
