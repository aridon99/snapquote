#!/usr/bin/env node

/**
 * Simple Vercel Status Check
 * Uses existing browser session to check deployment status
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

async function checkVercelStatus() {
  console.log('🚀 Checking Vercel deployment status...\n');
  
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  try {
    // Get existing contexts (should have logged-in session)
    const contexts = browser.contexts();
    let context;
    
    if (contexts.length > 0) {
      context = contexts[0];
      console.log('📱 Using existing browser session');
    } else {
      context = await browser.newContext();
      console.log('📱 Created new browser context');
    }
    
    const page = await context.newPage();
    
    // Navigate to deployments page
    const url = 'https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments';
    console.log(`📍 Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for deployments to load
    await page.waitForTimeout(3000);
    
    // Take screenshot for reference
    await page.screenshot({ path: 'vercel-status-check.png', fullPage: true });
    console.log('📸 Screenshot saved: vercel-status-check.png');
    
    // Look for the latest deployment
    const deploymentElements = await page.$$('article, [role="article"], .deployment-item');
    
    if (deploymentElements.length > 0) {
      const latestDeployment = deploymentElements[0];
      
      // Get text content
      const deploymentText = await latestDeployment.innerText();
      console.log('\n📋 Latest Deployment Info:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(deploymentText);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Check for status indicators
      let status = 'UNKNOWN';
      if (deploymentText.includes('Ready') || deploymentText.includes('✓') || deploymentText.includes('Deployed')) {
        status = '✅ SUCCESS';
      } else if (deploymentText.includes('Failed') || deploymentText.includes('Error') || deploymentText.includes('✗')) {
        status = '❌ FAILED';
      } else if (deploymentText.includes('Building') || deploymentText.includes('In Progress') || deploymentText.includes('Deploying')) {
        status = '🔄 BUILDING';
      }
      
      console.log(`📊 Status: ${status}\n`);
      
      if (status.includes('FAILED')) {
        console.log('🔍 Clicking on deployment to see error details...');
        await latestDeployment.click();
        await page.waitForTimeout(5000);
        
        // Take screenshot of error details
        await page.screenshot({ path: 'vercel-error-details.png', fullPage: true });
        console.log('📸 Error details screenshot: vercel-error-details.png');
        
        // Look for build logs or errors
        const errorElements = await page.$$('pre, code, .error, [data-testid*="error"]');
        
        for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
          const errorText = await errorElements[i].innerText();
          if (errorText && errorText.length > 10 && errorText.includes('error')) {
            console.log('\n🐛 Error Details Found:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(errorText.substring(0, 500));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            break;
          }
        }
      } else if (status.includes('SUCCESS')) {
        console.log('🎉 DEPLOYMENT SUCCESSFUL!');
        console.log('✅ Ready to test WhatsApp signup flow!');
        console.log('🌐 Check: https://renovation-advisor-ten.vercel.app/api/health');
      } else if (status.includes('BUILDING')) {
        console.log('⏳ Deployment still in progress...');
        console.log('💡 Check again in 1-2 minutes');
      }
      
      // Save status to file
      await saveStatus(status, deploymentText);
      
    } else {
      console.log('⚠️  Could not find deployment information');
      console.log('📸 Check the screenshot: vercel-status-check.png');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Chrome is running with debugging: chrome --remote-debugging-port=9222');
    console.log('2. You are logged into Vercel in that browser');
    console.log('3. The deployments page is accessible');
  }
  
  console.log('\n✨ Check complete!');
}

async function saveStatus(status, details) {
  const statusData = {
    timestamp: new Date().toISOString(),
    status: status,
    commit: '9577f51',
    fixNumber: 8,
    details: details.substring(0, 200)
  };
  
  try {
    await fs.writeFile(
      'deployment-status.json',
      JSON.stringify(statusData, null, 2)
    );
    console.log('💾 Status saved to deployment-status.json');
  } catch (error) {
    console.error('Failed to save status:', error);
  }
}

// Run the check
checkVercelStatus();