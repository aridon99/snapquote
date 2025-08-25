const { test, expect } = require('@playwright/test');

test.describe('Signup Native Checkbox Test', () => {
  test('should show clearly visible native checkbox', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if checkbox is visible
    const checkbox = page.locator('input[type="checkbox"]#terms');
    const isVisible = await checkbox.isVisible();
    console.log('Native checkbox visible:', isVisible);
    
    // Check initial state
    const isChecked = await checkbox.isChecked();
    console.log('Initially checked:', isChecked);
    
    // Take screenshot before checking
    await page.screenshot({ 
      path: 'tests/screenshots/signup-native-checkbox-before.png'
    });
    
    // Click to check
    await checkbox.click();
    await page.waitForTimeout(300);
    
    // Verify it's checked
    const isCheckedAfter = await checkbox.isChecked();
    console.log('Checked after click:', isCheckedAfter);
    
    // Take screenshot after checking
    await page.screenshot({ 
      path: 'tests/screenshots/signup-native-checkbox-after.png'
    });
    
    // Click to uncheck
    await checkbox.click();
    await page.waitForTimeout(300);
    
    const isUnchecked = await checkbox.isChecked();
    console.log('Unchecked after second click:', isUnchecked);
    
    // Test label clicking
    const label = page.locator('label[for="terms"]');
    await label.click();
    await page.waitForTimeout(300);
    
    const isCheckedByLabel = await checkbox.isChecked();
    console.log('Checked by label click:', isCheckedByLabel);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/signup-native-checkbox-final.png'
    });
  });
});