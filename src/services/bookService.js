const { Book } = require('../models');
const { NotFoundError, ConflictError, DatabaseError, ValidationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class BookService {
  async getAllBooks() {
    try {
      const books = await Book.findAll({
        order: [['created_at', 'DESC']]
      });
      return books;
    } catch (error) {
      throw new DatabaseError('Failed to fetch books');
    }
  }

  async getBookById(id) {
    try {
      const book = await Book.findByPk(id);
      
      if (!book) {
        throw new NotFoundError('Book not found');
      }
      
      return book;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch book');
    }
  }

  async createBook(bookData) {
    try {
      const { title, author, isbn, quantity, shelf_location } = bookData;
      
      const book = await Book.create({
        title,
        author,
        isbn,
        quantity,
        available_quantity: quantity,
        shelf_location
      });
      
      return book;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('Book with this ISBN already exists');
      }
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw new DatabaseError('Failed to create book');
    }
  }

  async updateBook(id, bookData) {
    try {
      const book = await Book.findByPk(id);
      
      if (!book) {
        throw new NotFoundError('Book not found');
      }

      // If quantity is being updated, adjust available_quantity proportionally
      if (bookData.quantity !== undefined) {
        const borrowedQuantity = book.quantity - book.available_quantity;
        bookData.available_quantity = Math.max(0, bookData.quantity - borrowedQuantity);
      }
      
      await book.update(bookData);
      
      return book;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('Book with this ISBN already exists');
      }
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw new DatabaseError('Failed to update book');
    }
  }

  async deleteBook(id) {
    try {
      const book = await Book.findByPk(id);
      
      if (!book) {
        throw new NotFoundError('Book not found');
      }
      
      // Check if book has active borrowings
      const { Borrowing } = require('../models');
      const activeBorrowings = await Borrowing.count({
        where: {
          book_id: id,
          return_date: null
        }
      });
      
      if (activeBorrowings > 0) {
        throw new ConflictError('Cannot delete book with active borrowings');
      }
      
      await book.destroy();
      
      return { message: 'Book deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete book');
    }
  }

  async searchBooks(searchTerm) {
    try {
      const books = await Book.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${searchTerm}%` } },
            { author: { [Op.iLike]: `%${searchTerm}%` } },
            { isbn: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      
      return books;
    } catch (error) {
      throw new DatabaseError('Failed to search books');
    }
  }

  async getAvailableBooks() {
    try {
      const books = await Book.findAll({
        where: {
          available_quantity: { [Op.gt]: 0 }
        },
        order: [['title', 'ASC']]
      });
      
      return books;
    } catch (error) {
      throw new DatabaseError('Failed to fetch available books');
    }
  }
}

module.exports = new BookService();
