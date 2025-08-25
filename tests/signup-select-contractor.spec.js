const { test, expect } = require('@playwright/test');

test.describe('Signup Select Contractor', () => {
  test('should be able to select contractor from dropdown', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Get initial value
    const initialValue = await page.locator('#userType').textContent();
    console.log('Initial value:', initialValue);
    
    // Click on the dropdown
    await page.locator('#userType').click();
    await page.waitForTimeout(300);
    
    // Look for and click the contractor option - try different selectors
    const contractorSelectors = [
      '[role="option"][data-value="contractor"]',
      'text=Contractor',
      '[data-radix-select-item][data-value="contractor"]'
    ];
    
    let contractorClicked = false;
    for (const selector of contractorSelectors) {
      const contractorOption = page.locator(selector);
      const count = await contractorOption.count();
      console.log(`Contractor options with selector "${selector}":`, count);
      
      if (count > 0) {
        // Try to click the first visible one
        await contractorOption.first().click();
        contractorClicked = true;
        console.log(`Successfully clicked contractor with selector: ${selector}`);
        break;
      }
    }
    
    if (!contractorClicked) {
      console.log('Could not find contractor option, trying to click any visible "Contractor" text');
      const allContractorTexts = page.locator('text=Contractor');
      const count = await allContractorTexts.count();
      console.log('Total "Contractor" text elements:', count);
      
      if (count > 0) {
        // Click the last one (likely the dropdown option)
        await allContractorTexts.last().click();
      }
    }
    
    // Wait and check the final value
    await page.waitForTimeout(500);
    const finalValue = await page.locator('#userType').textContent();
    console.log('Final value:', finalValue);
    console.log('Successfully changed:', initialValue !== finalValue);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/signup-contractor-selected.png'
    });
  });
});