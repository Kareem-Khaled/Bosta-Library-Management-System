const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const rateLimit = require('express-rate-limit');

// Rate limiting for report generation (intensive operations)
const reportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many report requests from this IP, please try again later.',
    nextAvailableTime: new Date(Date.now() + 15 * 60 * 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/borrowing-analytics', reportRateLimit, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        example: '/api/reports/borrowing-analytics?startDate=2025-01-01&endDate=2025-07-31'
      });
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    console.log(` Generating borrowing analytics CSV report: ${startDate} to ${endDate}`);

    // Generate the CSV report
    const result = await reportService.generateBorrowingAnalytics(startDate, endDate);

    res.json({
      success: true,
      message: 'Borrowing analytics CSV report generated successfully',
      fileName: result.fileName,
      downloadUrl: `/api/reports/download/${result.fileName}`,
      analytics: result.analytics,
      generatedAt: new Date().toISOString(),
      format: 'CSV'
    });

  } catch (error) {
    console.error('Error generating borrowing analytics:', error);
    res.status(500).json({
      error: 'Failed to generate borrowing analytics report',
      details: error.message
    });
  }
});

router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Security: Only allow CSV files
    if (!fileName.endsWith('.csv') || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid file name. Only CSV files are allowed.'
      });
    }

    const path = require('path');
    const fs = require('fs');
    
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        fileName
      });
    }

    // Set appropriate headers for CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log(` CSV file downloaded: ${fileName}`);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      error: 'Failed to download file',
      details: error.message
    });
  }
});

router.get('/quick-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    // Use the existing method from reportService
    const summary = await reportService.generateSummaryReport(start, end);

    res.json({
      success: true,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      stats: summary,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting quick stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve quick statistics',
      details: error.message
    });
  }
});

module.exports = router;
