import { test, expect } from '@playwright/test';
test('Chatbot Screenshot', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('manager');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Secure Login' }).click();
  await expect(page.getByText('Overview')).toBeVisible({ timeout: 5000 });
  
  // Open Chat
  await page.locator('.q-btn.fixed-bottom-right').click();
  await expect(page.getByText('IT Assistant').first()).toBeVisible();
  
  // Type message
  await page.getByPlaceholder('Ask about inventory...').fill('How many laptops are available?');
  await page.locator('button[type="submit"]').click();
  
  // Wait for Gemini API response (spinner disappears, new message appears)
  await page.waitForTimeout(6000);
  
  // Screenshot
  await page.screenshot({ path: 'chatbot_demo.png' });
});
