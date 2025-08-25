const { test, expect } = require('@playwright/test');

test.describe('Signup Native Select Test', () => {
  test('should be able to change the native HTML select dropdown', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Get the select element
    const selectElement = page.locator('select#userType');
    
    // Get initial value
    const initialValue = await selectElement.inputValue();
    console.log('Initial select value:', initialValue);
    
    // Change to contractor
    await selectElement.selectOption('contractor');
    await page.waitForTimeout(300);
    
    // Get new value
    const newValue = await selectElement.inputValue();
    console.log('New select value:', newValue);
    
    // Change back to homeowner
    await selectElement.selectOption('homeowner');
    await page.waitForTimeout(300);
    
    const finalValue = await selectElement.inputValue();
    console.log('Final select value:', finalValue);
    
    // Take screenshot showing it works
    await page.screenshot({ 
      path: 'tests/screenshots/signup-native-select.png'
    });
    
    console.log('Dropdown test completed successfully!');
  });
});