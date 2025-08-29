/**
 * MCP Playwright Compatible Vercel Monitor
 * 
 * Designed to work with Claude Code's MCP Playwright tools for seamless integration
 * with automated deployment monitoring workflows.
 * 
 * This script can be called directly by Claude Code or used as a standalone tool.
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * MCP-compatible Vercel Monitor that works with Claude Code Playwright tools
 */
class MCPVercelMonitor {
  constructor(options = {}) {
    this.projectName = options.projectName || process.env.VERCEL_PROJECT_NAME || 'renovation-advisor';
    this.githubRepo = options.githubRepo || process.env.GITHUB_REPO || 'aridon99/snapquote';
    this.targetBranch = options.targetBranch || process.env.TARGET_BRANCH || 'master';
    this.maxWaitTime = options.maxWaitTime || 300000; // 5 minutes
    this.pollInterval = options.pollInterval || 15000; // 15 seconds for MCP
    this.logFilePath = path.join(__dirname, '..', 'mcp-deployment-log.json');
  }

  /**
   * Generate MCP Playwright commands for Claude Code to execute
   * This returns the sequence of commands needed for monitoring
   */
  generatePlaywrightCommands() {
    return {
      setup: [
        {
          action: 'launch',
          options: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        },
        {
          action: 'newPage',
          options: {}
        },
        {
          action: 'setViewportSize',
          options: { width: 1280, height: 720 }
        }
      ],
      
      authentication: [
        {
          action: 'goto',
          url: 'https://vercel.com/login',
          options: { waitUntil: 'networkidle', timeout: 15000 }
        },
        {
          action: 'fill',
          selector: 'input[name="email"]',
          value: '${VERCEL_EMAIL}'
        },
        {
          action: 'fill',
          selector: 'input[name="password"]',
          value: '${VERCEL_PASSWORD}'
        },
        {
          action: 'click',
          selector: 'button[type="submit"]'
        },
        {
          action: 'waitForURL',
          pattern: '**/dashboard**',
          options: { timeout: 15000 }
        }
      ],
      
      navigation: [
        {
          action: 'goto',
          url: `https://vercel.com/aridon99/${this.projectName}/deployments`,
          options: { waitUntil: 'networkidle', timeout: 15000 }
        },
        {
          action: 'waitForSelector',
          selector: '[data-testid="deployment-list"], .deployment-list',
          options: { timeout: 10000 }
        }
      ],
      
      monitoring: [
        {
          action: 'locator',
          selector: '[data-testid="deployment-item"]',
          method: 'first'
        },
        {
          action: 'getAttribute',
          selector: '[data-testid="deployment-item"] [data-testid="deployment-status"]',
          attribute: 'textContent'
        }
      ]
    };
  }

  /**
   * Generate environment variables needed for the monitoring
   */
  getRequiredEnvVars() {
    return {
      VERCEL_EMAIL: process.env.VERCEL_EMAIL || 'Required: Your Vercel account email',
      VERCEL_PASSWORD: process.env.VERCEL_PASSWORD || 'Required: Your Vercel account password',
      VERCEL_PROJECT_NAME: this.projectName,
      GITHUB_REPO: this.githubRepo,
      TARGET_BRANCH: this.targetBranch
    };
  }

  /**
   * Parse deployment status from MCP Playwright response
   */
  parseDeploymentStatus(mcpResponse) {
    const statusText = mcpResponse.status || mcpResponse.textContent || '';
    const statusLower = statusText.toLowerCase();

    if (statusLower.includes('ready') || statusLower.includes('success')) {
      return 'SUCCESS';
    } else if (statusLower.includes('error') || statusLower.includes('failed')) {
      return 'ERROR';
    } else if (statusLower.includes('building') || statusLower.includes('progress') || statusLower.includes('queued')) {
      return 'IN_PROGRESS';
    } else {
      return 'UNKNOWN';
    }
  }

  /**
   * Generate error extraction commands for failed deployments
   */
  generateErrorExtractionCommands() {
    return [
      {
        action: 'click',
        selector: '[data-testid="deployment-item"]:first-child'
      },
      {
        action: 'waitForTimeout',
        duration: 3000
      },
      {
        action: 'locator',
        selector: '[data-testid="build-error"], .build-error, .error-message',
        method: 'allTextContents'
      },
      {
        action: 'locator',
        selector: '[data-testid="build-output"], .build-output',
        method: 'textContent'
      }
    ];
  }

  /**
   * Create a structured monitoring plan for Claude Code
   */
  createMonitoringPlan() {
    return {
      name: 'Vercel Deployment Monitor',
      description: 'Automated monitoring of Vercel deployments with structured error reporting',
      
      steps: [
        {
          step: 1,
          name: 'Environment Check',
          description: 'Verify required environment variables',
          requiredVars: this.getRequiredEnvVars(),
          action: 'validate_environment'
        },
        {
          step: 2,
          name: 'Browser Setup',
          description: 'Initialize Playwright browser with optimal settings',
          commands: this.generatePlaywrightCommands().setup,
          action: 'setup_browser'
        },
        {
          step: 3,
          name: 'Vercel Authentication',
          description: 'Log into Vercel dashboard',
          commands: this.generatePlaywrightCommands().authentication,
          action: 'authenticate',
          expectedResult: 'Successful navigation to dashboard'
        },
        {
          step: 4,
          name: 'Project Navigation',
          description: `Navigate to ${this.projectName} project deployments`,
          commands: this.generatePlaywrightCommands().navigation,
          action: 'navigate_to_project',
          expectedResult: 'Deployment list visible'
        },
        {
          step: 5,
          name: 'Status Monitoring',
          description: 'Monitor deployment status until completion',
          commands: this.generatePlaywrightCommands().monitoring,
          action: 'monitor_status',
          maxWaitTime: this.maxWaitTime,
          pollInterval: this.pollInterval
        },
        {
          step: 6,
          name: 'Result Processing',
          description: 'Extract and structure deployment results',
          conditionalCommands: {
            onSuccess: [],
            onError: this.generateErrorExtractionCommands()
          },
          action: 'process_results'
        }
      ],
      
      expectedResults: {
        SUCCESS: {
          type: 'SUCCESS',
          message: 'Build completed successfully',
          structure: {
            deploymentId: 'string',
            status: 'string',
            timestamp: 'ISO string'
          }
        },
        ERROR: {
          type: 'ERROR',
          message: 'Build failed with specific error details',
          structure: {
            deploymentId: 'string',
            status: 'string',
            timestamp: 'ISO string',
            errors: [
              {
                type: 'string (TypeScript Error, ESLint Error, etc.)',
                file: 'string (file path)',
                line: 'number (optional)',
                column: 'number (optional)',
                message: 'string (error description)',
                code: 'string (error code, optional)'
              }
            ],
            buildOutput: 'string (last 1000 chars of build output)'
          }
        }
      }
    };
  }

  /**
   * Save monitoring results to structured log file
   */
  async saveResults(results) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        project: this.projectName,
        branch: this.targetBranch,
        results: results
      };

      // Read existing log
      let existingLog = [];
      try {
        const existingContent = await fs.readFile(this.logFilePath, 'utf8');
        existingLog = JSON.parse(existingContent);
      } catch (e) {
        // File doesn't exist or is invalid, start fresh
      }

      // Add new entry and keep only last 50 entries
      existingLog.unshift(logEntry);
      existingLog = existingLog.slice(0, 50);

      // Save updated log
      await fs.writeFile(this.logFilePath, JSON.stringify(existingLog, null, 2), 'utf8');
      
      return { success: true, logPath: this.logFilePath };
    } catch (error) {
      console.error('Failed to save results:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate a complete monitoring script for Claude Code
   */
  generateClaudeCodeScript() {
    const plan = this.createMonitoringPlan();
    
    return `
# Vercel Deployment Monitor Script for Claude Code

## Overview
This script provides automated Vercel deployment monitoring using MCP Playwright tools.

**Project**: ${this.projectName}  
**GitHub Repo**: ${this.githubRepo}  
**Target Branch**: ${this.targetBranch}  

## Required Environment Variables
\`\`\`bash
export VERCEL_EMAIL="your-vercel-email@example.com"
export VERCEL_PASSWORD="your-vercel-password"
export VERCEL_PROJECT_NAME="${this.projectName}"
export GITHUB_REPO="${this.githubRepo}"
export TARGET_BRANCH="${this.targetBranch}"
\`\`\`

## Monitoring Steps

${plan.steps.map(step => `
### Step ${step.step}: ${step.name}
${step.description}

**Action**: \`${step.action}\`
${step.expectedResult ? `**Expected Result**: ${step.expectedResult}` : ''}
${step.maxWaitTime ? `**Max Wait Time**: ${step.maxWaitTime}ms` : ''}
${step.commands ? `
**Commands**:
\`\`\`javascript
${JSON.stringify(step.commands, null, 2)}
\`\`\`
` : ''}
`).join('')}

## Expected Return Types

### Success Response
\`\`\`json
${JSON.stringify(plan.expectedResults.SUCCESS, null, 2)}
\`\`\`

### Error Response
\`\`\`json
${JSON.stringify(plan.expectedResults.ERROR, null, 2)}
\`\`\`

## Usage with Claude Code

1. Set environment variables
2. Call this monitor after each git push
3. Parse the returned JSON structure
4. Use error details to make targeted fixes
5. Repeat until SUCCESS

## Example Integration

\`\`\`bash
# After making fixes and pushing to git
git add .
git commit -m "Fix deployment issues"
git push origin ${this.targetBranch}

# Monitor deployment
node scripts/mcp-vercel-monitor.js

# Check result and repeat if needed
\`\`\`
`;
  }
}

// Export for module usage
module.exports = {
  MCPVercelMonitor
};

// CLI usage and script generation
if (require.main === module) {
  const monitor = new MCPVercelMonitor();
  
  // Generate and output the monitoring plan
  const plan = monitor.createMonitoringPlan();
  console.log('📋 Vercel Deployment Monitor Plan Generated');
  console.log('='.repeat(50));
  console.log(JSON.stringify(plan, null, 2));
  
  // Generate Claude Code script
  const script = monitor.generateClaudeCodeScript();
  console.log('\n📝 Claude Code Integration Script');
  console.log('='.repeat(50));
  console.log(script);
  
  // Save the plan to a file
  const planPath = path.join(__dirname, '..', 'vercel-monitor-plan.json');
  const scriptPath = path.join(__dirname, '..', 'VERCEL_MONITOR_GUIDE.md');
  
  Promise.all([
    fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8'),
    fs.writeFile(scriptPath, script, 'utf8')
  ]).then(() => {
    console.log(`\n✅ Files created:`);
    console.log(`📋 Monitoring Plan: ${planPath}`);
    console.log(`📖 Integration Guide: ${scriptPath}`);
  }).catch(error => {
    console.error('❌ Failed to create files:', error.message);
  });
}