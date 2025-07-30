const request = require('supertest');
const app = require('../src/server');

describe('Library Management System API', () => {
  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Library Management System API is running');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return API documentation', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.documentation).toBeDefined();
    });
  });

  describe('Books API', () => {
    test('GET /api/books should return books list', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/books should validate required fields', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation error');
    });
  });

  describe('Borrowers API', () => {
    test('GET /api/borrowers should return borrowers list', async () => {
      const response = await request(app)
        .get('/api/borrowers')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/borrowers should validate email format', async () => {
      const response = await request(app)
        .post('/api/borrowers')
        .send({
          name: 'Test User',
          email: 'invalid-email'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation error');
    });
  });

  describe('Borrowings API', () => {
    test('GET /api/borrowings should return borrowings list', async () => {
      const response = await request(app)
        .get('/api/borrowings')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/borrowings should validate required fields', async () => {
      const response = await request(app)
        .post('/api/borrowings')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation error');
    });
  });

  describe('404 Handling', () => {
    test('Unknown routes should return 404', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Route /api/unknown not found');
    });
  });
});
