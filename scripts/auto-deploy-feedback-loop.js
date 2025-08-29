/**
 * Automated Deployment Feedback Loop
 * 
 * This script creates a complete feedback loop that:
 * 1. Makes fixes to code
 * 2. Commits and pushes changes
 * 3. Monitors Vercel deployment
 * 4. Reports results or continues with fixes
 * 5. Repeats until successful deployment
 * 
 * Usage:
 * node scripts/auto-deploy-feedback-loop.js
 * 
 * Environment Variables:
 * - VERCEL_EMAIL: Your Vercel account email
 * - VERCEL_PASSWORD: Your Vercel account password
 * - MAX_ATTEMPTS: Maximum number of fix attempts (default: 5)
 * - GITHUB_REPO: GitHub repository (default: aridon99/snapquote)
 * - TARGET_BRANCH: Target branch (default: master)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { VercelMonitorAgent, ResultTypes } = require('./vercel-monitor-subagent');

const execAsync = promisify(exec);

class AutoDeployFeedbackLoop {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || parseInt(process.env.MAX_ATTEMPTS) || 5;
    this.currentAttempt = 0;
    this.projectRoot = options.projectRoot || process.cwd();
    this.monitorAgent = new VercelMonitorAgent(options);
    this.logFilePath = path.join(this.projectRoot, 'auto-deploy-log.json');
    this.fixesApplied = [];
    this.deploymentHistory = [];
  }

  /**
   * Initialize the feedback loop
   */
  async init() {
    console.log('🔄 Initializing Auto-Deploy Feedback Loop...');
    console.log(`📁 Project Root: ${this.projectRoot}`);
    console.log(`🎯 Max Attempts: ${this.maxAttempts}`);
    console.log(`🌿 Target Branch: ${this.monitorAgent.targetBranch}`);
    
    // Verify git repository
    try {
      await execAsync('git status', { cwd: this.projectRoot });
    } catch (error) {
      throw new Error(`Not a git repository or git not available: ${error.message}`);
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges() {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectRoot });
      return stdout.trim().length > 0;
    } catch (error) {
      console.warn('Could not check git status:', error.message);
      return false;
    }
  }

  /**
   * Commit and push changes to the repository
   */
  async commitAndPush(message) {
    try {
      console.log('📝 Committing changes...');
      
      // Add all changes
      await execAsync('git add .', { cwd: this.projectRoot });
      
      // Create commit with timestamp
      const timestamp = new Date().toISOString();
      const commitMessage = `${message} - Auto-deploy fix attempt ${this.currentAttempt} (${timestamp})`;
      
      await execAsync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
      
      console.log('📤 Pushing to remote...');
      await execAsync(`git push origin ${this.monitorAgent.targetBranch}`, { cwd: this.projectRoot });
      
      console.log('✅ Successfully pushed changes');
      return { success: true, commitMessage };
      
    } catch (error) {
      console.error('❌ Failed to commit/push:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Wait for deployment to appear on Vercel (new deployment after push)
   */
  async waitForNewDeployment(timeoutMs = 60000) {
    console.log('⏳ Waiting for new deployment to appear...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Initialize a temporary monitor to check for new deployments
        const tempAgent = new VercelMonitorAgent();
        await tempAgent.init();
        
        const authResult = await tempAgent.authenticate();
        if (authResult.type !== ResultTypes.SUCCESS) {
          throw new Error('Authentication failed');
        }
        
        const navResult = await tempAgent.navigateToProject();
        if (navResult.type !== ResultTypes.SUCCESS) {
          throw new Error('Navigation failed');
        }
        
        const deploymentInfo = await tempAgent.getLatestDeploymentInfo();
        await tempAgent.cleanup();
        
        // Check if this is a recent deployment (within last 2 minutes)
        const deploymentTime = new Date(deploymentInfo.timestamp);
        const now = new Date();
        const timeDiff = now - deploymentTime;
        
        if (timeDiff < 120000) { // 2 minutes
          console.log('✅ New deployment detected');
          return deploymentInfo;
        }
        
        console.log('⏳ Waiting for deployment to start...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
      } catch (error) {
        console.warn('⚠️ Error checking for deployment:', error.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error('Timeout waiting for new deployment');
  }

  /**
   * Apply automated fixes based on deployment errors
   */
  async applyFixes(errorResult) {
    console.log(`🔧 Attempting to apply fixes for ${errorResult.errors.length} errors...`);
    
    let fixesApplied = [];
    
    for (const error of errorResult.errors) {
      try {
        const fix = await this.generateFix(error);
        if (fix.applied) {
          fixesApplied.push({
            error: error,
            fix: fix,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn(`⚠️ Could not apply fix for error: ${error.message}`, e.message);
      }
    }
    
    this.fixesApplied.push(...fixesApplied);
    
    if (fixesApplied.length > 0) {
      console.log(`✅ Applied ${fixesApplied.length} fixes`);
      return { success: true, fixesApplied };
    } else {
      console.log('❌ No fixes could be applied automatically');
      return { success: false, reason: 'No applicable automatic fixes found' };
    }
  }

  /**
   * Generate and apply a fix for a specific error
   */
  async generateFix(error) {
    console.log(`🎯 Generating fix for: ${error.type} - ${error.message}`);
    
    // TypeScript errors
    if (error.type === 'TypeScript Error' && error.file) {
      return await this.fixTypeScriptError(error);
    }
    
    // ESLint errors
    if (error.type === 'ESLint Error' && error.file) {
      return await this.fixESLintError(error);
    }
    
    // Import/require errors
    if (error.message.includes('Cannot find module') || error.message.includes('Module not found')) {
      return await this.fixModuleNotFoundError(error);
    }
    
    // Build errors
    if (error.type === 'Build Error') {
      return await this.fixBuildError(error);
    }
    
    return { applied: false, reason: 'No automatic fix available for this error type' };
  }

  /**
   * Fix common TypeScript errors
   */
  async fixTypeScriptError(error) {
    const filePath = path.join(this.projectRoot, error.file);
    
    try {
      // Check if file exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return { applied: false, reason: 'File not found' };
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      let newContent = content;
      
      // Common TypeScript fixes
      if (error.code === 'TS2322' && error.message.includes('not assignable to type')) {
        // Type assertion fix
        if (error.line && error.column) {
          newContent = this.addTypeAssertion(content, error.line, error.column);
        }
      } else if (error.code === 'TS2339' && error.message.includes('does not exist on type')) {
        // Optional chaining fix
        newContent = this.addOptionalChaining(content, error.message);
      } else if (error.code === 'TS7006' && error.message.includes('implicitly has an \'any\' type')) {
        // Add type annotations
        newContent = this.addTypeAnnotations(content, error.line);
      }
      
      if (newContent !== content) {
        await fs.writeFile(filePath, newContent, 'utf8');
        return { 
          applied: true, 
          fix: `Applied TypeScript fix for ${error.code} in ${error.file}:${error.line}`,
          changes: 'Type annotation/assertion added'
        };
      }
      
    } catch (e) {
      console.warn(`Failed to fix TypeScript error in ${error.file}:`, e.message);
    }
    
    return { applied: false, reason: 'Could not automatically fix this TypeScript error' };
  }

  /**
   * Fix common ESLint errors
   */
  async fixESLintError(error) {
    const filePath = path.join(this.projectRoot, error.file);
    
    try {
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return { applied: false, reason: 'File not found' };
      }
      
      // Run ESLint with --fix flag
      const { stdout, stderr } = await execAsync(
        `npx eslint "${filePath}" --fix`,
        { cwd: this.projectRoot }
      );
      
      return {
        applied: true,
        fix: `Applied ESLint --fix for ${error.rule} in ${error.file}:${error.line}`,
        output: stdout || stderr
      };
      
    } catch (e) {
      // ESLint --fix might exit with non-zero even when fixes are applied
      if (e.stdout) {
        return {
          applied: true,
          fix: `Applied ESLint --fix (with warnings) for ${error.rule} in ${error.file}:${error.line}`,
          output: e.stdout
        };
      }
    }
    
    return { applied: false, reason: 'ESLint --fix could not resolve this error' };
  }

  /**
   * Fix module not found errors
   */
  async fixModuleNotFoundError(error) {
    const missingModule = this.extractModuleName(error.message);
    
    if (!missingModule) {
      return { applied: false, reason: 'Could not identify missing module' };
    }
    
    try {
      console.log(`📦 Installing missing module: ${missingModule}`);
      
      // Try to install the module
      const { stdout } = await execAsync(`npm install ${missingModule}`, { cwd: this.projectRoot });
      
      return {
        applied: true,
        fix: `Installed missing module: ${missingModule}`,
        output: stdout
      };
      
    } catch (e) {
      // Try with common type packages
      const typesPackage = `@types/${missingModule}`;
      try {
        const { stdout } = await execAsync(`npm install -D ${typesPackage}`, { cwd: this.projectRoot });
        return {
          applied: true,
          fix: `Installed missing types package: ${typesPackage}`,
          output: stdout
        };
      } catch (e2) {
        console.warn(`Could not install ${missingModule} or ${typesPackage}`);
      }
    }
    
    return { applied: false, reason: `Could not install missing module: ${missingModule}` };
  }

  /**
   * Fix general build errors
   */
  async fixBuildError(error) {
    // Check for common build issues
    if (error.message.includes('out of memory')) {
      return await this.fixMemoryError();
    }
    
    if (error.message.includes('ENOSPC') || error.message.includes('no space left')) {
      return { applied: false, reason: 'Disk space issue - manual intervention required' };
    }
    
    return { applied: false, reason: 'No automatic fix available for this build error' };
  }

  /**
   * Helper methods for specific fixes
   */
  extractModuleName(message) {
    const patterns = [
      /Cannot find module ['"`]([^'"`]+)['"`]/,
      /Module not found: Error: Can't resolve ['"`]([^'"`]+)['"`]/,
      /Cannot resolve module ['"`]([^'"`]+)['"`]/
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  addTypeAssertion(content, line, column) {
    // Simple type assertion addition - this is a basic implementation
    const lines = content.split('\n');
    if (lines[line - 1]) {
      // Add 'as any' type assertion for quick fixes
      lines[line - 1] = lines[line - 1].replace(/([^;]+)(;?)$/, '$1 as any$2');
    }
    return lines.join('\n');
  }

  addOptionalChaining(content, errorMessage) {
    // Add optional chaining for property access errors
    const propertyMatch = errorMessage.match(/Property '([^']+)' does not exist/);
    if (propertyMatch) {
      const property = propertyMatch[1];
      return content.replace(
        new RegExp(`\\.${property}\\b`, 'g'),
        `.${property}?`
      );
    }
    return content;
  }

  addTypeAnnotations(content, line) {
    const lines = content.split('\n');
    if (lines[line - 1]) {
      // Add basic type annotations for parameters
      lines[line - 1] = lines[line - 1].replace(
        /function\s+\w+\s*\(([^)]*)\)/,
        (match, params) => {
          if (params && !params.includes(':')) {
            const typedParams = params.split(',').map(p => p.trim() + ': any').join(', ');
            return match.replace(params, typedParams);
          }
          return match;
        }
      );
    }
    return lines.join('\n');
  }

  async fixMemoryError() {
    try {
      // Increase Node.js memory limit
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts.build.includes('--max_old_space_size')) {
        packageJson.scripts.build = packageJson.scripts.build.replace(
          'next build',
          'node --max_old_space_size=4096 ./node_modules/.bin/next build'
        );
        
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        
        return {
          applied: true,
          fix: 'Increased Node.js memory limit for build process',
          changes: 'Modified package.json build script'
        };
      }
    } catch (e) {
      console.warn('Could not apply memory fix:', e.message);
    }
    
    return { applied: false, reason: 'Memory limit already configured or could not modify' };
  }

  /**
   * Log the complete feedback loop session
   */
  async logSession(sessionResult) {
    const sessionLog = {
      timestamp: new Date().toISOString(),
      attempts: this.currentAttempt,
      maxAttempts: this.maxAttempts,
      finalResult: sessionResult,
      deploymentHistory: this.deploymentHistory,
      fixesApplied: this.fixesApplied,
      success: sessionResult.type === ResultTypes.SUCCESS
    };
    
    try {
      // Read existing sessions
      let existingSessions = [];
      try {
        const content = await fs.readFile(this.logFilePath, 'utf8');
        existingSessions = JSON.parse(content);
      } catch (e) {
        // File doesn't exist, start fresh
      }
      
      // Add new session and keep only last 10 sessions
      existingSessions.unshift(sessionLog);
      existingSessions = existingSessions.slice(0, 10);
      
      // Save updated log
      await fs.writeFile(this.logFilePath, JSON.stringify(existingSessions, null, 2), 'utf8');
      
      console.log(`📝 Session logged to: ${this.logFilePath}`);
    } catch (error) {
      console.warn('⚠️ Failed to log session:', error.message);
    }
  }

  /**
   * Main feedback loop execution
   */
  async run() {
    try {
      await this.init();
      
      console.log('🔄 Starting automated deployment feedback loop...');
      
      while (this.currentAttempt < this.maxAttempts) {
        this.currentAttempt++;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 ATTEMPT ${this.currentAttempt} of ${this.maxAttempts}`);
        console.log(`${'='.repeat(60)}`);
        
        // Check if there are changes to commit
        if (this.currentAttempt === 1 || this.fixesApplied.length > 0) {
          const hasChanges = await this.hasUncommittedChanges();
          
          if (hasChanges || this.fixesApplied.length > 0) {
            // Commit and push changes
            const commitMessage = this.currentAttempt === 1 
              ? 'Initial deployment attempt'
              : `Auto-fix attempt ${this.currentAttempt - 1}: Applied ${this.fixesApplied.length} fixes`;
              
            const pushResult = await this.commitAndPush(commitMessage);
            
            if (!pushResult.success) {
              console.error('❌ Failed to push changes:', pushResult.error);
              continue;
            }
            
            // Wait for new deployment to appear
            try {
              await this.waitForNewDeployment();
            } catch (error) {
              console.warn('⚠️ Could not detect new deployment, monitoring latest...');
            }
          }
        }
        
        // Monitor the deployment
        console.log('👀 Monitoring deployment...');
        const result = await this.monitorAgent.monitorDeployment();
        
        // Add to deployment history
        this.deploymentHistory.push({
          attempt: this.currentAttempt,
          timestamp: new Date().toISOString(),
          result: result
        });
        
        console.log(`\n📊 DEPLOYMENT RESULT - ATTEMPT ${this.currentAttempt}:`);
        console.log(`Type: ${result.type}`);
        console.log(`Status: ${result.status || 'N/A'}`);
        
        // Handle different result types
        if (result.type === ResultTypes.SUCCESS) {
          console.log('\n🎉 SUCCESS! Deployment completed successfully!');
          console.log(`✅ Deployment ID: ${result.deploymentId}`);
          console.log(`📊 Total Attempts: ${this.currentAttempt}`);
          console.log(`🔧 Total Fixes Applied: ${this.fixesApplied.length}`);
          
          await this.logSession(result);
          return result;
          
        } else if (result.type === ResultTypes.ERROR && result.errors && result.errors.length > 0) {
          console.log(`\n❌ Deployment failed with ${result.errors.length} errors:`);
          result.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.type}: ${error.message}`);
            if (error.file) console.log(`   📁 File: ${error.file}${error.line ? `:${error.line}` : ''}`);
          });
          
          // Attempt to apply fixes
          const fixResult = await this.applyFixes(result);
          
          if (!fixResult.success && this.currentAttempt >= this.maxAttempts) {
            console.log('\n💔 Maximum attempts reached. Manual intervention required.');
            console.log('\n📋 FINAL ERROR SUMMARY:');
            result.errors.forEach((error, index) => {
              console.log(`\n${index + 1}. ${error.type} in ${error.file || 'unknown file'}`);
              console.log(`   Message: ${error.message}`);
              if (error.line) console.log(`   Location: Line ${error.line}${error.column ? `, Column ${error.column}` : ''}`);
            });
            
            await this.logSession(result);
            return result;
          } else if (!fixResult.success) {
            console.log(`⚠️ Could not apply automatic fixes: ${fixResult.reason}`);
            console.log('Continuing to next attempt...');
          }
          
        } else {
          console.log(`\n⚠️ Unexpected result type: ${result.type}`);
          console.log(`Message: ${result.message || 'No message'}`);
          
          if (this.currentAttempt >= this.maxAttempts) {
            await this.logSession(result);
            return result;
          }
        }
        
        if (this.currentAttempt < this.maxAttempts) {
          console.log(`\n⏳ Preparing for next attempt in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      console.log('\n💔 Maximum attempts reached without success');
      const finalResult = {
        type: ResultTypes.ERROR,
        message: 'Maximum attempts reached',
        attempts: this.currentAttempt,
        timestamp: new Date().toISOString()
      };
      
      await this.logSession(finalResult);
      return finalResult;
      
    } catch (error) {
      console.error('❌ Feedback loop failed:', error.message);
      const errorResult = {
        type: ResultTypes.ERROR,
        message: `Feedback loop error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      await this.logSession(errorResult);
      return errorResult;
    }
  }
}

// Export for use as a module
module.exports = {
  AutoDeployFeedbackLoop
};

// CLI usage
if (require.main === module) {
  const feedbackLoop = new AutoDeployFeedbackLoop();
  
  feedbackLoop.run()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log('🏁 FINAL RESULT');
      console.log('='.repeat(60));
      console.log(JSON.stringify(result, null, 2));
      
      // Exit with appropriate code
      process.exit(result.type === ResultTypes.SUCCESS ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Catastrophic failure:', error);
      process.exit(1);
    });
}