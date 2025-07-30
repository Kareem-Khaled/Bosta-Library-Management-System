const db = require('../database/connection');
const { NotFoundError, ConflictError, DatabaseError } = require('../middleware/errorHandler');

class BorrowerService {
  async getAllBorrowers() {
    try {
      const result = await db.query(
        'SELECT * FROM borrowers ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch borrowers');
    }
  }

  async getBorrowerById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM borrowers WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Borrower not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrower');
    }
  }

  async createBorrower(borrowerData) {
    try {
      const { name, email, registered_date } = borrowerData;
      
      const result = await db.query(
        'INSERT INTO borrowers (name, email, registered_date) VALUES ($1, $2, $3) RETURNING *',
        [name, email, registered_date || new Date()]
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Borrower with this email already exists');
      }
      throw new DatabaseError('Failed to create borrower');
    }
  }

  async updateBorrower(id, borrowerData) {
    try {
      // First check if borrower exists
      await this.getBorrowerById(id);
      
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(borrowerData).forEach(key => {
        if (borrowerData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(borrowerData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }
      
      values.push(id);
      
      const result = await db.query(
        `UPDATE borrowers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ConflictError('Borrower with this email already exists');
      }
      throw new DatabaseError('Failed to update borrower');
    }
  }

  async deleteBorrower(id) {
    try {
      // Check if borrower exists
      await this.getBorrowerById(id);
      
      // Check if borrower has active borrowings
      const borrowingsResult = await db.query(
        'SELECT COUNT(*) FROM borrowings WHERE borrower_id = $1 AND return_date IS NULL',
        [id]
      );
      
      if (parseInt(borrowingsResult.rows[0].count) > 0) {
        throw new ConflictError('Cannot delete borrower with active borrowings');
      }
      
      await db.query('DELETE FROM borrowers WHERE id = $1', [id]);
      return { message: 'Borrower deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete borrower');
    }
  }

  async getBorrowerHistory(id) {
    try {
      // First check if borrower exists
      await this.getBorrowerById(id);
      
      const result = await db.query(`
        SELECT 
          br.id,
          br.borrow_date,
          br.due_date,
          br.return_date,
          b.title,
          b.author,
          b.isbn
        FROM borrowings br
        JOIN books b ON br.book_id = b.id
        WHERE br.borrower_id = $1
        ORDER BY br.borrow_date DESC
      `, [id]);
      
      return result.rows;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch borrower history');
    }
  }

  async searchBorrowers(query) {
    try {
      const result = await db.query(
        'SELECT * FROM borrowers WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name ASC',
        [`%${query}%`]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to search borrowers');
    }
  }
}

module.exports = new BorrowerService();
