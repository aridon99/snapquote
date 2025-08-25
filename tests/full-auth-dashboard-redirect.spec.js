const { test, expect } = require('@playwright/test');

test('Complete auth flow and dashboard redirect debug', async ({ page }) => {
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

  console.log('\n=== Starting Complete Auth + Dashboard Redirect Debug Test ===\n');

  try {
    // Step 1: Create a test account via signup
    console.log('Step 1: Going to signup page...');
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    const testName = 'Test User';
    
    console.log(`Creating test account with email: ${testEmail}`);
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[placeholder*="name" i]', testName);
    
    // Handle the checkbox - try different approaches
    try {
      // First try clicking the label
      await page.click('label:has-text("contractor")');
    } catch (e) {
      try {
        // If that fails, try clicking the checkbox directly
        await page.click('input[type="checkbox"]');
      } catch (e2) {
        console.log('Could not find contractor checkbox, proceeding...');
      }
    }
    
    // Submit signup form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Step 2: Now try to access setup-profile page
    console.log('\nStep 2: Navigating to setup-profile page after signup...');
    await page.goto('http://localhost:3000/setup-profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to render
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/setup-profile-after-signup.png', fullPage: true });
    
    // Step 3: Analyze current state
    console.log('Step 3: Analyzing page state after signup...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const isLoggedIn = await page.locator('text=✓ Logged in as:').isVisible().catch(() => false);
    const hasProfile = await page.locator('text=✓ Profile exists!').isVisible().catch(() => false);
    const needsProfileCreation = await page.locator('text=📝 No profile found in database').isVisible().catch(() => false);
    const notLoggedIn = await page.locator('text=🔒 Not logged in').isVisible().catch(() => false);
    const dashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
    const createProfileButton = await page.locator('text=Create Profile ✨').isVisible().catch(() => false);
    const updateRoleButton = await page.locator('text=Update Role to Homeowner').isVisible().catch(() => false);
    
    console.log('Page state analysis:');
    console.log('- Is logged in:', isLoggedIn);
    console.log('- Has profile:', hasProfile);
    console.log('- Needs profile creation:', needsProfileCreation);
    console.log('- Not logged in:', notLoggedIn);
    console.log('- Dashboard button visible:', dashboardButton);
    console.log('- Create profile button visible:', createProfileButton);
    console.log('- Update role button visible:', updateRoleButton);
    
    // Step 4: Handle profile creation if needed
    if (createProfileButton) {
      console.log('\nStep 4: Creating profile...');
      await page.click('text=Create Profile ✨');
      await page.waitForTimeout(3000); // Wait for profile creation
      
      // Check state after creation
      const afterCreateDashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
      console.log('Dashboard button visible after profile creation:', afterCreateDashboardButton);
      
      if (afterCreateDashboardButton) {
        dashboardButton = true; // Update our flag
      }
    }
    
    // Step 5: Handle role update if needed
    if (updateRoleButton) {
      console.log('\nStep 5: Updating role to homeowner...');
      await page.click('text=Update Role to Homeowner');
      await page.waitForTimeout(3000); // Wait for role update
      
      // Check state after update
      const afterUpdateDashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
      console.log('Dashboard button visible after role update:', afterUpdateDashboardButton);
      
      if (afterUpdateDashboardButton) {
        dashboardButton = true; // Update our flag
      }
    }
    
    // Step 6: Test the dashboard redirect
    if (dashboardButton || await page.locator('text=Go to Dashboard →').isVisible().catch(() => false)) {
      console.log('\nStep 6: Testing dashboard redirect...');
      
      // Capture console logs before click
      const preClickLogCount = consoleLogs.length;
      console.log('Console logs before clicking dashboard button:');
      consoleLogs.slice(-5).forEach((log, index) => {
        console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
      });
      
      // Take screenshot before click
      await page.screenshot({ path: 'tests/screenshots/before-dashboard-click-full.png', fullPage: true });
      
      // Click the dashboard button
      console.log('Clicking "Go to Dashboard →" button...');
      await page.click('text=Go to Dashboard →');
      
      // Wait for navigation
      console.log('Waiting for navigation...');
      await page.waitForTimeout(3000);
      
      // Capture final state
      const finalUrl = page.url();
      console.log('Final URL after clicking dashboard button:', finalUrl);
      
      await page.screenshot({ path: 'tests/screenshots/after-dashboard-click-full.png', fullPage: true });
      
      // Analyze where we ended up
      const onLoginPage = finalUrl.includes('/login');
      const onDashboardPage = finalUrl.includes('/dashboard');
      const onSetupPage = finalUrl.includes('/setup-profile');
      
      console.log('Final navigation analysis:');
      console.log('- On login page:', onLoginPage);
      console.log('- On dashboard page:', onDashboardPage);
      console.log('- Still on setup page:', onSetupPage);
      
      // Capture console logs after click
      console.log('\nConsole logs after clicking dashboard button:');
      const newLogs = consoleLogs.slice(preClickLogCount);
      newLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
      });
      
      // If we're on dashboard, test if requireHomeowner is working
      if (onDashboardPage) {
        console.log('\n✅ Successfully reached dashboard! Checking for auth debug logs...');
        
        // Look for our debug logs from requireHomeowner
        const authLogs = consoleLogs.filter(log => 
          log.text.includes('getUserWithProfile') || 
          log.text.includes('requireHomeowner') ||
          log.text.includes('Auth error:') ||
          log.text.includes('User from auth:') ||
          log.text.includes('Profile query error:') ||
          log.text.includes('Profile data:')
        );
        
        console.log('\nAuth-related debug logs:');
        authLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
      } else if (onLoginPage) {
        console.log('\n❌ Redirected to login page - this is the bug we\'re debugging!');
        
        // Look for auth debug logs to understand why
        const authLogs = consoleLogs.filter(log => 
          log.text.includes('getUserWithProfile') || 
          log.text.includes('requireHomeowner') ||
          log.text.includes('No user or profile found') ||
          log.text.includes('redirecting to login')
        );
        
        console.log('\nAuth debug logs that led to redirect:');
        authLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
      }
      
    } else {
      console.log('\n❌ Dashboard button not found even after profile setup!');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'tests/screenshots/error-state-full.png', fullPage: true });
  }
  
  // Final comprehensive report
  console.log('\n=== COMPREHENSIVE DEBUG REPORT ===');
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
  
  console.log('\n=== End Comprehensive Report ===\n');
});