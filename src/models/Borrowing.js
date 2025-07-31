const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Borrowing = sequelize.define('Borrowing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  borrower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'borrowers',
      key: 'id'
    }
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  borrow_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterBorrowDate(value) {
        if (value <= this.borrow_date) {
          throw new Error('Due date must be after borrow date');
        }
      }
    }
  },
  return_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true
    }
  }
}, {
  tableName: 'borrowings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['borrower_id']
    },
    {
      fields: ['book_id']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['return_date']
    }
  ]
});

module.exports = Borrowing;
