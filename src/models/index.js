const Book = require('./Book');
const Borrower = require('./Borrower');
const Borrowing = require('./Borrowing');

// Define associations
// Book - Borrowing (One-to-Many)
Book.hasMany(Borrowing, {
  foreignKey: 'book_id',
  as: 'borrowings'
});

Borrowing.belongsTo(Book, {
  foreignKey: 'book_id',
  as: 'book'
});

// Borrower - Borrowing (One-to-Many)
Borrower.hasMany(Borrowing, {
  foreignKey: 'borrower_id',
  as: 'borrowings'
});

Borrowing.belongsTo(Borrower, {
  foreignKey: 'borrower_id',
  as: 'borrower'
});

// Many-to-Many through Borrowing (for complex queries)
Book.belongsToMany(Borrower, {
  through: Borrowing,
  foreignKey: 'book_id',
  otherKey: 'borrower_id',
  as: 'borrowers'
});

Borrower.belongsToMany(Book, {
  through: Borrowing,
  foreignKey: 'borrower_id',
  otherKey: 'book_id',
  as: 'books'
});

module.exports = {
  Book,
  Borrower,
  Borrowing
};
