const { test, expect } = require('@playwright/test');

test.describe('Full Auth Flow', () => {
  test('should create account and then login successfully', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log('Testing with email:', testEmail);
    
    // Step 1: Create account
    console.log('=== CREATING ACCOUNT ===');
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Fill signup form
    await page.fill('#fullName', 'Test User');
    await page.fill('#email', testEmail);
    await page.selectOption('#userType', 'homeowner');
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);
    await page.check('#terms');
    
    // Submit signup
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('After signup, current URL:', page.url());
    
    // Step 2: Try to login
    console.log('=== TRYING LOGIN ===');
    
    // If redirected to login, try logging in
    if (page.url().includes('/login')) {
      console.log('Redirected to login page, attempting login...');
      
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      console.log('After login attempt, current URL:', page.url());
      
      // Check for success message
      const toastMessages = await page.locator('[role="status"], .toast, [class*="toast"]').count();
      console.log('Toast messages found:', toastMessages);
      
      if (toastMessages > 0) {
        const toastText = await page.locator('[role="status"], .toast, [class*="toast"]').first().textContent();
        console.log('Toast message:', toastText);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/full-auth-flow.png'
    });
  });
});