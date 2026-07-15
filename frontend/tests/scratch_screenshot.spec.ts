import { test, expect } from '@playwright/test';
test('Dashboard Screenshot', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('/login');
  await page.getByLabel('Username').fill('manager');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Secure Login' }).click();
  await expect(page.getByText('Overview')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2000); 
  console.log('Test complete');
});
