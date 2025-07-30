const db = require('../database/connection');
const { NotFoundError, ConflictError, DatabaseError } = require('../middleware/errorHandler');
const { cache } = require('../middleware/cache');

class BookService {
  async getAllBooks() {
    try {
      const cached = cache.get('all_books');
      if (cached) return cached;

      const result = await db.query(
        'SELECT * FROM books ORDER BY title ASC'
      );
      
      cache.set('all_books', result.rows);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch books');
    }
  }

  async getBookById(id) {
    try {
      const cached = cache.get(`book_${id}`);
      if (cached) return cached;

      const result = await db.query(
        'SELECT * FROM books WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Book not found');
      }
      
      const book = result.rows[0];
      cache.set(`book_${id}`, book);
      return book;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch book');
    }
  }

  async createBook(bookData) {
    try {
      const { title, author, isbn, available_quantity, shelf_location } = bookData;
      
      const result = await db.query(
        'INSERT INTO books (title, author, isbn, available_quantity, shelf_location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, author, isbn, available_quantity, shelf_location || null]
      );
      
      // Clear cache
      cache.clear();
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Book with this ISBN already exists');
      }
      throw new DatabaseError('Failed to create book');
    }
  }

  async updateBook(id, bookData) {
    try {
      // First check if book exists
      await this.getBookById(id);
      
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(bookData).forEach(key => {
        if (bookData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(bookData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }
      
      values.push(id);
      
      const result = await db.query(
        `UPDATE books SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      // Clear cache
      cache.clear();
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ConflictError('Book with this ISBN already exists');
      }
      throw new DatabaseError('Failed to update book');
    }
  }

  async deleteBook(id) {
    try {
      // Check if book exists
      await this.getBookById(id);
      
      // Check if book has active borrowings
      const borrowingsResult = await db.query(
        'SELECT COUNT(*) FROM borrowings WHERE book_id = $1 AND return_date IS NULL',
        [id]
      );
      
      if (parseInt(borrowingsResult.rows[0].count) > 0) {
        throw new ConflictError('Cannot delete book with active borrowings');
      }
      
      await db.query('DELETE FROM books WHERE id = $1', [id]);
      
      // Clear cache
      cache.clear();
      
      return { message: 'Book deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete book');
    }
  }

  async searchBooks(query) {
    try {
      const result = await db.query(
        'SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1 ORDER BY title ASC',
        [`%${query}%`]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to search books');
    }
  }

  async getAvailableBooks() {
    try {
      const result = await db.query(
        'SELECT * FROM books WHERE available_quantity > 0 ORDER BY title ASC'
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch available books');
    }
  }
}

module.exports = new BookService();
