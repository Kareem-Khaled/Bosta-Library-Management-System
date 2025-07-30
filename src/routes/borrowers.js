const express = require('express');
const borrowerService = require('../services/borrowerService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/validation');
const { createBorrowerSchema, updateBorrowerSchema, idSchema } = require('../validators');

const router = express.Router();

// GET /api/borrowers - Get all borrowers
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  
  let borrowers;
  if (search) {
    borrowers = await borrowerService.searchBorrowers(search);
  } else {
    borrowers = await borrowerService.getAllBorrowers();
  }
  
  res.json({
    success: true,
    data: borrowers,
    count: borrowers.length
  });
}));

// GET /api/borrowers/:id - Get borrower by ID
router.get('/:id',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const borrower = await borrowerService.getBorrowerById(req.params.id);
    
    res.json({
      success: true,
      data: borrower
    });
  })
);

// GET /api/borrowers/:id/history - Get borrower's borrowing history
router.get('/:id/history',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const history = await borrowerService.getBorrowerHistory(req.params.id);
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  })
);

// POST /api/borrowers - Create new borrower
router.post('/',
  validateRequest(createBorrowerSchema),
  asyncHandler(async (req, res) => {
    const borrower = await borrowerService.createBorrower(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Borrower created successfully',
      data: borrower
    });
  })
);

// PUT /api/borrowers/:id - Update borrower
router.put('/:id',
  validateRequest(idSchema, 'params'),
  validateRequest(updateBorrowerSchema),
  asyncHandler(async (req, res) => {
    const borrower = await borrowerService.updateBorrower(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Borrower updated successfully',
      data: borrower
    });
  })
);

// DELETE /api/borrowers/:id - Delete borrower
router.delete('/:id',
  validateRequest(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.deleteBorrower(req.params.id);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

module.exports = router;
