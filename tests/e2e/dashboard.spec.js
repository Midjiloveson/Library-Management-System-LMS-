import { test, expect } from '@playwright/test';

test.describe('Library Management UI', () => {

  test('should load the login page successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await expect(page.locator('input').first()).toBeVisible();
    await expect(
        page.getByRole('button', { name: /sign in/i })
                ).toBeVisible();
  });

});