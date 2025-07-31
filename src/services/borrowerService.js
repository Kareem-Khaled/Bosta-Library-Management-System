const { Borrower } = require('../models');
const { NotFoundError, ConflictError, DatabaseError, ValidationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class BorrowerService {
  async getAllBorrowers() {
    try {
      const borrowers = await Borrower.findAll({
        order: [['created_at', 'DESC']]
      });
      return borrowers;
    } catch (error) {
      throw new DatabaseError('Failed to fetch borrowers');
    }
  }

  async getBorrowerById(id) {
    try {
      const borrower = await Borrower.findByPk(id, {
        include: [{
          association: 'borrowings',
          include: [{
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          }]
        }]
      });
      
      if (!borrower) {
        throw new NotFoundError('Borrower not found');
      }
      
      return borrower;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrower');
    }
  }

  async createBorrower(borrowerData) {
    try {
      const { name, email, phone } = borrowerData;
      
      const borrower = await Borrower.create({
        name,
        email,
        phone
      });
      
      return borrower;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('Borrower with this email already exists');
      }
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw new DatabaseError('Failed to create borrower');
    }
  }

  async updateBorrower(id, borrowerData) {
    try {
      const borrower = await Borrower.findByPk(id);
      
      if (!borrower) {
        throw new NotFoundError('Borrower not found');
      }
      
      await borrower.update(borrowerData);
      
      return borrower;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('Borrower with this email already exists');
      }
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw new DatabaseError('Failed to update borrower');
    }
  }

  async deleteBorrower(id) {
    try {
      const borrower = await Borrower.findByPk(id);
      
      if (!borrower) {
        throw new NotFoundError('Borrower not found');
      }
      
      // Check if borrower has active borrowings
      const { Borrowing } = require('../models');
      const activeBorrowings = await Borrowing.count({
        where: {
          borrower_id: id,
          return_date: null
        }
      });
      
      if (activeBorrowings > 0) {
        throw new ConflictError('Cannot delete borrower with active borrowings');
      }
      
      await borrower.destroy();
      
      return { message: 'Borrower deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete borrower');
    }
  }

  async searchBorrowers(searchTerm) {
    try {
      const borrowers = await Borrower.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchTerm}%` } },
            { email: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      
      return borrowers;
    } catch (error) {
      throw new DatabaseError('Failed to search borrowers');
    }
  }

  async getBorrowerWithActiveBorrowings(id) {
    try {
      const borrower = await Borrower.findByPk(id, {
        include: [{
          association: 'borrowings',
          where: { return_date: null },
          required: false,
          include: [{
            association: 'book',
            attributes: ['title', 'author', 'isbn']
          }]
        }]
      });
      
      if (!borrower) {
        throw new NotFoundError('Borrower not found');
      }
      
      return borrower;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrower with active borrowings');
    }
  }
}

module.exports = new BorrowerService();
