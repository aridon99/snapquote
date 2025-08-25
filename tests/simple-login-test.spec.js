const { test, expect } = require('@playwright/test');

test.describe('Login Page Visual Test', () => {
  test('capture login page screenshot', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any CSS animations
    await page.waitForTimeout(1000);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'tests/screenshots/login-page-full.png', 
      fullPage: true 
    });
    
    // Take a viewport screenshot too
    await page.screenshot({ 
      path: 'tests/screenshots/login-page-viewport.png'
    });
    
    // Get basic page info
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if main elements exist
    const welcomeBack = await page.locator('text=Welcome Back').count();
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const signInButton = await page.locator('text=Sign In').count();
    const googleButton = await page.locator('text=Continue with Google').count();
    
    console.log('Elements found:');
    console.log('- Welcome Back heading:', welcomeBack);
    console.log('- Email input:', emailInput);
    console.log('- Password input:', passwordInput);
    console.log('- Sign In button:', signInButton);
    console.log('- Google login button:', googleButton);
    
    // Check for any visible error messages or layout issues
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-500').count();
    console.log('- Error elements:', errorElements);
    
    // Get the card element bounds for layout checking
    const wrapper = page.locator('.w-96');
    const wrapperExists = await wrapper.count();
    console.log('- Login wrapper found:', wrapperExists);
    
    if (wrapperExists > 0) {
      const bounds = await wrapper.boundingBox();
      console.log('Wrapper position and size:', bounds);
    }
    
    const card = page.locator('div.w-96 > div[class*="shadow"]');
    const cardExists = await card.count();
    console.log('- Card element found:', cardExists);
    
    if (cardExists > 0) {
      const cardBounds = await card.boundingBox();
      console.log('Card position and size:', cardBounds);
    }
  });
});