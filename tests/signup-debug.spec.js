const { test, expect } = require('@playwright/test');

test.describe('Signup Debug', () => {
  test('should debug dropdown issues and check for console errors', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if the select elements exist
    const selectRoot = await page.locator('[role="combobox"]').count();
    const selectTrigger = await page.locator('#userType').count();
    const selectValue = await page.locator('[data-placeholder]').count();
    
    console.log('Select elements found:');
    console.log('- Select root (combobox):', selectRoot);
    console.log('- Select trigger (ID):', selectTrigger);
    console.log('- Select value elements:', selectValue);
    
    // Try to get the current value
    if (selectTrigger > 0) {
      const currentValue = await page.locator('#userType').textContent();
      console.log('Current dropdown value:', currentValue);
      
      // Try to force click
      await page.locator('#userType').click({ force: true });
      await page.waitForTimeout(500);
      
      // Check if dropdown opened by looking for select items
      const homeownerOption = await page.locator('text=Homeowner').count();
      const contractorOption = await page.locator('text=Contractor').count();
      
      console.log('Options visible after force click:');
      console.log('- Homeowner option:', homeownerOption);
      console.log('- Contractor option:', contractorOption);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/signup-debug.png'
    });
  });
});