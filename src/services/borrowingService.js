const { Borrowing, Book, Borrower } = require('../models');
const { NotFoundError, ConflictError, DatabaseError, ValidationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../database/sequelize');

class BorrowingService {
  async getAllBorrowings() {
    try {
      const borrowings = await Borrowing.findAll({
        include: [
          {
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          },
          {
            association: 'borrower',
            attributes: ['name', 'email']
          }
        ],
        order: [['borrow_date', 'DESC']]
      });
      
      return borrowings;
    } catch (error) {
      throw new DatabaseError('Failed to fetch borrowings');
    }
  }

  async getBorrowingById(id) {
    try {
      const borrowing = await Borrowing.findByPk(id, {
        include: [
          {
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          },
          {
            association: 'borrower',
            attributes: ['name', 'email']
          }
        ]
      });
      
      if (!borrowing) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      return borrowing;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrowing');
    }
  }

  async createBorrowing(borrowingData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { borrower_id, book_id, borrow_date, due_date } = borrowingData;
      
      // Check if borrower exists
      const borrower = await Borrower.findByPk(borrower_id, { transaction });
      if (!borrower) {
        throw new NotFoundError('Borrower not found');
      }
      
      // Check if book exists and is available
      const book = await Book.findByPk(book_id, { transaction });
      if (!book) {
        throw new NotFoundError('Book not found');
      }
      
      if (book.available_quantity <= 0) {
        throw new ConflictError('Book is not available for borrowing');
      }
      
      // Check if borrower already has this book borrowed (not returned)
      const existingBorrowing = await Borrowing.findOne({
        where: {
          borrower_id,
          book_id,
          return_date: null
        },
        transaction
      });
      
      if (existingBorrowing) {
        throw new ConflictError('Borrower already has this book borrowed');
      }
      
      // Create borrowing record
      const borrowing = await Borrowing.create({
        borrower_id,
        book_id,
        borrow_date: borrow_date || new Date(),
        due_date
      }, { transaction });
      
      // Update book available quantity
      await book.update({
        available_quantity: book.available_quantity - 1
      }, { transaction });
      
      await transaction.commit();
      
      // Return the complete borrowing info
      return await this.getBorrowingById(borrowing.id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw new DatabaseError('Failed to create borrowing');
    }
  }

  async returnBook(id, returnData = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get borrowing info
      const borrowing = await Borrowing.findByPk(id, { transaction });
      
      if (!borrowing) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      if (borrowing.return_date !== null) {
        throw new ConflictError('Book has already been returned');
      }
      
      const returnDate = returnData.return_date || new Date();
      
      // Update borrowing record with return date
      await borrowing.update({
        return_date: returnDate
      }, { transaction });
      
      // Update book available quantity
      const book = await Book.findByPk(borrowing.book_id, { transaction });
      await book.update({
        available_quantity: book.available_quantity + 1
      }, { transaction });
      
      await transaction.commit();
      
      // Return the complete borrowing info
      return await this.getBorrowingById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to return book');
    }
  }

  async getActiveBorrowings() {
    try {
      const borrowings = await Borrowing.findAll({
        where: {
          return_date: null
        },
        include: [
          {
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          },
          {
            association: 'borrower',
            attributes: ['name', 'email']
          }
        ],
        order: [['due_date', 'ASC']]
      });
      
      return borrowings;
    } catch (error) {
      throw new DatabaseError('Failed to fetch active borrowings');
    }
  }

  async getOverdueBorrowings() {
    try {
      const borrowings = await Borrowing.findAll({
        where: {
          return_date: null,
          due_date: { [Op.lt]: new Date() }
        },
        include: [
          {
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          },
          {
            association: 'borrower',
            attributes: ['name', 'email']
          }
        ],
        order: [['due_date', 'ASC']]
      });
      
      return borrowings;
    } catch (error) {
      throw new DatabaseError('Failed to fetch overdue borrowings');
    }
  }

  async deleteBorrowing(id) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get borrowing info
      const borrowing = await Borrowing.findByPk(id, { transaction });
      
      if (!borrowing) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      // If book hasn't been returned, update available quantity
      if (borrowing.return_date === null) {
        const book = await Book.findByPk(borrowing.book_id, { transaction });
        await book.update({
          available_quantity: book.available_quantity + 1
        }, { transaction });
      }
      
      // Delete borrowing record
      await borrowing.destroy({ transaction });
      
      await transaction.commit();
      
      return { message: 'Borrowing record deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete borrowing');
    }
  }
}

module.exports = new BorrowingService();
