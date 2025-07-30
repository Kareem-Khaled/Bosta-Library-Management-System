const db = require('./connection');

async function addSampleBorrowings() {
  try {
    console.log('Adding sample borrowings...');
    
    // First, get some books and borrowers from the database
    const booksResult = await db.query('SELECT id FROM books LIMIT 10');
    const borrowersResult = await db.query('SELECT id FROM borrowers');
    
    if (booksResult.rows.length === 0) {
      console.log(' No books found in database. Please run "npm run add-books" first.');
      return;
    }
    
    if (borrowersResult.rows.length === 0) {
      console.log(' No borrowers found in database. Please run "npm run add-borrowers" first.');
      return;
    }
    
    const bookIds = booksResult.rows.map(row => row.id);
    const borrowerIds = borrowersResult.rows.map(row => row.id);
    
    console.log(` Found ${bookIds.length} books and ${borrowerIds.length} borrowers`);
    
    // Create sample borrowings with different scenarios
    const sampleBorrowings = [
      // Active borrowings (not returned yet)
      {
        borrower_id: borrowerIds[0],
        book_id: bookIds[0],
        borrow_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        return_date: null
      },
      {
        borrower_id: borrowerIds[1],
        book_id: bookIds[1],
        borrow_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        due_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
        return_date: null
      },
      {
        borrower_id: borrowerIds[2],
        book_id: bookIds[2],
        borrow_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        due_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
        return_date: null
      },
      
      // Overdue borrowings (past due date, not returned)
      {
        borrower_id: borrowerIds[3] || borrowerIds[0],
        book_id: bookIds[3],
        borrow_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days overdue
        return_date: null
      },
      {
        borrower_id: borrowerIds[4] || borrowerIds[1],
        book_id: bookIds[4],
        borrow_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        due_date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days overdue
        return_date: null
      },
      
      // Returned books (completed borrowings)
      {
        borrower_id: borrowerIds[0],
        book_id: bookIds[5],
        borrow_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        due_date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // Due 16 days ago
        return_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) // Returned 18 days ago (on time)
      },
      {
        borrower_id: borrowerIds[1],
        book_id: bookIds[6],
        borrow_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        due_date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // Due 31 days ago
        return_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) // Returned 28 days ago (late)
      },
      {
        borrower_id: borrowerIds[2],
        book_id: bookIds[7],
        borrow_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Due 1 day ago
        return_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Returned 2 days ago (on time)
      }
    ];
    
    let insertedCount = 0;
    let updatedBooks = new Set();
    
    for (const borrowing of sampleBorrowings) {
      try {
        // Insert borrowing record
        await db.query(
          'INSERT INTO borrowings (borrower_id, book_id, borrow_date, due_date, return_date) VALUES ($1, $2, $3, $4, $5)',
          [borrowing.borrower_id, borrowing.book_id, borrowing.borrow_date, borrowing.due_date, borrowing.return_date]
        );
        
        // Update book availability if not returned yet
        if (!borrowing.return_date && !updatedBooks.has(borrowing.book_id)) {
          await db.query(
            'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = $1 AND available_quantity > 0',
            [borrowing.book_id]
          );
          updatedBooks.add(borrowing.book_id);
        }
        
        insertedCount++;
      } catch (error) {
        console.warn(`Failed to insert borrowing record:`, error.message);
      }
    }
    
    console.log(` Successfully added ${insertedCount} borrowing records`);
    console.log(` Borrowing scenarios created:`);
    console.log(`   - ${sampleBorrowings.filter(b => !b.return_date && b.due_date > new Date()).length} active borrowings`);
    console.log(`   - ${sampleBorrowings.filter(b => !b.return_date && b.due_date < new Date()).length} overdue borrowings`);
    console.log(`   - ${sampleBorrowings.filter(b => b.return_date).length} returned books`);
    
  } catch (error) {
    console.error('Error adding sample borrowings:', error);
    throw error;
  }
}

// Run borrowing addition if this file is executed directly
if (require.main === module) {
  addSampleBorrowings()
    .then(() => {
      console.log('Sample borrowings added successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to add sample borrowings:', error);
      process.exit(1);
    });
}

module.exports = { addSampleBorrowings };
