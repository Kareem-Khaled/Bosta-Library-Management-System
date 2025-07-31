const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Import models with associations
const { Book, Borrower, Borrowing } = require('../models/index');

class ReportService {
  
  /**
   * Generate comprehensive borrowing analytics for a given period
   */
  async generateBorrowingAnalytics(startDate, endDate) {
    try {
      // Validate inputs
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        throw new Error('Start date cannot be after end date');
      }

      console.log(` Generating borrowing analytics from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);

      // Get all borrowing data for the period
      const borrowingData = await this.getBorrowingDataForPeriod(start, end);
      
      // Generate various analytical reports
      const analytics = {
        summary: await this.generateSummaryReport(start, end),
        detailedBorrowings: borrowingData.detailed,
        topBooks: await this.getTopBorrowedBooks(start, end),
        topBorrowers: await this.getTopBorrowers(start, end),
        overdueBooks: await this.getOverdueBooks(end),
        monthlyTrends: await this.getMonthlyBorrowingTrends(start, end),
        bookAvailability: await this.getBookAvailabilityReport()
      };

      // Generate the CSV file
      const fileName = await this.exportToCsv(analytics, start, end);
      
      return {
        success: true,
        fileName,
        analytics: {
          period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
          totalBorrowings: analytics.summary.totalBorrowings,
          activeBorrowings: analytics.summary.activeBorrowings,
          returnedBorrowings: analytics.summary.returnedBorrowings,
          overdueCount: analytics.overdueBooks.length,
          uniqueBorrowers: analytics.summary.uniqueBorrowers,
          topBook: analytics.topBooks[0]?.title || 'N/A',
          topBorrower: analytics.topBorrowers[0]?.name || 'N/A'
        }
      };

    } catch (error) {
      console.error('Error generating borrowing analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed borrowing data for a specific period
   */
  async getBorrowingDataForPeriod(startDate, endDate) {
    const borrowings = await Borrowing.findAll({
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['borrow_date', 'DESC']]
    });

    // Get books and borrowers separately to avoid association issues
    const bookIds = [...new Set(borrowings.map(b => b.book_id))];
    const borrowerIds = [...new Set(borrowings.map(b => b.borrower_id))];

    const books = await Book.findAll({
      where: { id: bookIds },
      attributes: ['id', 'title', 'author', 'isbn', 'shelf_location']
    });

    const borrowers = await Borrower.findAll({
      where: { id: borrowerIds },
      attributes: ['id', 'name', 'email']
    });

    // Create lookup maps
    const bookMap = new Map(books.map(book => [book.id, book]));
    const borrowerMap = new Map(borrowers.map(borrower => [borrower.id, borrower]));

    const detailed = borrowings.map(borrowing => {
      const book = bookMap.get(borrowing.book_id);
      const borrower = borrowerMap.get(borrowing.borrower_id);
      
      return {
        id: borrowing.id,
        bookTitle: book ? book.title : 'Unknown',
        bookAuthor: book ? book.author : 'Unknown',
        bookIsbn: book ? book.isbn : 'Unknown',
        shelfLocation: book ? book.shelf_location : 'Unknown',
        borrowerName: borrower ? borrower.name : 'Unknown',
        borrowerEmail: borrower ? borrower.email : 'Unknown',
        borrowDate: borrowing.borrow_date.toISOString().split('T')[0],
        dueDate: borrowing.due_date.toISOString().split('T')[0],
        returnDate: borrowing.return_date ? borrowing.return_date.toISOString().split('T')[0] : 'Not Returned',
        status: borrowing.return_date ? 'Returned' : 'Active',
        daysOverdue: borrowing.return_date ? 0 : Math.max(0, Math.floor((new Date() - borrowing.due_date) / (1000 * 60 * 60 * 24)))
      };
    });

    return { detailed };
  }

  /**
   * Generate summary statistics
   */
  async generateSummaryReport(startDate, endDate) {
    const totalBorrowings = await Borrowing.count({
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const activeBorrowings = await Borrowing.count({
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        },
        return_date: null
      }
    });

    const returnedBorrowings = totalBorrowings - activeBorrowings;

    const uniqueBorrowers = await Borrowing.count({
      distinct: true,
      col: 'borrower_id',
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const avgBorrowingDuration = await Borrowing.findAll({
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        },
        return_date: {
          [Op.not]: null
        }
      },
      attributes: ['borrow_date', 'return_date']
    }).then(borrowings => {
      if (borrowings.length === 0) return 0;
      const totalDays = borrowings.reduce((sum, b) => {
        const days = Math.floor((b.return_date - b.borrow_date) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      return Math.round(totalDays / borrowings.length);
    });

    return {
      totalBorrowings,
      activeBorrowings,
      returnedBorrowings,
      uniqueBorrowers,
      avgBorrowingDuration,
      returnRate: totalBorrowings > 0 ? Math.round((returnedBorrowings / totalBorrowings) * 100) : 0
    };
  }

  /**
   * Get top borrowed books for the period
   */
  async getTopBorrowedBooks(startDate, endDate, limit = 10) {
    // Use raw query to avoid Sequelize column naming issues
    const borrowingCounts = await require('../database/sequelize').query(
      `SELECT book_id, COUNT(*) as borrow_count 
       FROM borrowings 
       WHERE borrow_date BETWEEN :startDate AND :endDate 
       GROUP BY book_id 
       ORDER BY COUNT(*) DESC 
       LIMIT :limit`,
      {
        replacements: { startDate, endDate, limit },
        type: require('sequelize').QueryTypes.SELECT
      }
    );

    // Get book details separately
    const bookIds = borrowingCounts.map(item => item.book_id);
    if (bookIds.length === 0) return [];

    const books = await Book.findAll({
      where: { id: bookIds },
      attributes: ['id', 'title', 'author', 'isbn']
    });

    const bookMap = new Map(books.map(book => [book.id, book]));

    return borrowingCounts.map(item => {
      const book = bookMap.get(item.book_id);
      return {
        title: book ? book.title : 'Unknown',
        author: book ? book.author : 'Unknown',
        isbn: book ? book.isbn : 'Unknown',
        borrowCount: parseInt(item.borrow_count)
      };
    });
  }

  /**
   * Get top borrowers for the period
   */
  async getTopBorrowers(startDate, endDate, limit = 10) {
    // Use raw query to avoid Sequelize column naming issues
    const borrowingCounts = await require('../database/sequelize').query(
      `SELECT borrower_id, COUNT(*) as borrow_count 
       FROM borrowings 
       WHERE borrow_date BETWEEN :startDate AND :endDate 
       GROUP BY borrower_id 
       ORDER BY COUNT(*) DESC 
       LIMIT :limit`,
      {
        replacements: { startDate, endDate, limit },
        type: require('sequelize').QueryTypes.SELECT
      }
    );

    // Get borrower details separately
    const borrowerIds = borrowingCounts.map(item => item.borrower_id);
    if (borrowerIds.length === 0) return [];

    const borrowers = await Borrower.findAll({
      where: { id: borrowerIds },
      attributes: ['id', 'name', 'email']
    });

    const borrowerMap = new Map(borrowers.map(borrower => [borrower.id, borrower]));

    return borrowingCounts.map(item => {
      const borrower = borrowerMap.get(item.borrower_id);
      return {
        name: borrower ? borrower.name : 'Unknown',
        email: borrower ? borrower.email : 'Unknown',
        borrowCount: parseInt(item.borrow_count)
      };
    });
  }

  /**
   * Get overdue books as of the end date
   */
  async getOverdueBooks(asOfDate) {
    // Get all overdue borrowings
    const overdueBorrowings = await Borrowing.findAll({
      where: {
        due_date: {
          [Op.lt]: asOfDate
        },
        return_date: null
      },
      attributes: ['id', 'book_id', 'borrower_id', 'due_date']
    });

    // Get book and borrower details separately
    const bookIds = overdueBorrowings.map(borrowing => borrowing.book_id);
    const borrowerIds = overdueBorrowings.map(borrowing => borrowing.borrower_id);

    const [books, borrowers] = await Promise.all([
      Book.findAll({
        where: { id: bookIds },
        attributes: ['id', 'title', 'author', 'isbn']
      }),
      Borrower.findAll({
        where: { id: borrowerIds },
        attributes: ['id', 'name', 'email']
      })
    ]);

    const bookMap = new Map(books.map(book => [book.id, book]));
    const borrowerMap = new Map(borrowers.map(borrower => [borrower.id, borrower]));

    return overdueBorrowings.map(borrowing => {
      const book = bookMap.get(borrowing.book_id);
      const borrower = borrowerMap.get(borrowing.borrower_id);
      
      return {
        bookTitle: book ? book.title : 'Unknown',
        bookAuthor: book ? book.author : 'Unknown',
        borrowerName: borrower ? borrower.name : 'Unknown',
        borrowerEmail: borrower ? borrower.email : 'Unknown',
        dueDate: borrowing.due_date.toISOString().split('T')[0],
        daysOverdue: Math.floor((asOfDate - borrowing.due_date) / (1000 * 60 * 60 * 24))
      };
    });
  }

  /**
   * Get monthly borrowing trends
   */
  async getMonthlyBorrowingTrends(startDate, endDate) {
    const borrowings = await Borrowing.findAll({
      where: {
        borrow_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['borrow_date']
    });

    const monthlyData = {};
    borrowings.forEach(borrowing => {
      const month = borrowing.borrow_date.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        borrowings: monthlyData[month]
      }));
  }

  /**
   * Get book availability report
   */
  async getBookAvailabilityReport() {
    const books = await Book.findAll({
      attributes: ['title', 'author', 'isbn', 'quantity', 'available_quantity', 'shelf_location']
    });

    return books.map(book => ({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      totalCopies: book.quantity,
      availableCopies: book.available_quantity,
      borrowedCopies: book.quantity - book.available_quantity,
      utilizationRate: Math.round(((book.quantity - book.available_quantity) / book.quantity) * 100),
      shelfLocation: book.shelf_location
    }));
  }

  /**
   * Export analytics to CSV format
   */
  async exportToCsv(analytics, startDate, endDate) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `borrowing-analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}-${timestamp}.csv`;
    
    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const csvPath = path.join(exportsDir, fileName);

    // Prepare comprehensive data for CSV export
    const csvData = [
      // Summary section
      { section: 'SUMMARY', metric: 'Total Borrowings', value: analytics.summary.totalBorrowings },
      { section: 'SUMMARY', metric: 'Active Borrowings', value: analytics.summary.activeBorrowings },
      { section: 'SUMMARY', metric: 'Returned Borrowings', value: analytics.summary.returnedBorrowings },
      { section: 'SUMMARY', metric: 'Unique Borrowers', value: analytics.summary.uniqueBorrowers },
      { section: 'SUMMARY', metric: 'Average Borrowing Duration (days)', value: analytics.summary.avgBorrowingDuration },
      { section: 'SUMMARY', metric: 'Return Rate (%)', value: analytics.summary.returnRate },
      { section: '', metric: '', value: '' }, // Empty row

      // Top Books section
      ...analytics.topBooks.map((book, index) => ({
        section: 'TOP BOOKS',
        metric: `${index + 1}. ${book.title} by ${book.author}`,
        value: `${book.borrowCount} borrowings`
      })),
      { section: '', metric: '', value: '' }, // Empty row

      // Top Borrowers section
      ...analytics.topBorrowers.map((borrower, index) => ({
        section: 'TOP BORROWERS',
        metric: `${index + 1}. ${borrower.name}`,
        value: `${borrower.borrowCount} borrowings`
      })),
      { section: '', metric: '', value: '' }, // Empty row

      // Monthly Trends section
      ...analytics.monthlyTrends.map(trend => ({
        section: 'MONTHLY TRENDS',
        metric: trend.month,
        value: `${trend.borrowings} borrowings`
      })),
      { section: '', metric: '', value: '' }, // Empty row

      // Overdue Books section
      ...analytics.overdueBooks.map((book, index) => ({
        section: 'OVERDUE BOOKS',
        metric: `${index + 1}. ${book.bookTitle} - ${book.borrowerName}`,
        value: `${book.daysOverdue} days overdue`
      }))
    ];

    const csvWriter = createCsvWriter({
      path: csvPath,
      header: [
        { id: 'section', title: 'Section' },
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    console.log(` CSV report exported: ${fileName}`);
    return fileName;
  }
}

module.exports = new ReportService();
