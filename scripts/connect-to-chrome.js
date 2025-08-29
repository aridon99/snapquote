#!/usr/bin/env node

/**
 * Connect to existing Chrome instance for deployment monitoring
 * First, run Chrome with debugging: chrome --remote-debugging-port=9222
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function connectAndMonitor() {
  console.log('🚀 Connecting to existing Chrome instance...\n');
  
  try {
    // Connect to existing Chrome instance
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to Chrome successfully');
    
    const contexts = browser.contexts();
    const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    console.log(`📱 Using context (${contexts.length} contexts found)`);
    
    // Create or use existing page
    const pages = context.pages();
    let page;
    
    if (pages.length > 0) {
      page = pages[0];
      console.log('📄 Using existing page');
    } else {
      page = await context.newPage();
      console.log('📄 Created new page');
    }
    
    // Navigate to Vercel deployments
    const url = 'https://vercel.com/aridon99-2472s-projects/renovation-advisor/deployments';
    console.log(`📍 Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'vercel-deployment-status.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: vercel-deployment-status.png\n');
    
    // Extract deployment information
    const deploymentInfo = await extractDeploymentInfo(page);
    
    // Display results
    displayResults(deploymentInfo);
    
    // Save to monitoring log
    await updateMonitoringFile(deploymentInfo);
    
    console.log('\n✨ Monitoring complete! Check the screenshot and results above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure Chrome is running with:');
    console.log('chrome --remote-debugging-port=9222');
    console.log('Then make sure you\'re logged into Vercel in that browser.');
  }
}

async function extractDeploymentInfo(page) {
  console.log('🔍 Extracting deployment information...');
  
  const info = {
    status: 'UNKNOWN',
    commit: 'b0fe34e',
    fixNumber: 9,
    deploymentId: null,
    buildTime: null,
    error: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Get page content
    const content = await page.content();
    
    // Look for deployment elements
    const deploymentElements = await page.$$('article, [role="article"], div[data-testid*="deployment"]');
    
    if (deploymentElements.length > 0) {
      const latestDeployment = deploymentElements[0];
      const deploymentText = await latestDeployment.innerText();
      
      console.log('\n📋 Latest Deployment Text:');
      console.log('━'.repeat(50));
      console.log(deploymentText);
      console.log('━'.repeat(50));
      
      // Parse status
      info.status = parseDeploymentStatus(deploymentText);
      info.deploymentId = extractId(deploymentText);
      info.buildTime = extractTime(deploymentText);
      
      // If error, try to get details
      if (info.status === 'ERROR') {
        console.log('\n🔍 Attempting to extract error details...');
        await latestDeployment.click();
        await page.waitForTimeout(3000);
        
        const errorInfo = await extractErrorFromPage(page);
        if (errorInfo) {
          info.error = errorInfo;
        }
      }
    } else {
      console.log('⚠️  Could not find deployment elements');
      
      // Fallback: check page text content
      const pageText = await page.textContent('body');
      if (pageText.includes('Ready') || pageText.includes('Deployed')) {
        info.status = 'SUCCESS';
      } else if (pageText.includes('Failed') || pageText.includes('Error')) {
        info.status = 'ERROR';
      } else if (pageText.includes('Building')) {
        info.status = 'BUILDING';
      }
    }
    
  } catch (error) {
    console.error('Error extracting info:', error);
    info.status = 'EXTRACTION_ERROR';
  }
  
  return info;
}

function parseDeploymentStatus(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('ready') || lower.includes('deployed') || lower.includes('✓')) {
    return 'SUCCESS';
  } else if (lower.includes('failed') || lower.includes('error') || lower.includes('✗')) {
    return 'ERROR';
  } else if (lower.includes('building') || lower.includes('deploying') || lower.includes('in progress')) {
    return 'BUILDING';
  }
  
  return 'UNKNOWN';
}

function extractId(text) {
  // Look for alphanumeric strings that could be deployment IDs
  const matches = text.match(/\b[A-Za-z0-9]{6,12}\b/g);
  return matches ? matches[0] : null;
}

function extractTime(text) {
  // Look for time patterns
  const timeMatch = text.match(/(\d+m\s*\d*s?|\d+s)/);
  return timeMatch ? timeMatch[0] : null;
}

async function extractErrorFromPage(page) {
  try {
    const errorElements = await page.$$('pre, code, .error');
    
    for (const element of errorElements) {
      const text = await element.innerText();
      
      if (text.includes('Type error') || text.includes('Failed to compile')) {
        const fileMatch = text.match(/\.\/([^:]+):(\d+)/);
        const messageMatch = text.match(/Type error: (.+)|Error: (.+)/);
        
        return {
          file: fileMatch ? fileMatch[1] : 'unknown',
          line: fileMatch ? parseInt(fileMatch[2]) : 0,
          message: messageMatch ? (messageMatch[1] || messageMatch[2]).trim() : text.substring(0, 100)
        };
      }
    }
  } catch (error) {
    console.error('Error extracting error details:', error);
  }
  
  return null;
}

function displayResults(info) {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 VERCEL DEPLOYMENT STATUS - FIX #9');
  console.log('='.repeat(60));
  console.log(`📊 Status: ${getStatusEmoji(info.status)} ${info.status}`);
  console.log(`🔗 Deployment ID: ${info.deploymentId || 'Unknown'}`);
  console.log(`⏱️  Build Time: ${info.buildTime || 'Unknown'}`);
  console.log(`📝 Commit: ${info.commit}`);
  
  if (info.status === 'SUCCESS') {
    console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('✅ All 9 TypeScript fixes applied successfully!');
    console.log('🌐 Test URL: https://renovation-advisor-ten.vercel.app/api/health');
    console.log('📱 Ready for WhatsApp signup flow testing!');
  } else if (info.status === 'ERROR') {
    console.log('\n❌ BUILD FAILED - Need Fix #10:');
    if (info.error) {
      console.log(`📁 File: ${info.error.file}`);
      console.log(`📍 Line: ${info.error.line}`);
      console.log(`💬 Error: ${info.error.message}`);
    } else {
      console.log('🔍 Check the screenshot for error details');
    }
  } else if (info.status === 'BUILDING') {
    console.log('\n🔄 DEPLOYMENT IN PROGRESS');
    console.log('⏳ Check again in 1-2 minutes');
  } else {
    console.log('\n❓ UNKNOWN STATUS');
    console.log('🔍 Check the screenshot: vercel-deployment-status.png');
  }
  
  console.log('='.repeat(60));
}

function getStatusEmoji(status) {
  switch (status) {
    case 'SUCCESS': return '✅';
    case 'ERROR': return '❌';
    case 'BUILDING': return '🔄';
    default: return '❓';
  }
}

async function updateMonitoringFile(info) {
  try {
    const statusData = {
      timestamp: info.timestamp,
      status: info.status,
      commit: info.commit,
      fixNumber: info.fixNumber,
      deploymentId: info.deploymentId,
      buildTime: info.buildTime,
      error: info.error
    };
    
    await fs.writeFile(
      path.join(process.cwd(), 'latest-deployment-status.json'),
      JSON.stringify(statusData, null, 2)
    );
    
    console.log('💾 Status saved to: latest-deployment-status.json');
  } catch (error) {
    console.error('Failed to save status:', error);
  }
}

// Run the monitor
connectAndMonitor();