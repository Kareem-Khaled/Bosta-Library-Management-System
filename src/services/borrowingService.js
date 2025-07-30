const db = require('../database/connection');
const { NotFoundError, ConflictError, DatabaseError, ValidationError } = require('../middleware/errorHandler');

class BorrowingService {
  async getAllBorrowings() {
    try {
      const result = await db.query(`
        SELECT 
          br.id,
          br.borrow_date,
          br.due_date,
          br.return_date,
          br.borrower_id,
          br.book_id,
          b.title as book_title,
          b.author as book_author,
          b.isbn,
          bo.name as borrower_name,
          bo.email as borrower_email
        FROM borrowings br
        JOIN books b ON br.book_id = b.id
        JOIN borrowers bo ON br.borrower_id = bo.id
        ORDER BY br.borrow_date DESC
      `);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch borrowings');
    }
  }

  async getBorrowingById(id) {
    try {
      const result = await db.query(`
        SELECT 
          br.id,
          br.borrow_date,
          br.due_date,
          br.return_date,
          br.borrower_id,
          br.book_id,
          b.title as book_title,
          b.author as book_author,
          b.isbn,
          bo.name as borrower_name,
          bo.email as borrower_email
        FROM borrowings br
        JOIN books b ON br.book_id = b.id
        JOIN borrowers bo ON br.borrower_id = bo.id
        WHERE br.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrowing');
    }
  }

  async createBorrowing(borrowingData) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { borrower_id, book_id, borrow_date, due_date } = borrowingData;
      
      // Check if borrower exists
      const borrowerResult = await client.query(
        'SELECT id FROM borrowers WHERE id = $1',
        [borrower_id]
      );
      
      if (borrowerResult.rows.length === 0) {
        throw new NotFoundError('Borrower not found');
      }
      
      // Check if book exists and is available
      const bookResult = await client.query(
        'SELECT id, available_quantity, title FROM books WHERE id = $1',
        [book_id]
      );
      
      if (bookResult.rows.length === 0) {
        throw new NotFoundError('Book not found');
      }
      
      if (bookResult.rows[0].available_quantity <= 0) {
        throw new ConflictError('Book is not available for borrowing');
      }
      
      // Check if borrower already has this book borrowed (not returned)
      const existingBorrowingResult = await client.query(
        'SELECT id FROM borrowings WHERE borrower_id = $1 AND book_id = $2 AND return_date IS NULL',
        [borrower_id, book_id]
      );
      
      if (existingBorrowingResult.rows.length > 0) {
        throw new ConflictError('Borrower already has this book borrowed');
      }
      
      // Create borrowing record
      const borrowingResult = await client.query(
        'INSERT INTO borrowings (borrower_id, book_id, borrow_date, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
        [borrower_id, book_id, borrow_date || new Date(), due_date]
      );
      
      // Update book available quantity
      await client.query(
        'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = $1',
        [book_id]
      );
      
      await client.query('COMMIT');
      
      // Return the complete borrowing info
      return await this.getBorrowingById(borrowingResult.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to create borrowing');
    } finally {
      client.release();
    }
  }

  async returnBook(id, returnData = {}) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get borrowing info
      const borrowingResult = await client.query(
        'SELECT * FROM borrowings WHERE id = $1',
        [id]
      );
      
      if (borrowingResult.rows.length === 0) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      const borrowing = borrowingResult.rows[0];
      
      if (borrowing.return_date !== null) {
        throw new ConflictError('Book has already been returned');
      }
      
      const returnDate = returnData.return_date || new Date();
      
      // Update borrowing record with return date
      const updatedBorrowingResult = await client.query(
        'UPDATE borrowings SET return_date = $1 WHERE id = $2 RETURNING *',
        [returnDate, id]
      );
      
      // Update book available quantity
      await client.query(
        'UPDATE books SET available_quantity = available_quantity + 1 WHERE id = $1',
        [borrowing.book_id]
      );
      
      await client.query('COMMIT');
      
      // Return the complete borrowing info
      return await this.getBorrowingById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to return book');
    } finally {
      client.release();
    }
  }

  async getActiveBorrowings() {
    try {
      const result = await db.query(`
        SELECT 
          br.id,
          br.borrow_date,
          br.due_date,
          br.borrower_id,
          br.book_id,
          b.title as book_title,
          b.author as book_author,
          b.isbn,
          bo.name as borrower_name,
          bo.email as borrower_email
        FROM borrowings br
        JOIN books b ON br.book_id = b.id
        JOIN borrowers bo ON br.borrower_id = bo.id
        WHERE br.return_date IS NULL
        ORDER BY br.due_date ASC
      `);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch active borrowings');
    }
  }

  async getOverdueBorrowings() {
    try {
      const result = await db.query(`
        SELECT 
          br.id,
          br.borrow_date,
          br.due_date,
          br.borrower_id,
          br.book_id,
          b.title as book_title,
          b.author as book_author,
          b.isbn,
          bo.name as borrower_name,
          bo.email as borrower_email,
          CURRENT_DATE - br.due_date as days_overdue
        FROM borrowings br
        JOIN books b ON br.book_id = b.id
        JOIN borrowers bo ON br.borrower_id = bo.id
        WHERE br.return_date IS NULL AND br.due_date < CURRENT_DATE
        ORDER BY br.due_date ASC
      `);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch overdue borrowings');
    }
  }

  async deleteBorrowing(id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get borrowing info
      const borrowingResult = await client.query(
        'SELECT * FROM borrowings WHERE id = $1',
        [id]
      );
      
      if (borrowingResult.rows.length === 0) {
        throw new NotFoundError('Borrowing record not found');
      }
      
      const borrowing = borrowingResult.rows[0];
      
      // If book hasn't been returned, update available quantity
      if (borrowing.return_date === null) {
        await client.query(
          'UPDATE books SET available_quantity = available_quantity + 1 WHERE id = $1',
          [borrowing.book_id]
        );
      }
      
      // Delete borrowing record
      await client.query('DELETE FROM borrowings WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      return { message: 'Borrowing record deleted successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete borrowing');
    } finally {
      client.release();
    }
  }
}

module.exports = new BorrowingService();
