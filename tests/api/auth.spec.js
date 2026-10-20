import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api';

test.describe('Authentication API & User Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `playwright_${Date.now()}@university.edu`,
    phone: '5551234567',
    password: 'securePassword123'
  };

  test('1. Should register a new user successfully (API)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, { data: testUser });
    expect(response.status()).toBe(201);
  });

  test('2. Should reject duplicate registration with same email (API)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, { data: testUser });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('message', 'User already exists');
  });

  test('3. Should login successfully and return a valid JWT token (API)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: testUser.email, password: testUser.password }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
  });

  test('4. Should reject login with invalid credentials (API)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: testUser.email, password: 'wrongpassword' }
    });
    expect(response.status()).toBe(400);
  });

  test('5. Should log in via UI, store JWT token, and navigate to Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Target the input fields sequentially (1st input = email, 2nd input = password)
    await page.locator('input').nth(0).fill(testUser.email);
    await page.locator('input').nth(1).fill(testUser.password);
    
    await page.getByText('Sign In').click();
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();
  });
});