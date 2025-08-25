const { test, expect } = require('@playwright/test');

test.describe('Signup Page', () => {
  test('should have proper formatting without overlapping icons', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any CSS animations
    await page.waitForTimeout(1000);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'tests/screenshots/signup-page-full.png', 
      fullPage: true 
    });
    
    // Take a viewport screenshot too
    await page.screenshot({ 
      path: 'tests/screenshots/signup-page-viewport.png'
    });
    
    // Get basic page info
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if main elements exist
    const createAccount = await page.locator('text=Create an Account').count();
    const fullNameInput = await page.locator('input[id="fullName"]').count();
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const createAccountButton = await page.locator('text=Create Account').count();
    const googleButton = await page.locator('text=Continue with Google').count();
    
    console.log('Elements found:');
    console.log('- Create Account heading:', createAccount);
    console.log('- Full Name input:', fullNameInput);
    console.log('- Email input:', emailInput);
    console.log('- Password inputs:', passwordInput);
    console.log('- Create Account button:', createAccountButton);
    console.log('- Google login button:', googleButton);
    
    // Check for any visible error messages or layout issues
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-500').count();
    console.log('- Error elements:', errorElements);
    
    // Get the card element bounds for layout checking
    const wrapper = page.locator('.w-96');
    const wrapperExists = await wrapper.count();
    console.log('- Signup wrapper found:', wrapperExists);
    
    if (wrapperExists > 0) {
      const bounds = await wrapper.boundingBox();
      console.log('Wrapper position and size:', bounds);
    }
  });
});