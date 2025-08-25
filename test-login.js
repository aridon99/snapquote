const { test, expect } = require('@playwright/test');

test('Login page formatting test', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:3000/login');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'login-page-screenshot.png', fullPage: true });
  
  // Check if the page loaded without errors
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for basic elements that should be present
  const loginForm = await page.$('form');
  if (loginForm) {
    console.log('✓ Login form found');
  } else {
    console.log('✗ Login form not found');
  }
  
  // Check for input fields
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  
  if (emailInput) {
    console.log('✓ Email input found');
  } else {
    console.log('✗ Email input not found');
  }
  
  if (passwordInput) {
    console.log('✓ Password input found');
  } else {
    console.log('✗ Password input not found');
  }
  
  // Check for submit button
  const submitButton = await page.$('button[type="submit"], input[type="submit"]');
  if (submitButton) {
    console.log('✓ Submit button found');
  } else {
    console.log('✗ Submit button not found');
  }
  
  // Get page content for debugging
  const bodyContent = await page.textContent('body');
  console.log('Page content preview:', bodyContent.substring(0, 200) + '...');
  
  // Check for any error messages on the page
  const errorElements = await page.$$('[class*="error"], [class*="Error"], .text-red-500');
  if (errorElements.length > 0) {
    console.log(`Found ${errorElements.length} potential error elements`);
  }
});