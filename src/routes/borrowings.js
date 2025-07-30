const express = require('express');
const borrowingService = require('../services/borrowingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/validation');
const { createBorrowingSchema, returnBookSchema, idSchema } = require('../validators');

const router = express.Router();

// GET /api/borrowings - Get all borrowings
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let borrowings;
  if (status === 'active') {
    borrowings = await borrowingService.getActiveBorrowings();
  } else if (status === 'overdue') {
    borrowings = await borrowingService.getOverdueBorrowings();
  } else {
    borrowings = await borrowingService.getAllBorrowings();
  }
  
  res.json({
    success: true,
    data: borrowings,
    count: borrowings.length
  });
}));

// GET /api/borrowings/:id - Get borrowing by ID
router.get('/:id',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const borrowing = await borrowingService.getBorrowingById(req.params.id);
    
    res.json({
      success: true,
      data: borrowing
    });
  })
);

// POST /api/borrowings - Create new borrowing (borrow a book)
router.post('/',
  validateRequest(createBorrowingSchema),
  asyncHandler(async (req, res) => {
    const borrowing = await borrowingService.createBorrowing(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: borrowing
    });
  })
);

// PUT /api/borrowings/:id/return - Return a book
router.put('/:id/return',
  validateRequest(idSchema, 'params'),
  validateRequest(returnBookSchema),
  asyncHandler(async (req, res) => {
    const borrowing = await borrowingService.returnBook(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Book returned successfully',
      data: borrowing
    });
  })
);

// DELETE /api/borrowings/:id - Delete borrowing record
router.delete('/:id',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const result = await borrowingService.deleteBorrowing(req.params.id);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

module.exports = router;
