const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function addBooksToDatabase() {
  try {
    console.log('Adding books to database...');
    
    // Fetch and insert real book data from API
    await fetchAndInsertBooksFromAPI();
    
    console.log('Books added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding books to database:', error);
    process.exit(1);
  }
}

async function fetchAndInsertBooksFromAPI() {
  try {
    console.log('Fetching random books from Google Books API...');
    
    const allBooks = [];
    
    // Fetch multiple pages of random books
    for (let startIndex = 0; startIndex < 40; startIndex += 10) {
      try {
        // Fetch random books by using a broad search and different start indices
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=10&startIndex=${startIndex}&langRestrict=en`);
        
        if (!response.ok) {
          console.warn(`Failed to fetch books at index ${startIndex}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            const volumeInfo = item.volumeInfo;
            
            // Extract book information
            const book = {
              title: volumeInfo.title || 'Unknown Title',
              author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
              isbn: extractISBN(volumeInfo.industryIdentifiers),
              available_quantity: Math.floor(Math.random() * 5) + 1, // Random quantity 1-5
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
        console.warn(`Error fetching books at index ${startIndex}:`, error.message);
        continue;
      }
    }
    
    console.log(`Fetched ${allBooks.length} books from API`);
    
    // Show the first 5 books as preview
    console.log('\n Preview of fetched books:');
    console.log('================================');
    allBooks.slice(0, 5).forEach((book, index) => {
      console.log(`${index + 1}. Title: ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   ISBN: ${book.isbn}`);
      console.log(`   Quantity: ${book.available_quantity}`);
      console.log(`   Shelf: ${book.shelf_location}`);
      console.log('   ---');
    });
    console.log(`... and ${allBooks.length - 5} more books\n`);
    
    // Insert books into database
    let insertedCount = 0;
    for (const book of allBooks) {
      try {
        await db.query(
          'INSERT INTO books (title, author, isbn, available_quantity, shelf_location) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (isbn) DO NOTHING',
          [book.title, book.author, book.isbn, book.available_quantity, book.shelf_location]
        );
        insertedCount++;
      } catch (error) {
        console.warn(`Failed to insert book: ${book.title}`, error.message);
      }
    }
    
    console.log(`Successfully inserted ${insertedCount} books into database`);
    
  } catch (error) {
    console.error('Error fetching books from API:', error);
    throw error; // Don't fallback, just throw the error
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
  addBooksToDatabase();
}

module.exports = { addBooksToDatabase, fetchAndInsertBooksFromAPI };
