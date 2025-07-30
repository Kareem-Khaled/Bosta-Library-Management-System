const db = require('./connection');

async function addSampleBorrowers() {
  try {
    console.log('Adding sample borrowers...');
    
    // Sample borrowers
    const borrowers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      },
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com'
      },
      {
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com'
      },
      {
        name: 'Emma Davis',
        email: 'emma.davis@example.com'
      }
    ];
    
    let insertedCount = 0;
    for (const borrower of borrowers) {
      try {
        await db.query(
          'INSERT INTO borrowers (name, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
          [borrower.name, borrower.email]
        );
        insertedCount++;
      } catch (error) {
        console.warn(`Failed to insert borrower: ${borrower.name}`, error.message);
      }
    }
    
    console.log(`Successfully added ${insertedCount} borrowers to database`);
    
  } catch (error) {
    console.error('Error adding borrowers:', error);
    throw error;
  }
}

// Run borrower addition if this file is executed directly
if (require.main === module) {
  addSampleBorrowers()
    .then(() => {
      console.log('Borrowers added successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to add borrowers:', error);
      process.exit(1);
    });
}

module.exports = { addSampleBorrowers };
