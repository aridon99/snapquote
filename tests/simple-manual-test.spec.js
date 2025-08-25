const { test, expect } = require('@playwright/test');

test.describe('Manual Login Test', () => {
  test('should test with actual manual credentials', async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('=== LOGIN PAGE LOADED ===');
    console.log('Current URL:', page.url());
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'tests/screenshots/login-before.png'
    });
    
    // Check if form exists
    const emailInput = await page.locator('#email').count();
    const passwordInput = await page.locator('#password').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('Form elements found:');
    console.log('- Email input:', emailInput);
    console.log('- Password input:', passwordInput);  
    console.log('- Submit button:', submitButton);
    
    // Fill form with known credentials (you should create this account manually first)
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    console.log('=== FORM FILLED ===');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: 'tests/screenshots/login-filled.png'
    });
    
    // Click submit and monitor what happens
    console.log('=== CLICKING SUBMIT ===');
    await page.click('button[type="submit"]');
    
    // Wait for any response
    await page.waitForTimeout(3000);
    
    console.log('=== AFTER SUBMIT ===');
    console.log('Current URL:', page.url());
    
    // Check for success/error messages
    const toastMessages = await page.locator('[role="status"], .Toastify__toast, [data-testid="toast"]').count();
    console.log('Toast messages found:', toastMessages);
    
    // Check for any error text on page
    const errorText = await page.locator('[class*="error"], [class*="Error"], .text-red-500').count();
    console.log('Error elements found:', errorText);
    
    if (errorText > 0) {
      const errorContent = await page.locator('[class*="error"], [class*="Error"], .text-red-500').first().textContent();
      console.log('Error message:', errorContent);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/login-after.png'
    });
    
    // Wait longer to see if any delayed redirect happens
    console.log('=== WAITING FOR POTENTIAL REDIRECT ===');
    await page.waitForTimeout(5000);
    
    console.log('Final URL after wait:', page.url());
    
    // Final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/login-final.png'
    });
  });
});