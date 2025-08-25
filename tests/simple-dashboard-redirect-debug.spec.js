const { test, expect } = require('@playwright/test');

test('Simple dashboard redirect debug with manual auth state', async ({ page }) => {
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

  console.log('\n=== Simple Dashboard Redirect Debug Test ===\n');

  try {
    // First, let's try a simple login via the login page
    console.log('Step 1: Attempting login via login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Use a simple test account - let's try some common test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'test123';
    
    console.log(`Trying to login with: ${testEmail}`);
    
    // Fill login form if available
    try {
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('Login form submitted');
    } catch (e) {
      console.log('Login form not found or failed, proceeding to setup-profile anyway...');
    }
    
    // Now navigate to setup-profile to see what state we're in
    console.log('\nStep 2: Navigating to setup-profile...');
    await page.goto('http://localhost:3000/setup-profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give React time to render
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/setup-profile-state.png', fullPage: true });
    
    // Step 3: Analyze current state
    console.log('Step 3: Analyzing page state...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check all possible states
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
    
    // Get the page content to understand what's showing
    const pageContent = await page.textContent('body');
    console.log('\nPage contains:', pageContent.substring(0, 500) + '...');
    
    // If we can find any interactive elements, try to progress through the flow
    if (createProfileButton) {
      console.log('\nStep 4: Creating profile...');
      await page.click('text=Create Profile ✨');
      await page.waitForTimeout(5000); // Wait longer for profile creation
      
      // Check if dashboard button appears after profile creation
      const afterCreateDashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
      console.log('Dashboard button visible after profile creation:', afterCreateDashboardButton);
      
      if (afterCreateDashboardButton) {
        console.log('\nStep 5: Testing dashboard redirect...');
        
        // Capture console logs before click
        const preClickLogCount = consoleLogs.length;
        console.log('Console logs before clicking dashboard button (last 5):');
        consoleLogs.slice(-5).forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        // Take screenshot before click
        await page.screenshot({ path: 'tests/screenshots/before-dashboard-click-simple.png', fullPage: true });
        
        // Click the dashboard button
        console.log('Clicking "Go to Dashboard →" button...');
        await page.click('text=Go to Dashboard →');
        
        // Wait for navigation and monitor console logs
        console.log('Waiting for navigation...');
        await page.waitForTimeout(5000);
        
        // Capture final state
        const finalUrl = page.url();
        console.log('Final URL after clicking dashboard button:', finalUrl);
        
        await page.screenshot({ path: 'tests/screenshots/after-dashboard-click-simple.png', fullPage: true });
        
        // Analyze where we ended up
        const onLoginPage = finalUrl.includes('/login');
        const onDashboardPage = finalUrl.includes('/dashboard');
        const onSetupPage = finalUrl.includes('/setup-profile');
        
        console.log('Final navigation analysis:');
        console.log('- On login page:', onLoginPage);
        console.log('- On dashboard page:', onDashboardPage);
        console.log('- Still on setup page:', onSetupPage);
        
        // Capture console logs after click - this is key for debugging
        console.log('\nConsole logs after clicking dashboard button:');
        const newLogs = consoleLogs.slice(preClickLogCount);
        newLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        // Look specifically for auth-related logs
        const authLogs = consoleLogs.filter(log => 
          log.text.includes('getUserWithProfile') || 
          log.text.includes('requireHomeowner') ||
          log.text.includes('Auth error:') ||
          log.text.includes('User from auth:') ||
          log.text.includes('Profile query error:') ||
          log.text.includes('Profile data:') ||
          log.text.includes('No user or profile found') ||
          log.text.includes('redirecting to login') ||
          log.text.includes('Redirecting to dashboard')
        );
        
        console.log('\n🔍 Auth-related debug logs:');
        authLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        if (onLoginPage) {
          console.log('\n❌ BUG CONFIRMED: Redirected to login page instead of dashboard!');
          console.log('This indicates the auth check in requireHomeowner() is failing.');
        } else if (onDashboardPage) {
          console.log('\n✅ SUCCESS: Reached dashboard as expected!');
        }
      }
    } else if (updateRoleButton) {
      console.log('\nStep 4: Updating role to homeowner...');
      await page.click('text=Update Role to Homeowner');
      await page.waitForTimeout(5000);
      
      // Then try dashboard redirect
      const afterUpdateDashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
      if (afterUpdateDashboardButton) {
        // Same dashboard test flow as above
        console.log('Testing dashboard redirect after role update...');
        await page.click('text=Go to Dashboard →');
        await page.waitForTimeout(5000);
        
        const finalUrl = page.url();
        console.log('Final URL after role update and dashboard click:', finalUrl);
      }
    } else if (dashboardButton) {
      console.log('\nStep 4: Profile already ready, testing dashboard redirect...');
      
      // Direct dashboard test
      const preClickLogCount = consoleLogs.length;
      await page.click('text=Go to Dashboard →');
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      const newLogs = consoleLogs.slice(preClickLogCount);
      console.log('Console logs after click:');
      newLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
      });
    } else {
      console.log('\n❌ No actionable elements found. User may need to complete signup/login first.');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'tests/screenshots/error-state-simple.png', fullPage: true });
  }
  
  // Final report
  console.log('\n=== FINAL SIMPLE DEBUG REPORT ===');
  console.log('\n--- All Console Logs ---');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.timestamp}] [${log.type}] ${log.text}`);
  });
  
  if (pageErrors.length > 0) {
    console.log('\n--- Page Errors ---');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.timestamp}] ${error.message}`);
    });
  }
  
  console.log('\n=== End Simple Report ===\n');
});