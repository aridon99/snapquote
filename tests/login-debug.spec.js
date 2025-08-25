const { test, expect } = require('@playwright/test');

test.describe('Login Debug', () => {
  test('should debug what happens during login attempt', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Current page URL:', page.url());
    
    // Fill in login form with test credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    console.log('Form filled, attempting login...');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait and see what happens
    console.log('Waiting for response...');
    await page.waitForTimeout(5000);
    
    console.log('Current page URL after login attempt:', page.url());
    
    // Check if there are any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-500').count();
    console.log('Error elements found:', errorElements);
    
    if (errorElements > 0) {
      const errorText = await page.locator('[class*="error"], [class*="Error"], .text-red-500').first().textContent();
      console.log('Error message:', errorText);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/login-debug.png'
    });
  });
});