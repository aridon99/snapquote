/**
 * Vercel Deployment Monitor Subagent
 * 
 * A specialized subagent system for automated Vercel deployment monitoring.
 * Designed to work with MCP Playwright tools and return structured results
 * for automated fix-push-monitor-fix feedback loops.
 * 
 * Usage:
 * const agent = new VercelMonitorAgent();
 * const result = await agent.monitorDeployment();
 * 
 * Environment Variables Required:
 * - VERCEL_EMAIL: Your Vercel account email
 * - VERCEL_PASSWORD: Your Vercel account password  
 * - VERCEL_PROJECT_NAME: Name of your project on Vercel (default: 'renovation-advisor')
 * - GITHUB_REPO: GitHub repository (default: 'aridon99/snapquote')
 * - TARGET_BRANCH: Branch to monitor (default: 'master')
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * Structured result types for the monitoring subagent
 */
const ResultTypes = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
  AUTH_ERROR: 'AUTH_ERROR'
};

/**
 * Vercel Deployment Monitor Subagent Class
 * 
 * This class provides a structured interface for monitoring Vercel deployments
 * and returning actionable results for automated deployment feedback loops.
 */
class VercelMonitorAgent {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.projectName = options.projectName || process.env.VERCEL_PROJECT_NAME || 'renovation-advisor';
    this.githubRepo = options.githubRepo || process.env.GITHUB_REPO || 'aridon99/snapquote';
    this.targetBranch = options.targetBranch || process.env.TARGET_BRANCH || 'master';
    this.maxWaitTime = options.maxWaitTime || 300000; // 5 minutes default
    this.pollInterval = options.pollInterval || 10000; // 10 seconds default
    this.logFilePath = path.join(__dirname, '..', 'deployment-monitor-log.md');
  }

  /**
   * Initialize browser with optimized settings for headless monitoring
   */
  async init() {
    console.log('🚀 Initializing Vercel Monitor Subagent...');
    
    this.browser = await chromium.launch({ 
      headless: true,
      timeout: 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Optimize for monitoring
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // Block images and other resources to speed up loading
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'font', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  /**
   * Authenticate with Vercel dashboard
   * Returns structured result indicating success or failure
   */
  async authenticate() {
    const email = process.env.VERCEL_EMAIL;
    const password = process.env.VERCEL_PASSWORD;
    
    if (!email || !password) {
      return {
        type: ResultTypes.AUTH_ERROR,
        message: 'VERCEL_EMAIL and VERCEL_PASSWORD environment variables are required',
        timestamp: new Date().toISOString()
      };
    }

    console.log('🔐 Authenticating with Vercel...');
    
    try {
      // Navigate to Vercel login
      await this.page.goto('https://vercel.com/login', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      // Handle potential cookie banners or overlays
      try {
        await this.page.click('[data-testid="cookie-accept"]', { timeout: 2000 });
      } catch (e) {
        // Cookie banner not present, continue
      }
      
      // Fill in login credentials
      await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await this.page.fill('input[name="email"]', email);
      await this.page.fill('input[name="password"]', password);
      
      // Submit login form and wait for navigation
      await Promise.all([
        this.page.waitForURL('**/dashboard**', { timeout: 15000 }),
        this.page.click('button[type="submit"]')
      ]);
      
      console.log('✅ Successfully authenticated with Vercel');
      return { type: ResultTypes.SUCCESS };
      
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return {
        type: ResultTypes.AUTH_ERROR,
        message: `Authentication failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Navigate to specific project and get deployment information
   * Handles both team and personal project URLs
   */
  async navigateToProject() {
    console.log(`📊 Navigating to project: ${this.projectName}`);
    
    try {
      // Try multiple URL patterns for project access
      const possibleUrls = [
        `https://vercel.com/${this.projectName}`,
        `https://vercel.com/dashboard/${this.projectName}`,
        `https://vercel.com/dashboard/${this.projectName}/deployments`,
        `https://vercel.com/aridon99/${this.projectName}`, // For team projects
        `https://vercel.com/aridon99/${this.projectName}/deployments`
      ];
      
      let projectFound = false;
      
      for (const url of possibleUrls) {
        try {
          console.log(`🔍 Trying URL: ${url}`);
          await this.page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 15000 
          });
          
          // Check if we landed on a valid project page
          const isValidProject = await this.page.locator('[data-testid="deployment-list"], .deployment-list, [data-testid="project-header"]').count() > 0;
          
          if (isValidProject) {
            console.log(`✅ Found project at: ${url}`);
            projectFound = true;
            break;
          }
        } catch (e) {
          console.log(`❌ URL failed: ${url} - ${e.message}`);
          continue;
        }
      }
      
      if (!projectFound) {
        throw new Error(`Project '${this.projectName}' not found or not accessible. Tried: ${possibleUrls.join(', ')}`);
      }
      
      // Ensure we're on the deployments page
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/deployments')) {
        const deploymentsUrl = currentUrl.replace(/\/$/, '') + '/deployments';
        await this.page.goto(deploymentsUrl, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
      }
      
      return { type: ResultTypes.SUCCESS };
      
    } catch (error) {
      console.error('❌ Failed to navigate to project:', error.message);
      return {
        type: ResultTypes.ERROR,
        message: `Failed to navigate to project: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Wait for deployment completion with intelligent polling
   * Monitors deployment status until completion or timeout
   */
  async waitForDeploymentCompletion(initialStatus = null) {
    console.log('⏳ Waiting for deployment completion...');
    
    const startTime = Date.now();
    let lastStatus = initialStatus;
    let consecutivePolls = 0;
    
    while (Date.now() - startTime < this.maxWaitTime) {
      try {
        // Get latest deployment status
        const deploymentInfo = await this.getLatestDeploymentInfo();
        
        if (!deploymentInfo) {
          throw new Error('Unable to retrieve deployment information');
        }
        
        const currentStatus = deploymentInfo.status.toLowerCase();
        console.log(`📊 Current status: ${currentStatus} (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
        
        // Check if deployment is complete (success or failure)
        if (this.isDeploymentComplete(currentStatus)) {
          console.log(`✅ Deployment completed with status: ${currentStatus}`);
          return deploymentInfo;
        }
        
        // Check if status changed
        if (lastStatus && lastStatus !== currentStatus) {
          console.log(`🔄 Status changed: ${lastStatus} → ${currentStatus}`);
          consecutivePolls = 0; // Reset poll counter on status change
        }
        
        lastStatus = currentStatus;
        consecutivePolls++;
        
        // Adaptive polling: slower polling for long-running builds
        const waitTime = consecutivePolls > 10 ? this.pollInterval * 2 : this.pollInterval;
        await this.page.waitForTimeout(waitTime);
        
        // Refresh the page periodically to get latest data
        if (consecutivePolls % 5 === 0) {
          await this.page.reload({ waitUntil: 'networkidle' });
        }
        
      } catch (error) {
        console.warn(`⚠️ Error during polling (will retry): ${error.message}`);
        await this.page.waitForTimeout(this.pollInterval);
      }
    }
    
    // Timeout reached
    console.log('⏰ Deployment monitoring timeout reached');
    return {
      type: ResultTypes.TIMEOUT,
      message: `Deployment monitoring timeout after ${Math.floor(this.maxWaitTime / 1000)} seconds`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if deployment status indicates completion
   */
  isDeploymentComplete(status) {
    const completedStatuses = [
      'ready', 'success', 'successful',
      'error', 'failed', 'failure',
      'canceled', 'cancelled'
    ];
    
    return completedStatuses.some(completedStatus => 
      status.includes(completedStatus)
    );
  }

  /**
   * Get latest deployment information from the deployments page
   */
  async getLatestDeploymentInfo() {
    try {
      // Wait for deployments list to be present
      await this.page.waitForSelector('[data-testid="deployment-list"], .deployment-list, [data-testid="deployment-item"]', { 
        timeout: 10000 
      });
      
      // Get the first (latest) deployment
      const latestDeployment = this.page.locator('[data-testid="deployment-item"], .deployment-item').first();
      
      if (await latestDeployment.count() === 0) {
        throw new Error('No deployments found');
      }
      
      // Extract deployment information using multiple selectors
      const deploymentId = await this.extractText(latestDeployment, [
        '[data-testid="deployment-id"]',
        '.deployment-id',
        '[data-deployment-id]'
      ]) || 'Unknown';
      
      const status = await this.extractText(latestDeployment, [
        '[data-testid="deployment-status"]',
        '.deployment-status',
        '.status'
      ]) || 'Unknown';
      
      const branch = await this.extractText(latestDeployment, [
        '[data-testid="deployment-branch"]',
        '.branch',
        '.git-branch'
      ]) || 'Unknown';
      
      const timestamp = await this.extractText(latestDeployment, [
        '[data-testid="deployment-created"]',
        '.deployment-time',
        '.timestamp'
      ]) || new Date().toISOString();
      
      return {
        deploymentId,
        status,
        branch,
        timestamp: new Date().toISOString(),
        originalTimestamp: timestamp
      };
      
    } catch (error) {
      console.error('❌ Failed to get deployment info:', error.message);
      throw error;
    }
  }

  /**
   * Helper method to extract text using multiple selectors
   */
  async extractText(parentLocator, selectors) {
    for (const selector of selectors) {
      try {
        const element = parentLocator.locator(selector);
        if (await element.count() > 0) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (e) {
        // Continue to next selector
        continue;
      }
    }
    return null;
  }

  /**
   * Extract detailed error information from failed deployments
   * Returns structured error data with file locations and line numbers
   */
  async extractDetailedErrors(deploymentInfo) {
    console.log('🔍 Extracting detailed error information...');
    
    try {
      // Click on the deployment to access detailed view
      const deploymentItem = this.page.locator('[data-testid="deployment-item"]').first();
      await deploymentItem.click();
      await this.page.waitForTimeout(3000);
      
      // Look for build logs and error details
      const errorData = {
        type: ResultTypes.ERROR,
        deploymentId: deploymentInfo.deploymentId,
        status: deploymentInfo.status,
        timestamp: new Date().toISOString(),
        errors: []
      };
      
      // Extract build errors with file locations
      const buildErrors = await this.extractBuildErrors();
      errorData.errors.push(...buildErrors);
      
      // Extract TypeScript errors
      const tsErrors = await this.extractTypeScriptErrors();
      errorData.errors.push(...tsErrors);
      
      // Extract ESLint errors
      const lintErrors = await this.extractLintErrors();
      errorData.errors.push(...lintErrors);
      
      // Extract general build output for context
      const buildOutput = await this.extractBuildOutput();
      if (buildOutput) {
        errorData.buildOutput = buildOutput;
      }
      
      // If no specific errors found, extract general error messages
      if (errorData.errors.length === 0) {
        const generalErrors = await this.extractGeneralErrors();
        errorData.errors.push(...generalErrors);
      }
      
      return errorData;
      
    } catch (error) {
      console.error('❌ Failed to extract error details:', error.message);
      return {
        type: ResultTypes.ERROR,
        message: `Failed to extract error details: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract build errors with file locations and line numbers
   */
  async extractBuildErrors() {
    const errors = [];
    
    try {
      // Look for build error patterns
      const errorSelectors = [
        '[data-testid="build-error"]',
        '.build-error',
        '.error-message',
        '.build-output .error'
      ];
      
      for (const selector of errorSelectors) {
        const errorElements = await this.page.locator(selector).all();
        
        for (const element of errorElements) {
          const errorText = await element.textContent();
          if (errorText && errorText.trim()) {
            const parsedError = this.parseErrorMessage(errorText);
            if (parsedError) {
              errors.push(parsedError);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract build errors:', e.message);
    }
    
    return errors;
  }

  /**
   * Extract TypeScript compilation errors
   */
  async extractTypeScriptErrors() {
    const errors = [];
    
    try {
      // Look for TypeScript error patterns
      const tsErrorPattern = /Type error in (.+):(\d+):(\d+)[\s\S]*?TS(\d+): (.+)/g;
      const pageContent = await this.page.content();
      
      let match;
      while ((match = tsErrorPattern.exec(pageContent)) !== null) {
        errors.push({
          type: 'TypeScript Error',
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: `TS${match[4]}`,
          message: match[5].trim()
        });
      }
    } catch (e) {
      console.warn('Could not extract TypeScript errors:', e.message);
    }
    
    return errors;
  }

  /**
   * Extract ESLint errors
   */
  async extractLintErrors() {
    const errors = [];
    
    try {
      const lintErrorPattern = /(.+):(\d+):(\d+): (.+) \((.+)\)/g;
      const pageContent = await this.page.content();
      
      let match;
      while ((match = lintErrorPattern.exec(pageContent)) !== null) {
        errors.push({
          type: 'ESLint Error',
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          message: match[4].trim(),
          rule: match[5]
        });
      }
    } catch (e) {
      console.warn('Could not extract ESLint errors:', e.message);
    }
    
    return errors;
  }

  /**
   * Extract general build output for context
   */
  async extractBuildOutput() {
    try {
      const outputSelectors = [
        '[data-testid="build-output"]',
        '.build-output',
        '.console-output',
        '.log-output'
      ];
      
      for (const selector of outputSelectors) {
        const output = await this.page.locator(selector).textContent();
        if (output && output.trim()) {
          // Return last 1000 characters to avoid huge outputs
          return output.trim().slice(-1000);
        }
      }
    } catch (e) {
      console.warn('Could not extract build output:', e.message);
    }
    
    return null;
  }

  /**
   * Extract general error messages if specific parsing fails
   */
  async extractGeneralErrors() {
    const errors = [];
    
    try {
      const errorSelectors = [
        '.error',
        '.failure',
        '[data-testid="error-message"]'
      ];
      
      for (const selector of errorSelectors) {
        const errorElements = await this.page.locator(selector).all();
        
        for (const element of errorElements) {
          const errorText = await element.textContent();
          if (errorText && errorText.trim()) {
            errors.push({
              type: 'General Error',
              message: errorText.trim()
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract general errors:', e.message);
    }
    
    return errors;
  }

  /**
   * Parse error messages to extract file, line, and error details
   */
  parseErrorMessage(errorText) {
    // Common error patterns
    const patterns = [
      // TypeScript errors: src/app/page.tsx(10,5): error TS2322: ...
      /(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/,
      // ESLint errors: src/app/page.tsx:10:5: error message (rule-name)
      /(.+):(\d+):(\d+): (.+) \((.+)\)/,
      // General file errors: Error in src/app/page.tsx: message
      /Error in (.+): (.+)/,
      // Build errors: Failed to compile src/app/page.tsx
      /Failed to compile (.+)/
    ];
    
    for (const pattern of patterns) {
      const match = errorText.match(pattern);
      if (match) {
        if (pattern === patterns[0]) { // TypeScript
          return {
            type: 'TypeScript Error',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: match[4],
            message: match[5].trim()
          };
        } else if (pattern === patterns[1]) { // ESLint
          return {
            type: 'ESLint Error',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4].trim(),
            rule: match[5]
          };
        } else if (pattern === patterns[2]) { // General file error
          return {
            type: 'Build Error',
            file: match[1],
            message: match[2].trim()
          };
        } else if (pattern === patterns[3]) { // Compilation error
          return {
            type: 'Compilation Error',
            file: match[1],
            message: `Failed to compile ${match[1]}`
          };
        }
      }
    }
    
    // If no pattern matches, return as general error
    return {
      type: 'General Error',
      message: errorText.trim()
    };
  }

  /**
   * Log monitoring results to file for debugging and history
   */
  async logResult(result) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        result: result,
        project: this.projectName,
        branch: this.targetBranch
      };
      
      const logContent = `# Deployment Monitor Log\n\n${JSON.stringify(logEntry, null, 2)}\n\n---\n\n`;
      
      // Append to log file
      try {
        const existingContent = await fs.readFile(this.logFilePath, 'utf8');
        await fs.writeFile(this.logFilePath, logContent + existingContent, 'utf8');
      } catch (e) {
        // File doesn't exist, create it
        await fs.writeFile(this.logFilePath, logContent, 'utf8');
      }
    } catch (error) {
      console.warn('⚠️ Failed to write log file:', error.message);
    }
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
   * Main monitoring method - returns structured results
   * 
   * @returns {Promise<Object>} Structured result object
   */
  async monitorDeployment() {
    try {
      console.log('🎯 Starting specialized Vercel deployment monitoring...');
      console.log(`📋 Project: ${this.projectName}`);
      console.log(`🌿 Branch: ${this.targetBranch}`);
      
      // Initialize browser
      await this.init();
      
      // Authenticate
      const authResult = await this.authenticate();
      if (authResult.type !== ResultTypes.SUCCESS) {
        await this.logResult(authResult);
        return authResult;
      }
      
      // Navigate to project
      const navResult = await this.navigateToProject();
      if (navResult.type !== ResultTypes.SUCCESS) {
        await this.logResult(navResult);
        return navResult;
      }
      
      // Get initial deployment status
      const initialDeploymentInfo = await this.getLatestDeploymentInfo();
      console.log(`📊 Initial deployment status: ${initialDeploymentInfo.status}`);
      
      // Wait for completion if deployment is in progress
      let finalDeploymentInfo;
      if (!this.isDeploymentComplete(initialDeploymentInfo.status.toLowerCase())) {
        finalDeploymentInfo = await this.waitForDeploymentCompletion(initialDeploymentInfo.status);
      } else {
        finalDeploymentInfo = initialDeploymentInfo;
      }
      
      // Check final result
      if (finalDeploymentInfo.type === ResultTypes.TIMEOUT) {
        await this.logResult(finalDeploymentInfo);
        return finalDeploymentInfo;
      }
      
      const finalStatus = finalDeploymentInfo.status.toLowerCase();
      
      // Success case
      if (finalStatus.includes('ready') || finalStatus.includes('success')) {
        const successResult = {
          type: ResultTypes.SUCCESS,
          message: 'Build completed successfully',
          deploymentId: finalDeploymentInfo.deploymentId,
          status: finalDeploymentInfo.status,
          timestamp: new Date().toISOString()
        };
        
        console.log('✅ Deployment completed successfully!');
        await this.logResult(successResult);
        return successResult;
      }
      
      // Error case - extract detailed error information
      const errorResult = await this.extractDetailedErrors(finalDeploymentInfo);
      console.log(`❌ Deployment failed with ${errorResult.errors.length} errors`);
      await this.logResult(errorResult);
      return errorResult;
      
    } catch (error) {
      const errorResult = {
        type: ResultTypes.ERROR,
        message: `Monitor agent error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ Monitor agent failed:', error.message);
      await this.logResult(errorResult);
      return errorResult;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use as a module
module.exports = {
  VercelMonitorAgent,
  ResultTypes
};

// CLI usage
if (require.main === module) {
  const agent = new VercelMonitorAgent();
  
  agent.monitorDeployment()
    .then(result => {
      console.log('\n📋 FINAL RESULT:');
      console.log(JSON.stringify(result, null, 2));
      
      // Exit with appropriate code
      process.exit(result.type === ResultTypes.SUCCESS ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Subagent failed:', error);
      process.exit(1);
    });
}