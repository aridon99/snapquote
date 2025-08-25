import { test } from '@playwright/test';

test('Simple color test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of just the hero section to see colors
  const heroSection = page.locator('section').first();
  await heroSection.screenshot({ 
    path: 'test-results/hero-colors-test.png',
  });
  
  console.log('Hero color test screenshot saved');
});