import { test, expect } from '@playwright/test';
test('Inspect DOM', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('manager');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Secure Login' }).click();
  await expect(page.getByText('Overview')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2000); 
  
  const cardHtml = await page.locator('.clean-card.bg-primary').evaluate(el => el.outerHTML).catch(() => 'NOT FOUND');
  console.log('CARD HTML:', cardHtml);
  
  if (cardHtml !== 'NOT FOUND') {
    const bgColor = await page.locator('.clean-card.bg-primary').evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('COMPUTED BACKGROUND COLOR:', bgColor);
    
    const display = await page.locator('.clean-card.bg-primary').evaluate(el => window.getComputedStyle(el).display);
    console.log('COMPUTED DISPLAY:', display);
  }
});
