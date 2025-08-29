import { test, expect, Page } from '@playwright/test';

/**
 * Automated Vercel Deployment Monitor
 * 
 * This test monitors Vercel deployment status and extracts error information
 * Run with: npx playwright test tests/monitor-vercel-deployment.spec.ts
 */

test.describe('Vercel Deployment Monitor', () => {
  const VERCEL_URL = 'https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments';
  const LOGIN_URL = 'https://vercel.com/login';
  
  // These should be set as environment variables
  const VERCEL_EMAIL = process.env.VERCEL_EMAIL || '';
  const VERCEL_PASSWORD = process.env.VERCEL_PASSWORD || '';

  test('Check latest deployment status', async ({ page }) => {
    // Set longer timeout for deployment checks
    test.setTimeout(120000); // 2 minutes

    // Navigate to Vercel
    await page.goto(LOGIN_URL);

    // Check if we need to login
    if (page.url().includes('login')) {
      console.log('🔐 Logging into Vercel...');
      
      // Try email/password login
      await page.fill('input[name="email"], input[type="email"]', VERCEL_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', VERCEL_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }

    // Navigate to deployments page
    console.log('📍 Navigating to deployments page...');
    await page.goto(VERCEL_URL);
    
    // Wait for deployments to load
    await page.waitForSelector('[data-testid="deployment-item"], .deployment-item, article', { 
      timeout: 30000 
    });

    // Get the latest deployment
    const latestDeployment = await page.locator('[data-testid="deployment-item"], .deployment-item, article').first();
    
    // Extract deployment information
    const deploymentInfo = await extractDeploymentInfo(page, latestDeployment);
    
    // Log the results
    console.log('\n📊 Deployment Status Report:');
    console.log('================================');
    console.log(`Status: ${deploymentInfo.status}`);
    console.log(`Commit: ${deploymentInfo.commit}`);
    console.log(`Time: ${deploymentInfo.time}`);
    
    if (deploymentInfo.status === 'ERROR' || deploymentInfo.status === 'FAILED') {
      console.log('\n❌ Build Failed!');
      console.log(`Error: ${deploymentInfo.error}`);
      
      // Try to get detailed error logs
      await latestDeployment.click();
      await page.waitForTimeout(2000);
      
      // Look for error details
      const errorDetails = await extractErrorDetails(page);
      if (errorDetails) {
        console.log('\n📋 Error Details:');
        console.log(`File: ${errorDetails.file}`);
        console.log(`Line: ${errorDetails.line}`);
        console.log(`Message: ${errorDetails.message}`);
        
        // Write to monitoring log
        await updateMonitoringLog(deploymentInfo, errorDetails);
      }
    } else if (deploymentInfo.status === 'READY' || deploymentInfo.status === 'SUCCESS') {
      console.log('\n✅ Deployment Successful!');
      
      // Write success to monitoring log
      await updateMonitoringLog(deploymentInfo, null);
    } else if (deploymentInfo.status === 'BUILDING') {
      console.log('\n🔄 Deployment In Progress...');
      console.log('Check again in 30 seconds');
    }
    
    // Assert based on status for CI/CD integration
    if (deploymentInfo.status === 'ERROR' || deploymentInfo.status === 'FAILED') {
      expect(deploymentInfo.status).not.toBe('ERROR');
    }
  });
});

/**
 * Extract deployment information from the page
 */
async function extractDeploymentInfo(page: Page, deploymentElement: any) {
  const info: any = {
    status: 'UNKNOWN',
    commit: '',
    time: '',
    error: null
  };

  try {
    // Try different selectors for status
    const statusSelectors = [
      '.status',
      '[data-testid="deployment-status"]',
      'span:has-text("Ready")',
      'span:has-text("Error")',
      'span:has-text("Building")',
      'span:has-text("Failed")'
    ];

    for (const selector of statusSelectors) {
      const statusElement = deploymentElement.locator(selector).first();
      if (await statusElement.count() > 0) {
        const text = await statusElement.textContent();
        if (text) {
          if (text.toLowerCase().includes('ready') || text.toLowerCase().includes('success')) {
            info.status = 'READY';
          } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
            info.status = 'ERROR';
          } else if (text.toLowerCase().includes('building') || text.toLowerCase().includes('progress')) {
            info.status = 'BUILDING';
          }
          break;
        }
      }
    }

    // Get commit info
    const commitElement = deploymentElement.locator('code, .commit-hash, [data-testid="commit"]').first();
    if (await commitElement.count() > 0) {
      info.commit = await commitElement.textContent();
    }

    // Get time info
    const timeElement = deploymentElement.locator('time, .time, [data-testid="deployment-time"]').first();
    if (await timeElement.count() > 0) {
      info.time = await timeElement.textContent();
    }

  } catch (error) {
    console.error('Error extracting deployment info:', error);
  }

  return info;
}

/**
 * Extract detailed error information from build logs
 */
async function extractErrorDetails(page: Page) {
  try {
    // Look for error logs
    const errorSelectors = [
      '.error-log',
      'pre:has-text("Error")',
      'code:has-text("Error")',
      '.build-log-error',
      '[data-testid="build-error"]'
    ];

    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector).first();
      if (await errorElement.count() > 0) {
        const errorText = await errorElement.textContent();
        
        // Parse error details
        const fileMatch = errorText?.match(/([\/\w\-\.]+\.(?:ts|js|tsx|jsx))(?::(\d+))?/);
        const messageMatch = errorText?.match(/Type error: (.+)|Error: (.+)/);
        
        return {
          file: fileMatch ? fileMatch[1] : 'unknown',
          line: fileMatch && fileMatch[2] ? parseInt(fileMatch[2]) : 0,
          message: messageMatch ? (messageMatch[1] || messageMatch[2]) : errorText?.substring(0, 200)
        };
      }
    }
  } catch (error) {
    console.error('Error extracting error details:', error);
  }

  return null;
}

/**
 * Update the monitoring log with results
 */
async function updateMonitoringLog(deploymentInfo: any, errorDetails: any) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const timestamp = new Date().toISOString();
  const logEntry = `
## [${timestamp}] - Automated Check
**Status:** ${deploymentInfo.status}
**Commit:** ${deploymentInfo.commit}
${errorDetails ? `
**Error Details:**
- File: ${errorDetails.file}
- Line: ${errorDetails.line}
- Message: ${errorDetails.message}
` : ''}
---
`;

  try {
    const logFile = path.join(process.cwd(), 'vercel-deployment-status.log');
    await fs.appendFile(logFile, logEntry);
    console.log('✅ Log updated: vercel-deployment-status.log');
  } catch (error) {
    console.error('Failed to update log:', error);
  }
}