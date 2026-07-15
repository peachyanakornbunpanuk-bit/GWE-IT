import { test, expect } from '@playwright/test';

test.describe('IAMS Enterprise E2E Tests', () => {
  
  test('Login Success (Manager)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the login form
    await expect(page.getByText('IAMS Enterprise')).toBeVisible();

    // Fill credentials
    await page.getByLabel('Username').fill('manager');
    await page.getByLabel('Password').fill('admin');
    
    // Click login
    await page.getByRole('button', { name: 'Secure Login' }).click();

    // Verify redirect to Dashboard (Wait for the Quasar layout to render)
    await expect(page.getByText('Overview')).toBeVisible(); // Dashboard header
  });

  test('Login Failure (Invalid Credentials)', async ({ page }) => {
    await page.goto('/');
    
    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Secure Login' }).click();

    // Expect the Quasar notification for failure
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('Navigation & Rendering (Assets Page)', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel('Username').fill('manager');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: 'Secure Login' }).click();
    await expect(page.getByText('Overview')).toBeVisible();

    // Navigate to Assets
    await page.goto('/asset');
    
    // Verify Assets page loads
    await expect(page.getByText('Asset Inventory')).toBeVisible();
  });

});
