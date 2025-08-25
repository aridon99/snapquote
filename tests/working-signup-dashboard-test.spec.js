const { test, expect } = require('@playwright/test');

test('Working signup and dashboard redirect test', async ({ page }) => {
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

  console.log('\n=== Working Signup and Dashboard Redirect Test ===\n');

  try {
    // Step 1: Go to signup and create a working account
    console.log('Step 1: Going to signup page...');
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'test123456'; // 6+ chars required
    const testName = 'Test User';
    
    console.log(`Creating test account with email: ${testEmail}`);
    
    // Fill out the signup form using the correct IDs from the component
    await page.fill('#fullName', testName);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);
    
    // Check the terms checkbox
    await page.click('#terms');
    
    // Submit the form
    console.log('Submitting signup form...');
    await page.click('button[type="submit"]');
    
    // Wait for signup to complete
    await page.waitForTimeout(3000);
    
    // Step 2: Check where we are after signup
    const currentUrl = page.url();
    console.log('URL after signup:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login page. This is expected for email confirmation flow.');
      console.log('Let me try to login with the account we just created...');
      
      // Try logging in immediately (in case email confirmation is disabled)
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const afterLoginUrl = page.url();
      console.log('URL after login attempt:', afterLoginUrl);
    }
    
    // Step 3: Now go to setup-profile to test the flow
    console.log('\nStep 3: Navigating to setup-profile...');
    await page.goto('http://localhost:3000/setup-profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/setup-profile-working.png', fullPage: true });
    
    // Step 4: Analyze state
    console.log('Step 4: Analyzing page state...');
    const setupUrl = page.url();
    console.log('Setup profile URL:', setupUrl);
    
    const isLoggedIn = await page.locator('text=✓ Logged in as:').isVisible().catch(() => false);
    const hasProfile = await page.locator('text=✓ Profile exists!').isVisible().catch(() => false);
    const needsProfileCreation = await page.locator('text=📝 No profile found in database').isVisible().catch(() => false);
    const notLoggedIn = await page.locator('text=🔒 Not logged in').isVisible().catch(() => false);
    const dashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
    const createProfileButton = await page.locator('text=Create Profile ✨').isVisible().catch(() => false);
    
    console.log('Page state analysis:');
    console.log('- Is logged in:', isLoggedIn);
    console.log('- Has profile:', hasProfile);
    console.log('- Needs profile creation:', needsProfileCreation);
    console.log('- Not logged in:', notLoggedIn);
    console.log('- Dashboard button visible:', dashboardButton);
    console.log('- Create profile button visible:', createProfileButton);
    
    // Step 5: Complete the profile setup flow
    if (createProfileButton) {
      console.log('\nStep 5: Creating profile...');
      await page.click('text=Create Profile ✨');
      await page.waitForTimeout(5000); // Wait for profile creation
      
      // Check state after profile creation
      const afterCreateDashboardButton = await page.locator('text=Go to Dashboard →').isVisible().catch(() => false);
      console.log('Dashboard button visible after profile creation:', afterCreateDashboardButton);
      
      if (afterCreateDashboardButton) {
        console.log('\n🎯 TESTING THE DASHBOARD REDIRECT...');
        
        // Capture console logs before click
        const preClickLogCount = consoleLogs.length;
        console.log('Console logs before clicking (last 10):');
        consoleLogs.slice(-10).forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        // Take screenshot before click
        await page.screenshot({ path: 'tests/screenshots/before-dashboard-click-working.png', fullPage: true });
        
        // Click the dashboard button - this is the moment we're debugging
        console.log('🚀 Clicking "Go to Dashboard →" button...');
        await page.click('text=Go to Dashboard →');
        
        // Monitor navigation carefully
        console.log('Monitoring navigation...');
        await page.waitForTimeout(5000);
        
        // Capture final state
        const finalUrl = page.url();
        console.log('🎯 FINAL URL AFTER CLICKING DASHBOARD:', finalUrl);
        
        await page.screenshot({ path: 'tests/screenshots/after-dashboard-click-working.png', fullPage: true });
        
        // Detailed analysis
        const onLoginPage = finalUrl.includes('/login');
        const onDashboardPage = finalUrl.includes('/dashboard');
        const onSetupPage = finalUrl.includes('/setup-profile');
        
        console.log('\n📊 FINAL NAVIGATION ANALYSIS:');
        console.log('- On login page:', onLoginPage, onLoginPage ? '❌ BUG!' : '');
        console.log('- On dashboard page:', onDashboardPage, onDashboardPage ? '✅ SUCCESS!' : '');
        console.log('- Still on setup page:', onSetupPage);
        
        // Capture console logs after click - THE KEY DEBUGGING INFO
        console.log('\n🔍 CONSOLE LOGS AFTER CLICKING DASHBOARD (THE SMOKING GUN):');
        const newLogs = consoleLogs.slice(preClickLogCount);
        newLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        // Filter for auth-specific logs
        const authLogs = consoleLogs.filter(log => 
          log.text.includes('getUserWithProfile') || 
          log.text.includes('requireHomeowner') ||
          log.text.includes('Auth error:') ||
          log.text.includes('User from auth:') ||
          log.text.includes('Profile query error:') ||
          log.text.includes('Profile data:') ||
          log.text.includes('No user or profile found') ||
          log.text.includes('redirecting to login') ||
          log.text.includes('Redirecting to dashboard') ||
          log.text.includes('🔍') || log.text.includes('❌') || log.text.includes('✅')
        );
        
        console.log('\n🔍 AUTH-RELATED DEBUG LOGS (FROM OUR DEBUG STATEMENTS):');
        authLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
        });
        
        if (onLoginPage) {
          console.log('\n❌ BUG CONFIRMED: Dashboard redirect is sending us to login!');
          console.log('This indicates requireHomeowner() is failing the auth check.');
          console.log('Check the auth logs above to see why.');
        } else if (onDashboardPage) {
          console.log('\n✅ SUCCESS: Dashboard redirect worked correctly!');
        }
      }
    } else if (dashboardButton) {
      console.log('\nProfile already exists, testing dashboard redirect directly...');
      // Same dashboard test flow
      await page.click('text=Go to Dashboard →');
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
    } else if (notLoggedIn) {
      console.log('\n❌ Still not logged in after signup/login attempt.');
      console.log('This might indicate Supabase auth is not configured or signup failed.');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'tests/screenshots/error-state-working.png', fullPage: true });
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
    });
  }
  
  console.log('\n=== End Comprehensive Report ===\n');
});