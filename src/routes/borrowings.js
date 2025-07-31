const express = require('express');
const rateLimit = require('express-rate-limit');
const borrowingService = require('../services/borrowingService');
const { validateRequest } = require('../middleware/validation');
const { createBorrowingSchema, idSchema } = require('../validators');
const { middleware: cacheMiddleware, cacheManager } = require('../middleware/cache');

const router = express.Router();

// Rate limiting for borrowing creation
const createBorrowingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many borrowing attempts, please try again later.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route GET /api/borrowings
 * @desc Get all borrowings with optional filters (with caching)
 * @access Public
 */
router.get('/', cacheMiddleware.borrowingList, async (req, res) => {
  try {
    const { book_id, borrower_id, status } = req.query;
    const filters = {};
    
    if (book_id) filters.book_id = parseInt(book_id);
    if (borrower_id) filters.borrower_id = parseInt(borrower_id);
    if (status) filters.status = status;

    const borrowings = await borrowingService.getAllBorrowings(filters);
    res.json({
      success: true,
      data: borrowings,
      count: borrowings.length
    });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve borrowings',
        status: 500
      }
    });
  }
});

/**
 * @route GET /api/borrowings/overdue
 * @desc Get all overdue borrowings (with caching)
 * @access Public
 */
router.get('/overdue', cacheMiddleware.overdueBorrowings, async (req, res) => {
  try {
    const overdueBorrowings = await borrowingService.getOverdueBorrowings();
    res.json({
      success: true,
      data: overdueBorrowings,
      count: overdueBorrowings.length
    });
  } catch (error) {
    console.error('Get overdue borrowings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve overdue borrowings',
        status: 500
      }
    });
  }
});

/**
 * @route GET /api/borrowings/:id
 * @desc Get borrowing by ID (with caching)
 * @access Public
 */
router.get('/:id', 
  validateRequest(idSchema, 'params'),
  cacheMiddleware.borrowingDetail,
  async (req, res) => {
  try {
    const { id } = req.params;
    const borrowing = await borrowingService.getBorrowingById(parseInt(id));
    
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrowing not found',
          status: 404
        }
      });
    }
    
    res.json({
      success: true,
      data: borrowing
    });
  } catch (error) {
    console.error('Get borrowing by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve borrowing',
        status: 500
      }
    });
  }
});

/**
 * @route POST /api/borrowings
 * @desc Create a new borrowing
 * @access Public
 */
router.post('/', 
  createBorrowingLimiter, 
  validateRequest(createBorrowingSchema),
  async (req, res) => {
  try {
    const borrowing = await borrowingService.createBorrowing(req.body);
    
    // Invalidate borrowing cache after creation (affects book availability too)
    cacheManager.invalidateBorrowingCache();
    
    res.status(201).json({
      success: true,
      data: borrowing,
      message: 'Book borrowed successfully'
    });
  } catch (error) {
    console.error('Create borrowing error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          status: 404
        }
      });
    }
    
    if (error.message.includes('not available') || error.message.includes('No copies')) {
      return res.status(409).json({
        success: false,
        error: {
          message: error.message,
          status: 409
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create borrowing',
        status: 500
      }
    });
  }
});

/**
 * @route PUT /api/borrowings/:id/return
 * @desc Return a book (update borrowing status)
 * @access Public
 */
router.put('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid borrowing ID',
          status: 400
        }
      });
    }

    const borrowing = await borrowingService.returnBook(parseInt(id));
    
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrowing not found',
          status: 404
        }
      });
    }

    // Invalidate borrowing cache after return (affects book availability too)
    cacheManager.invalidateBorrowingCache(id);

    res.json({
      success: true,
      data: borrowing,
      message: 'Book returned successfully'
    });
  } catch (error) {
    console.error('Return book error:', error);
    
    if (error.message.includes('already returned')) {
      return res.status(409).json({
        success: false,
        error: {
          message: error.message,
          status: 409
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to return book',
        status: 500
      }
    });
  }
});

/**
 * @route DELETE /api/borrowings/:id
 * @desc Delete borrowing by ID (admin only)
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid borrowing ID',
          status: 400
        }
      });
    }

    const deleted = await borrowingService.deleteBorrowing(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Borrowing not found',
          status: 404
        }
      });
    }

    res.json({
      success: true,
      message: 'Borrowing deleted successfully'
    });
  } catch (error) {
    console.error('Delete borrowing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete borrowing',
        status: 500
      }
    });
  }
});

module.exports = router;
