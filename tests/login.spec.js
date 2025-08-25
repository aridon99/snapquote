const { test, expect } = require('@playwright/test');

test.describe('Login Page', () => {
  test('should load and have proper formatting', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'tests/screenshots/login-page.png', fullPage: true });
    
    // Check basic page structure
    await expect(page).toHaveTitle(/RenovationAdvisor|Login/i);
    
    // Check for the main card container
    const card = page.locator('[class*="max-w-md"]');
    await expect(card).toBeVisible();
    
    // Check for form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Check for Google login button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    // Check for sign up link
    const signUpLink = page.locator('a[href="/signup"]');
    await expect(signUpLink).toBeVisible();
    
    // Check for forgot password link
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
    
    // Log the page content for debugging
    const title = await page.locator('h1, h2').first().textContent();
    console.log('Page title text:', title);
    
    // Check if form is properly centered and styled
    const cardBounds = await card.boundingBox();
    console.log('Card position:', cardBounds);
    
    // Verify no console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
  });
});