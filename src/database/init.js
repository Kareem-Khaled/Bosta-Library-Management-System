const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('./sequelize');
const Book = require('../models/Book');
const Borrower = require('../models/Borrower');
const Borrowing = require('../models/Borrowing');

async function createDatabaseIfNotExists() {
  try {
    console.log(' Checking if database exists...');
    
    // Get database config from environment or default values
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'password';
    const dbName = process.env.DB_NAME || 'library_management';
    
    // Create a connection to PostgreSQL without specifying database
    const adminSequelize = new Sequelize('postgres', dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: false // Disable logging for cleaner output
    });
    
    try {
      // Test connection to PostgreSQL server
      await adminSequelize.authenticate();
      console.log(' Connected to PostgreSQL server');
      
      // Check if database exists
      const [results] = await adminSequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
      );
      
      if (results.length === 0) {
        console.log(`  Database '${dbName}' does not exist. Creating it...`);
        await adminSequelize.query(`CREATE DATABASE "${dbName}"`);
        console.log(` Database '${dbName}' created successfully`);
      } else {
        console.log(` Database '${dbName}' already exists`);
      }
      
      await adminSequelize.close();
      return true;
      
    } catch (error) {
      await adminSequelize.close();
      throw error;
    }
    
  } catch (error) {
    console.error(' Error creating database:', error.message);
    console.log(' Make sure PostgreSQL is running and credentials are correct');
    return false;
  }
}

async function createTablesIfNotExist() {
  try {
    console.log('🔧 Creating database tables if they don\'t exist...');
    
    // Sync all models (create tables)
    await sequelize.sync({ alter: false });
    console.log(' Database tables ready');
    
    return true;
  } catch (error) {
    console.error(' Error creating tables:', error);
    return false;
  }
}

async function resetDatabase() {
  try {
    console.log(' Resetting database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log(' Database connection established successfully');
    
    // Clear all data in correct order (respecting foreign keys)
    // Use DELETE instead of TRUNCATE to avoid foreign key constraint issues
    await Borrowing.destroy({ where: {}, force: true });
    await Book.destroy({ where: {}, force: true });
    await Borrower.destroy({ where: {}, force: true });
    
    console.log('  All existing data cleared');
    
    return true;
  } catch (error) {
    console.error(' Error resetting database:', error);
    return false;
  }
}

async function addBooksToDatabase(shouldReset = false) {
  try {
    console.log(' Initializing Library Database...');
    
    // Create database if it doesn't exist
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      throw new Error('Failed to create database');
    }
    
    // Create tables if they don't exist
    const tablesCreated = await createTablesIfNotExist();
    if (!tablesCreated) {
      throw new Error('Failed to create database tables');
    }
    
    // Reset database if requested
    if (shouldReset) {
      const resetSuccess = await resetDatabase();
      if (!resetSuccess) {
        throw new Error('Failed to reset database');
      }
    } else {
      // Test database connection
      await sequelize.authenticate();
      console.log(' Database connection established successfully');
    }
    
    // Check current book count
    const existingCount = await Book.count();
    console.log(` Current books in database: ${existingCount}`);
    
    if (existingCount > 0 && !shouldReset) {
      console.log('  Database already contains books. Adding only new books...');
    }
    
    // Fetch and insert real book data from API
    await fetchAndInsertBooksFromAPI();
    
    // Add sample borrowers and borrowings
    await addSampleBorrowersAndBorrowings();
    
    // Final count
    const finalCount = await Book.count();
    const borrowerCount = await Borrower.count();
    const borrowingCount = await Borrowing.count();
    console.log(' Database initialization complete!');
    console.log(` Total books: ${finalCount}`);
    console.log(` Total borrowers: ${borrowerCount}`);
    console.log(` Total borrowings: ${borrowingCount}`);
    process.exit(0);
  } catch (error) {
    console.error(' Error initializing database:', error);
    process.exit(1);
  }
}

async function fetchAndInsertBooksFromAPI() {
  try {
    console.log(' Fetching random books from Google Books API...');
    
    const allBooks = [];
    
    // Fetch multiple pages of random books
    for (let startIndex = 0; startIndex < 40; startIndex += 10) {
      try {
        // Fetch random books by using a broad search and different start indices
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=10&startIndex=${startIndex}&langRestrict=en`);
        
        if (!response.ok) {
          console.warn(`  Failed to fetch books at index ${startIndex}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            const volumeInfo = item.volumeInfo;
            
            // Extract book information
            const totalCopies = Math.floor(Math.random() * 5) + 1; // Random 1-5 total copies
            const borrowedCopies = Math.floor(Math.random() * totalCopies); // Random borrowed (0 to totalCopies-1)
            const book = {
              title: volumeInfo.title || 'Unknown Title',
              author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
              isbn: extractISBN(volumeInfo.industryIdentifiers),
              quantity: totalCopies, // Total copies owned by library
              available_quantity: totalCopies - borrowedCopies, // Available = Total - Borrowed
              shelf_location: generateShelfLocation()
            };
            
            // Only add books with valid ISBN
            if (book.isbn) {
              allBooks.push(book);
            }
          }
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.warn(`  Error fetching books at index ${startIndex}:`, error.message);
        continue;
      }
    }
    
    console.log(` Fetched ${allBooks.length} books from API`);
    
    // Show the first 5 books as preview
    console.log('\n Preview of fetched books:');
    console.log('================================');
    allBooks.slice(0, 5).forEach((book, index) => {
      console.log(`${index + 1}. Title: ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   ISBN: ${book.isbn}`);
      console.log(`   Total Copies: ${book.quantity}`);
      console.log(`   Available: ${book.available_quantity}`);
      console.log(`   Shelf: ${book.shelf_location}`);
      console.log('   ---');
    });
    console.log(`... and ${allBooks.length - 5} more books\n`);
    
    // Insert books into database using Sequelize ORM
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const book of allBooks) {
      try {
        const [bookInstance, created] = await Book.findOrCreate({
          where: { isbn: book.isbn },
          defaults: book
        });
        
        if (created) {
          insertedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.warn(`  Failed to insert book: ${book.title} - ${error.message}`);
      }
    }
    
    console.log(` Successfully inserted ${insertedCount} new books`);
    if (skippedCount > 0) {
      console.log(`  Skipped ${skippedCount} books (already exist)`);
    }
    
  } catch (error) {
    console.error(' Error fetching books from API:', error);
    throw error; // Don't fallback, just throw the error
  }
}

async function addSampleBorrowersAndBorrowings() {
  try {
    console.log(' Adding sample borrowers...');
    
    const sampleBorrowers = [
      { name: 'John Doe', email: 'john.doe@example.com' },
      { name: 'Jane Smith', email: 'jane.smith@example.com' },
      { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
      { name: 'Bob Wilson', email: 'bob.wilson@example.com' },
      { name: 'Emma Davis', email: 'emma.davis@example.com' }
    ];
    
    let borrowerCount = 0;
    for (const borrowerData of sampleBorrowers) {
      const [borrower, created] = await Borrower.findOrCreate({
        where: { email: borrowerData.email },
        defaults: borrowerData
      });
      if (created) borrowerCount++;
    }
    
    console.log(` Added ${borrowerCount} new borrowers`);
    
    // Add sample borrowings
    console.log(' Adding sample borrowings...');
    
    const books = await Book.findAll({ limit: 10 });
    const borrowers = await Borrower.findAll();
    
    if (books.length > 0 && borrowers.length > 0) {
      const sampleBorrowings = [
        {
          borrower_id: borrowers[0].id,
          book_id: books[0].id,
          borrow_date: new Date('2025-07-15'),
          due_date: new Date('2025-07-29')
        },
        {
          borrower_id: borrowers[1].id,
          book_id: books[1].id,
          borrow_date: new Date('2025-07-20'),
          due_date: new Date('2025-08-03')
        },
        {
          borrower_id: borrowers[2].id,
          book_id: books[2].id,
          borrow_date: new Date('2025-07-25'),
          due_date: new Date('2025-08-08')
        }
      ];
      
      let borrowingCount = 0;
      for (const borrowingData of sampleBorrowings) {
        try {
          const existingBorrowing = await Borrowing.findOne({
            where: {
              borrower_id: borrowingData.borrower_id,
              book_id: borrowingData.book_id,
              return_date: null
            }
          });
          
          if (!existingBorrowing) {
            await Borrowing.create(borrowingData);
            borrowingCount++;
          }
        } catch (error) {
          console.warn(`  Failed to create borrowing: ${error.message}`);
        }
      }
      
      console.log(` Added ${borrowingCount} new borrowings`);
    }
    
  } catch (error) {
    console.error(' Error adding sample data:', error);
  }
}

function extractISBN(industryIdentifiers) {
  if (!industryIdentifiers) return null;
  
  // Prefer ISBN_13, then ISBN_10
  const isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13');
  if (isbn13) return isbn13.identifier;
  
  const isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10');
  if (isbn10) return isbn10.identifier;
  
  return null;
}

function generateShelfLocation() {
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const section = sections[Math.floor(Math.random() * sections.length)];
  const row = Math.floor(Math.random() * 5) + 1;
  const position = Math.floor(Math.random() * 20) + 1;
  return `${section}${row}-${position.toString().padStart(2, '0')}`;
}

// Run book addition if this file is executed directly
if (require.main === module) {
  // Check if --reset flag is passed
  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    console.log(' Reset flag detected - will clear all existing data first');
  }
  addBooksToDatabase(shouldReset);
}

module.exports = { 
  addBooksToDatabase, 
  fetchAndInsertBooksFromAPI, 
  resetDatabase,
  createDatabaseIfNotExists,
  createTablesIfNotExist
};
