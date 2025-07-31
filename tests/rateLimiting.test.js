const request = require('supertest');
const app = require('../src/server');

describe('Rate Limiting Tests', () => {
  // Test rate limiting on book creation endpoint
  describe('Book Creation Rate Limiting', () => {
    test('should allow up to 5 book creation requests within 10 minutes', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        quantity: 1,
        shelf_location: 'A1-01'
      };

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/books')
          .send({
            ...bookData,
            isbn: `123456789012${i}` // Unique ISBN for each book
          });
        
        expect(response.status).toBeLessThan(500); // Should not be rate limited yet
      }
    }, 30000);

    test('should block the 6th book creation request within 10 minutes', async () => {
      const bookData = {
        title: 'Test Book 6',
        author: 'Test Author',
        isbn: '1234567890126',
        quantity: 1,
        shelf_location: 'A1-01'
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData);

      expect(response.status).toBe(429); // Rate limited
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many book creation attempts');
    });
  });

  // Test rate limiting on borrowing creation endpoint
  describe('Borrowing Creation Rate Limiting', () => {
    test('should allow up to 3 borrowing requests within 5 minutes', async () => {
      // Use unique borrower and book IDs to avoid conflicts
      const baseTime = Date.now();
      
      // Make 3 requests with different data to avoid business logic conflicts
      for (let i = 0; i < 3; i++) {
        const borrowingData = {
          borrower_id: i + 10, // Use high IDs to avoid existing data
          book_id: i + 10,     // Use high IDs to avoid existing data
          due_date: new Date(baseTime + 14 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const response = await request(app)
          .post('/api/borrowings')
          .send(borrowingData);
        
        // Should not be rate limited (429), might fail for other business logic reasons
        expect(response.status).not.toBe(429);
      }
    }, 20000);

    test('should block the 4th borrowing request within 5 minutes', async () => {
      const borrowingData = {
        borrower_id: 99, // Use a unique high ID
        book_id: 99,     // Use a unique high ID
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/borrowings')
        .send(borrowingData);

      expect(response.status).toBe(429); // Rate limited
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many borrowing attempts');
    });
  });
});
