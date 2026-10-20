const { test, expect } = require('@playwright/test');

test.describe('Library API Endpoints', () => {
  
  test('should fetch all books successfully', async ({ request }) => {
    // Assuming your server runs on port 5000
    const response = await request.get('http://localhost:5000/api/books');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('books');
    expect(Array.isArray(data.books)).toBeTruthy();
  });

  test('should return 400 or error on search with missing query parameters', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/books/search');
    expect(response.status()).toBe(400);
  });

});