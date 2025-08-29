#!/usr/bin/env node

/**
 * Vercel Deployment Monitor with Persistent Chrome Context
 * Uses your existing Chrome profile to monitor deployments
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function monitorDeployment() {
  console.log('🚀 Starting Vercel Deployment Monitor...\n');
  
  // Path to your Chrome user data directory
  const userDataDir = '/Users/johnhuang/Library/Application Support/Google/Chrome'; // macOS
  
  try {
    // Launch a persistent context using your Chrome profile
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chrome', // Use Google Chrome
      headless: false,   // Run in headed mode
      timeout: 30000
    });
    
    console.log('📱 Using your existing Chrome profile');
    
    // Create new page
    const page = await context.newPage();
    
    // Navigate to deployments page
    const url = 'https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments';
    console.log(`📍 Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for deployments to load
    await page.waitForTimeout(5000);
    
    // Take screenshot for reference
    await page.screenshot({ 
      path: path.join(process.cwd(), 'vercel-monitor-screenshot.png'), 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: vercel-monitor-screenshot.png\n');
    
    // Monitor the latest deployment
    const deploymentResult = await monitorLatestDeployment(page);
    
    // Update monitoring log
    await updateMonitoringLog(deploymentResult);
    
    // Show results
    displayResults(deploymentResult);
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for inspection...');
    console.log('Press Ctrl+C to close when done.\n');
    
    // Keep the script running
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function monitorLatestDeployment(page) {
  console.log('🔍 Looking for latest deployment...');
  
  const result = {
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    commit: 'b0fe34e',
    fixNumber: 9,
    deploymentId: null,
    buildTime: null,
    error: null
  };
  
  try {
    // Look for deployment elements - try multiple selectors
    const selectors = [
      'article:first-child',
      '[role="article"]:first-child', 
      'div[data-testid*="deployment"]:first-child',
      'a[href*="/deployments/"]:first-child'
    ];
    
    let latestDeployment = null;
    
    for (const selector of selectors) {
      latestDeployment = await page.$(selector);
      if (latestDeployment) {
        console.log(`✅ Found deployment using selector: ${selector}`);
        break;
      }
    }
    
    if (!latestDeployment) {
      throw new Error('Could not find deployment element');
    }
    
    // Get deployment text
    const deploymentText = await latestDeployment.innerText();
    console.log('\n📋 Latest Deployment Info:');
    console.log('━'.repeat(50));
    console.log(deploymentText);
    console.log('━'.repeat(50));
    
    // Parse status
    result.status = parseStatus(deploymentText);
    result.deploymentId = extractDeploymentId(deploymentText);
    result.buildTime = extractBuildTime(deploymentText);
    
    // If it's an error, click to get details
    if (result.status === 'ERROR') {
      console.log('\n🔍 Clicking deployment to see error details...');
      await latestDeployment.click();
      await page.waitForTimeout(5000);
      
      // Take error screenshot
      await page.screenshot({ 
        path: path.join(process.cwd(), 'vercel-error-details.png'),
        fullPage: true 
      });
      
      // Look for error details
      result.error = await extractErrorDetails(page);
    }
    
  } catch (error) {
    console.error('Error monitoring deployment:', error.message);
    result.status = 'MONITOR_ERROR';
    result.error = error.message;
  }
  
  return result;
}

function parseStatus(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('ready') || lowerText.includes('deployed') || lowerText.includes('✓')) {
    return 'SUCCESS';
  } else if (lowerText.includes('failed') || lowerText.includes('error') || lowerText.includes('✗')) {
    return 'ERROR';
  } else if (lowerText.includes('building') || lowerText.includes('deploying') || lowerText.includes('in progress')) {
    return 'BUILDING';
  }
  
  return 'UNKNOWN';
}

function extractDeploymentId(text) {
  // Look for deployment ID patterns
  const idMatch = text.match(/\b[A-Za-z0-9]{8,}\b/);
  return idMatch ? idMatch[0] : null;
}

function extractBuildTime(text) {
  // Look for time patterns like "1m 15s"
  const timeMatch = text.match(/(\d+m\s*\d*s?|\d+s)/);
  return timeMatch ? timeMatch[0] : null;
}

async function extractErrorDetails(page) {
  try {
    // Look for error messages in various elements
    const errorSelectors = [
      'pre:has-text("Error")',
      'code:has-text("Type error")',
      '.error-message',
      '[data-testid*="error"]',
      'div:has-text("Failed to compile")'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = await page.$(selector);
      if (errorElement) {
        const errorText = await errorElement.innerText();
        
        // Parse error details
        const fileMatch = errorText.match(/\.\/([^:]+):(\d+)/);
        const messageMatch = errorText.match(/Type error: (.+)|Error: (.+)/);
        
        return {
          file: fileMatch ? fileMatch[1] : 'unknown',
          line: fileMatch ? parseInt(fileMatch[2]) : 0,
          message: messageMatch ? (messageMatch[1] || messageMatch[2]) : errorText.substring(0, 200),
          fullText: errorText
        };
      }
    }
  } catch (error) {
    console.error('Error extracting error details:', error);
  }
  
  return null;
}

async function updateMonitoringLog(result) {
  const logEntry = `
## [${new Date().toISOString()}] - Deployment Check #${result.fixNumber}
**Deployment ID:** ${result.deploymentId || 'Unknown'}
**Commit:** ${result.commit}
**Status:** ${result.status}
**Build Time:** ${result.buildTime || 'Unknown'}
${result.error ? `**Error Details:**
- File: ${result.error.file}
- Line: ${result.error.line}
- Message: ${result.error.message}` : ''}
**Fix Applied:** Comprehensive TypeScript error handling
**Result:** ${result.status === 'SUCCESS' ? 'BUILD SUCCESSFUL! 🎉' : 'Pending verification'}

---
`;

  try {
    const logFile = path.join(process.cwd(), 'agent-log-monitoring.md');
    const content = await fs.readFile(logFile, 'utf-8');
    
    // Replace the latest monitoring result
    const updatedContent = content.replace(
      /## Latest Monitoring Result\n\n[^#]*/,
      `## Latest Monitoring Result\n${logEntry}`
    );
    
    await fs.writeFile(logFile, updatedContent);
    console.log('✅ Updated agent-log-monitoring.md');
  } catch (error) {
    console.error('Failed to update monitoring log:', error);
  }
}

function displayResults(result) {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 DEPLOYMENT MONITORING RESULTS');
  console.log('='.repeat(60));
  console.log(`📊 Status: ${getStatusIcon(result.status)} ${result.status}`);
  console.log(`🔗 Deployment ID: ${result.deploymentId || 'Unknown'}`);
  console.log(`⏱️  Build Time: ${result.buildTime || 'Unknown'}`);
  console.log(`🎯 Fix Number: ${result.fixNumber}`);
  
  if (result.status === 'SUCCESS') {
    console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('✅ All 9 TypeScript fixes have been applied successfully!');
    console.log('🌐 Ready to test: https://renovation-advisor-ten.vercel.app/api/health');
    console.log('📱 Ready to test WhatsApp signup flow!');
  } else if (result.status === 'ERROR' && result.error) {
    console.log('\n❌ BUILD FAILED - Fix #10 needed:');
    console.log(`📁 File: ${result.error.file}`);
    console.log(`📍 Line: ${result.error.line}`);
    console.log(`💬 Error: ${result.error.message}`);
  } else if (result.status === 'BUILDING') {
    console.log('\n🔄 DEPLOYMENT IN PROGRESS');
    console.log('⏳ Check again in 1-2 minutes');
  }
  
  console.log('='.repeat(60));
}

function getStatusIcon(status) {
  switch (status) {
    case 'SUCCESS': return '✅';
    case 'ERROR': return '❌';
    case 'BUILDING': return '🔄';
    default: return '❓';
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped. Browser may still be open.');
  process.exit(0);
});

// Run the monitor
monitorDeployment();