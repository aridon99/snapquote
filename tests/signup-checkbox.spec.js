const { test, expect } = require('@playwright/test');

test.describe('Signup Checkbox Test', () => {
  test('should show visible checkbox that can be clicked', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/signup-checkbox-before.png'
    });
    
    // Check checkbox visibility
    const checkbox = page.locator('#terms');
    const isVisible = await checkbox.isVisible();
    console.log('Checkbox visible:', isVisible);
    
    // Check initial state
    const isChecked = await checkbox.isChecked();
    console.log('Initially checked:', isChecked);
    
    // Click the checkbox to check it
    await checkbox.click();
    await page.waitForTimeout(300);
    
    // Take screenshot after checking
    await page.screenshot({ 
      path: 'tests/screenshots/signup-checkbox-after.png'
    });
    
    // Verify it's now checked
    const isCheckedAfter = await checkbox.isChecked();
    console.log('Checked after click:', isCheckedAfter);
    
    // Try clicking the label too
    const label = page.locator('label[for="terms"]');
    await label.click();
    await page.waitForTimeout(300);
    
    const isCheckedAfterLabel = await checkbox.isChecked();
    console.log('Checked after label click:', isCheckedAfterLabel);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/signup-checkbox-final.png'
    });
  });
});