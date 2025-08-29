/**
 * Vercel Deployment Monitor Script
 * 
 * This script uses Playwright to monitor Vercel deployments and log results
 * to vercel-output-monitor.md for automated deployment tracking.
 * 
 * Usage:
 * node scripts/monitor-vercel-deployment.js
 * 
 * Environment Variables Required:
 * - VERCEL_EMAIL: Your Vercel account email
 * - VERCEL_PASSWORD: Your Vercel account password
 * - VERCEL_PROJECT_NAME: Name of your project on Vercel (optional, defaults to 'renovation-advisor')
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class VercelDeploymentMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.logFilePath = path.join(__dirname, '..', 'vercel-output-monitor.md');
    this.projectName = process.env.VERCEL_PROJECT_NAME || 'renovation-advisor';
  }

  /**
   * Initialize the browser and authenticate with Vercel
   */
  async init() {
    console.log('🚀 Starting Vercel Deployment Monitor...');
    
    this.browser = await chromium.launch({ 
      headless: true,
      timeout: 30000 
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
  }

  /**
   * Login to Vercel dashboard
   */
  async login() {
    const email = process.env.VERCEL_EMAIL;
    const password = process.env.VERCEL_PASSWORD;
    
    if (!email || !password) {
      throw new Error('VERCEL_EMAIL and VERCEL_PASSWORD environment variables are required');
    }

    console.log('🔐 Logging into Vercel...');
    
    try {
      // Navigate to Vercel login
      await this.page.goto('https://vercel.com/login', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      // Fill in login credentials
      await this.page.fill('input[name="email"]', email);
      await this.page.fill('input[name="password"]', password);
      
      // Submit login form
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
      
      console.log('✅ Successfully logged into Vercel');
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Navigate to project deployments and get latest deployment info
   */
  async checkDeploymentStatus() {
    console.log(`📊 Checking deployment status for project: ${this.projectName}`);
    
    try {
      // Navigate to project deployments page
      const projectUrl = `https://vercel.com/dashboard/${this.projectName}/deployments`;
      await this.page.goto(projectUrl, { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      // Wait for deployments list to load
      await this.page.waitForSelector('[data-testid="deployment-list"]', { timeout: 10000 });
      
      // Get the latest deployment
      const latestDeployment = await this.page.locator('[data-testid="deployment-item"]').first();
      
      if (!latestDeployment) {
        throw new Error('No deployments found');
      }
      
      // Extract deployment information
      const deploymentId = await latestDeployment.getAttribute('data-deployment-id') || 'Unknown';
      const statusElement = await latestDeployment.locator('[data-testid="deployment-status"]');
      const status = await statusElement.textContent() || 'Unknown';
      
      // Get timestamp
      const timestampElement = await latestDeployment.locator('[data-testid="deployment-created"]');
      const timestamp = await timestampElement.textContent() || new Date().toISOString();
      
      console.log(`📋 Latest deployment: ${deploymentId} - Status: ${status}`);
      
      // If deployment failed, get error details
      let errorMessages = '';
      let buildLogs = '';
      
      if (status.toLowerCase().includes('error') || status.toLowerCase().includes('failed')) {
        console.log('🔍 Deployment failed, extracting error details...');
        
        // Click on the deployment to see details
        await latestDeployment.click();
        await this.page.waitForTimeout(2000);
        
        // Extract error messages and logs
        const errorDetails = await this.extractErrorDetails();
        errorMessages = errorDetails.errorMessages;
        buildLogs = errorDetails.buildLogs;
      }
      
      return {
        deploymentId,
        status,
        timestamp: new Date().toISOString(),
        errorMessages,
        buildLogs
      };
      
    } catch (error) {
      console.error('❌ Failed to check deployment status:', error.message);
      throw error;
    }
  }

  /**
   * Extract error messages and build logs from deployment details
   */
  async extractErrorDetails() {
    let errorMessages = '';
    let buildLogs = '';
    
    try {
      // Look for error messages in various selectors
      const errorSelectors = [
        '[data-testid="build-error"]',
        '.error-message',
        '[data-testid="deployment-error"]',
        '.build-error'
      ];
      
      for (const selector of errorSelectors) {
        const errorElements = await this.page.locator(selector).all();
        for (const element of errorElements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            errorMessages += text.trim() + '\\n';
          }
        }
      }
      
      // Look for build logs
      const logSelectors = [
        '[data-testid="build-logs"]',
        '.build-output',
        '[data-testid="function-logs"]'
      ];
      
      for (const selector of logSelectors) {
        const logElements = await this.page.locator(selector).all();
        for (const element of logElements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            // Limit build logs to last 500 characters to avoid huge files
            const truncatedText = text.trim().slice(-500);
            buildLogs += truncatedText + '\\n';
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️  Could not extract error details:', error.message);
    }
    
    return {
      errorMessages: errorMessages || 'No specific error messages found',
      buildLogs: buildLogs || 'No build logs available'
    };
  }

  /**
   * Update the monitoring log file with new deployment info
   */
  async updateLogFile(deploymentInfo) {
    console.log('📝 Updating monitoring log file...');
    
    try {
      // Read existing log file
      let existingContent = '';
      try {
        existingContent = await fs.readFile(this.logFilePath, 'utf8');
      } catch (error) {
        console.log('📄 Creating new log file...');
      }
      
      // Determine status emoji
      const statusEmoji = this.getStatusEmoji(deploymentInfo.status);
      
      // Format the new entry
      const newEntry = `
## Last Deployment Check

**Timestamp**: ${deploymentInfo.timestamp}  
**Deployment ID**: ${deploymentInfo.deploymentId}  
**Status**: ${statusEmoji} ${deploymentInfo.status}  
**Error Messages**: ${deploymentInfo.errorMessages || 'None'}  
**Build Logs**: ${deploymentInfo.buildLogs || 'No logs available'}  

---

## Deployment History

### ${deploymentInfo.timestamp} - ${deploymentInfo.deploymentId} - ${statusEmoji} ${deploymentInfo.status}
**Error Messages**: ${deploymentInfo.errorMessages || 'None'}  
**Build Logs**: ${deploymentInfo.buildLogs || 'No logs available'}  
---
`;
      
      // Replace the "Last Deployment Check" section and add to history
      let updatedContent = existingContent;
      
      // Replace last deployment check section
      updatedContent = updatedContent.replace(
        /## Last Deployment Check[\s\S]*?---/,
        newEntry.split('## Deployment History')[0] + '---'
      );
      
      // Add to deployment history (insert after "## Deployment History" and format section)
      const historySection = '## Deployment History';
      const formatSection = updatedContent.indexOf('### Format');
      
      if (formatSection !== -1) {
        // Find the end of the format section and notes
        const insertPoint = updatedContent.indexOf('---', formatSection + 1) + 4;
        const historyEntry = `\\n### ${deploymentInfo.timestamp} - ${deploymentInfo.deploymentId} - ${statusEmoji} ${deploymentInfo.status}\\n**Error Messages**: ${deploymentInfo.errorMessages || 'None'}  \\n**Build Logs**: ${deploymentInfo.buildLogs || 'No logs available'}  \\n---`;
        updatedContent = updatedContent.slice(0, insertPoint) + historyEntry + updatedContent.slice(insertPoint);
      }
      
      await fs.writeFile(this.logFilePath, updatedContent, 'utf8');
      console.log('✅ Log file updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update log file:', error.message);
      throw error;
    }
  }

  /**
   * Get appropriate emoji for deployment status
   */
  getStatusEmoji(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('ready')) return '🟢';
    if (statusLower.includes('building') || statusLower.includes('progress')) return '🟡';
    if (statusLower.includes('error') || statusLower.includes('failed')) return '🔴';
    if (statusLower.includes('queued') || statusLower.includes('pending')) return '⚪';
    if (statusLower.includes('canceled') || statusLower.includes('cancelled')) return '🟠';
    return '⚫';
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      await this.init();
      await this.login();
      const deploymentInfo = await this.checkDeploymentStatus();
      await this.updateLogFile(deploymentInfo);
      
      console.log('✅ Monitoring completed successfully');
      console.log('📊 Deployment Status:', deploymentInfo.status);
      console.log('📋 Deployment ID:', deploymentInfo.deploymentId);
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      
      // Log the error to the file as well
      const errorInfo = {
        deploymentId: 'ERROR',
        status: 'MONITOR_ERROR',
        timestamp: new Date().toISOString(),
        errorMessages: `Monitor script error: ${error.message}`,
        buildLogs: 'Monitor script failed to execute'
      };
      
      try {
        await this.updateLogFile(errorInfo);
      } catch (logError) {
        console.error('❌ Failed to log error to file:', logError.message);
      }
      
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Script execution
if (require.main === module) {
  const monitor = new VercelDeploymentMonitor();
  monitor.run().catch(console.error);
}

module.exports = VercelDeploymentMonitor;