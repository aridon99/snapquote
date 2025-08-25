import { test, expect } from '@playwright/test';

test('Full page screenshot with brand colors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Take a full page screenshot
  await page.screenshot({ 
    path: 'test-results/full-landing-page.png', 
    fullPage: true 
  });
  
  // Test that key brand elements are visible
  await expect(page.locator('text=RenovationAdvisor')).toBeVisible();
  await expect(page.locator('text=Get Your Free Quote')).toBeVisible();
  await expect(page.locator('text=Your Dream Home')).toBeVisible();
  
  console.log('Full page screenshot saved');
});