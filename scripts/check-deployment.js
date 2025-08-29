#!/usr/bin/env node

/**
 * Quick Vercel Deployment Check Script
 * 
 * Usage: node scripts/check-deployment.js
 * 
 * This script uses Playwright to check the latest Vercel deployment status
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function checkDeployment() {
  console.log('🚀 Starting Vercel Deployment Check...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    timeout: 60000 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to deployments page
    const DEPLOYMENT_URL = 'https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments';
    console.log(`📍 Navigating to: ${DEPLOYMENT_URL}`);
    
    await page.goto(DEPLOYMENT_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check if login is required
    if (page.url().includes('login')) {
      console.log('⚠️  Login required. Please log in manually in the browser window.');
      console.log('Press Enter when logged in...');
      
      // Wait for manual login
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      // Navigate back to deployments
      await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle' });
    }
    
    // Wait for deployments to load
    console.log('⏳ Waiting for deployments to load...\n');
    await page.waitForTimeout(3000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'vercel-deployments.png' });
    
    // Try to find deployment status
    const deploymentSelectors = [
      // Common Vercel selectors
      'article:first-child',
      '[role="article"]:first-child',
      '.deployment-item:first-child',
      'div[data-testid="deployment-item"]:first-child',
      // Fallback: any link with deployment ID pattern
      'a[href*="/deployments/"]:first'
    ];
    
    let deploymentFound = false;
    let status = 'UNKNOWN';
    let buildInfo = {};
    
    for (const selector of deploymentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.innerText();
          console.log('📋 Latest Deployment Info:');
          console.log('----------------------------');
          console.log(text.substring(0, 500));
          console.log('----------------------------\n');
          
          // Check for status indicators
          if (text.includes('Ready') || text.includes('✓')) {
            status = 'SUCCESS';
          } else if (text.includes('Failed') || text.includes('Error') || text.includes('✗')) {
            status = 'ERROR';
          } else if (text.includes('Building') || text.includes('In Progress')) {
            status = 'BUILDING';
          }
          
          deploymentFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!deploymentFound) {
      console.log('⚠️  Could not find deployment information automatically.');
      console.log('Please check the screenshot: vercel-deployments.png');
      console.log('\nManual Check Required:');
      console.log('1. Look at the browser window');
      console.log('2. Check the latest deployment status');
      console.log('3. Note any error messages\n');
    } else {
      console.log(`📊 Deployment Status: ${status}\n`);
      
      if (status === 'ERROR') {
        console.log('❌ Build Failed!');
        console.log('Trying to extract error details...\n');
        
        // Click on the deployment to see details
        const firstDeployment = await page.$('article:first-child, [role="article"]:first-child');
        if (firstDeployment) {
          await firstDeployment.click();
          await page.waitForTimeout(3000);
          
          // Take screenshot of error details
          await page.screenshot({ path: 'vercel-error-details.png' });
          console.log('📸 Error details screenshot saved: vercel-error-details.png');
        }
      } else if (status === 'SUCCESS') {
        console.log('✅ Deployment Successful!');
        console.log('Ready to test WhatsApp signup flow.');
      } else if (status === 'BUILDING') {
        console.log('🔄 Deployment In Progress...');
        console.log('Check again in 30-60 seconds.');
      }
    }
    
    // Update status file
    await updateStatusFile(status);
    
  } catch (error) {
    console.error('❌ Error during check:', error.message);
  } finally {
    console.log('\n🎬 Check complete. Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

async function updateStatusFile(status) {
  const statusData = {
    timestamp: new Date().toISOString(),
    status: status,
    checkedBy: 'playwright-script',
    fixNumber: 7,
    lastCommit: 'ed4f0cc'
  };
  
  try {
    await fs.writeFile(
      path.join(process.cwd(), 'deployment-status.json'),
      JSON.stringify(statusData, null, 2)
    );
    console.log('✅ Status saved to deployment-status.json');
  } catch (error) {
    console.error('Failed to save status:', error);
  }
}

// Check if Playwright is installed
async function checkPlaywrightInstalled() {
  try {
    require('playwright');
    return true;
  } catch (e) {
    console.error('❌ Playwright not installed!');
    console.log('\nPlease install Playwright first:');
    console.log('npm install -D playwright');
    console.log('npx playwright install chromium\n');
    return false;
  }
}

// Main execution
(async () => {
  if (await checkPlaywrightInstalled()) {
    await checkDeployment();
  }
})();