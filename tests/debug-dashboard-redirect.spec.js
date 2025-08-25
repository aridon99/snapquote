const { test, expect } = require('@playwright/test');

test('Debug Go to Dashboard redirect issue', async ({ page }) => {
  // Collect all console logs
  const consoleLogs = [];
  
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`[${logEntry.timestamp}] [${logEntry.type.toUpperCase()}] ${logEntry.text}`);
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    pageErrors.push(errorEntry);
    console.log(`[${errorEntry.timestamp}] [PAGE ERROR] ${errorEntry.message}`);
  });

  // Collect network failures
  const networkErrors = [];
  page.on('requestfailed', (request) => {
    const failureEntry = {
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    };
    networkErrors.push(failureEntry);
    console.log(`[${failureEntry.timestamp}] [NETWORK ERROR] ${failureEntry.method} ${failureEntry.url} - ${failureEntry.failure?.errorText}`);
  });

  console.log('\n=== Starting Dashboard Redirect Debug Test ===\n');

  try {
    // Step 1: Navigate to setup-profile page
    console.log('Step 1: Navigating to setup-profile page...');
    await page.goto('http://localhost:3000/setup-profile');
    
    // Wait for page to load completely
    console.log('Step 2: Waiting for page to load completely...');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/setup-profile-initial.png', fullPage: true });
    
    // Step 3: Check what's currently displayed on the page
    console.log('Step 3: Analyzing page content...');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for various possible states
    const isLoggedIn = await page.locator('text=✓ Logged in as:').isVisible().catch(() => false);
    const hasProfile = await page.locator('text=✓ Profile exists!').isVisible().catch(() => false);
    const needsProfileCreation = await page.locator('text=📝 No profile found in database').isVisible().catch(() => false);
    const notLoggedIn = await page.locator('text=🔒 Not logged in').isVisible().catch(() => false);
    const dashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
    
    console.log('Page state analysis:');
    console.log('- Is logged in:', isLoggedIn);
    console.log('- Has profile:', hasProfile);
    console.log('- Needs profile creation:', needsProfileCreation);
    console.log('- Not logged in:', notLoggedIn);
    console.log('- Dashboard button visible:', dashboardButton);
    
    // Step 4: Capture console logs before clicking
    console.log('\nStep 4: Current console logs before clicking:');
    consoleLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });
    
    // Step 5: Look for and click the "Go to Dashboard" button
    console.log('\nStep 5: Looking for "Go to Dashboard →" button...');
    
    if (dashboardButton) {
      // Capture before click
      await page.screenshot({ path: 'tests/screenshots/before-dashboard-click.png', fullPage: true });
      
      console.log('Found "Go to Dashboard →" button, clicking...');
      
      // Clear previous logs and click
      const preClickLogCount = consoleLogs.length;
      await page.locator('text=Go to Dashboard →').click();
      
      // Step 6: Wait for navigation and capture what happens
      console.log('Step 6: Waiting for navigation...');
      await page.waitForTimeout(3000); // Give it time to navigate
      
      const finalUrl = page.url();
      console.log('Final URL after click:', finalUrl);
      
      // Take screenshot of final state
      await page.screenshot({ path: 'tests/screenshots/after-dashboard-click.png', fullPage: true });
      
      // Step 7: Analyze where we ended up
      console.log('\nStep 7: Analyzing final page state...');
      const finalTitle = await page.title();
      console.log('Final page title:', finalTitle);
      
      const onLoginPage = finalUrl.includes('/login');
      const onDashboardPage = finalUrl.includes('/dashboard');
      const onSetupPage = finalUrl.includes('/setup-profile');
      
      console.log('Final page analysis:');
      console.log('- On login page:', onLoginPage);
      console.log('- On dashboard page:', onDashboardPage);
      console.log('- Still on setup page:', onSetupPage);
      
      // Step 8: Capture console logs after click
      console.log('\nStep 8: Console logs after clicking:');
      const newLogs = consoleLogs.slice(preClickLogCount);
      newLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
      });
      
    } else {
      console.log('❌ "Go to Dashboard →" button not found!');
      
      // Check what buttons are available
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      
      // Check if we need to login first
      if (notLoggedIn) {
        console.log('User is not logged in. Need to login first.');
      } else if (needsProfileCreation) {
        console.log('User needs to create profile first.');
      } else {
        console.log('Unexpected page state.');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'tests/screenshots/error-state.png', fullPage: true });
  }
  
  // Final report
  console.log('\n=== FINAL DEBUG REPORT ===');
  console.log('\n--- All Console Logs ---');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.timestamp}] [${log.type}] ${log.text}`);
  });
  
  if (pageErrors.length > 0) {
    console.log('\n--- Page Errors ---');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.timestamp}] ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack}`);
      }
    });
  }
  
  if (networkErrors.length > 0) {
    console.log('\n--- Network Errors ---');
    networkErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.timestamp}] ${error.method} ${error.url} - ${error.failure?.errorText}`);
    });
  }
  
  console.log('\n=== End Debug Report ===\n');
});