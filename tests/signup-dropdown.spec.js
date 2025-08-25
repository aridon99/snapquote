const { test, expect } = require('@playwright/test');

test.describe('Signup Dropdown Test', () => {
  test('should be able to click and change the user type dropdown', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Try to click on the dropdown trigger
    console.log('Clicking on dropdown trigger...');
    const selectTrigger = page.locator('[id="userType"]');
    await selectTrigger.click();
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Check if dropdown content is visible
    const selectContent = page.locator('.z-50');
    const isVisible = await selectContent.isVisible();
    console.log('Dropdown content visible:', isVisible);
    
    if (isVisible) {
      // Try to click on "Contractor" option
      console.log('Clicking on Contractor option...');
      const contractorOption = page.locator('text=Contractor');
      await contractorOption.click();
      
      // Wait and check if the value changed
      await page.waitForTimeout(500);
      const selectedValue = await selectTrigger.textContent();
      console.log('Selected value after click:', selectedValue);
    } else {
      console.log('Dropdown did not open, trying alternative approach...');
      
      // Try using keyboard navigation
      await selectTrigger.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      
      const isVisibleAfterKeyboard = await selectContent.isVisible();
      console.log('Dropdown visible after keyboard:', isVisibleAfterKeyboard);
    }
    
    // Take a screenshot of the current state
    await page.screenshot({ 
      path: 'tests/screenshots/signup-dropdown-test.png'
    });
  });
});