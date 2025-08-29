#!/usr/bin/env node

/**
 * Process Deployment Result Handler
 * 
 * This script processes Vercel deployment check results and determines next actions.
 * It can be called with deployment status information to automate the fix process.
 */

class DeploymentResultProcessor {
  constructor() {
    this.fixCount = 6; // Current number of fixes attempted
    this.knownPatterns = {
      'Property .* does not exist on type': 'typescript-property',
      'cannot find module': 'module-import',
      'Type .* is not assignable': 'typescript-assignment',
      'Promise<.*>': 'async-promise',
      '.then().catch()': 'promise-chaining',
      'createClient()': 'async-supabase',
      'await': 'missing-await'
    };
  }

  /**
   * Process deployment result and determine next action
   * @param {Object} result - Deployment check result
   * @returns {Object} Next action to take
   */
  processResult(result) {
    const { status, error } = result;

    if (status === 'SUCCESS') {
      return this.handleSuccess();
    } else if (status === 'ERROR') {
      return this.handleError(error);
    } else if (status === 'BUILDING') {
      return this.handleBuilding();
    } else {
      return this.handleUnknown();
    }
  }

  handleSuccess() {
    console.log('✅ Deployment SUCCESSFUL!');
    console.log(`All ${this.fixCount} fixes have been applied successfully.`);
    
    return {
      action: 'proceed-to-testing',
      message: 'Build succeeded! Ready to test WhatsApp signup flow.',
      nextSteps: [
        '1. Test the health endpoint: curl https://renovation-advisor-ten.vercel.app/api/health',
        '2. Test contractor signup via Hostinger landing page',
        '3. Verify WhatsApp verification flow',
        '4. Test Quick Win quote generation'
      ]
    };
  }

  handleError(error) {
    this.fixCount++;
    console.log(`❌ Deployment FAILED - Preparing fix #${this.fixCount}`);
    
    const errorType = this.identifyErrorPattern(error.message);
    const fix = this.generateFix(error, errorType);
    
    return {
      action: 'apply-fix',
      fixNumber: this.fixCount,
      error: error,
      errorType: errorType,
      suggestedFix: fix,
      message: `Fix #${this.fixCount} needed for ${errorType} error`
    };
  }

  handleBuilding() {
    console.log('🔄 Deployment still BUILDING...');
    
    return {
      action: 'wait-and-retry',
      message: 'Deployment in progress. Check again in 30 seconds.',
      retryAfter: 30000
    };
  }

  handleUnknown() {
    console.log('❓ Unknown deployment status');
    
    return {
      action: 'manual-check',
      message: 'Unable to determine deployment status. Please check manually.'
    };
  }

  identifyErrorPattern(errorMessage) {
    for (const [pattern, type] of Object.entries(this.knownPatterns)) {
      if (new RegExp(pattern, 'i').test(errorMessage)) {
        return type;
      }
    }
    return 'unknown';
  }

  generateFix(error, errorType) {
    const fixes = {
      'typescript-property': {
        description: 'Add missing property or fix type definition',
        action: 'Check if property exists on type, may need type assertion or interface update'
      },
      'module-import': {
        description: 'Fix module import path or install missing package',
        action: 'Verify import path is correct and package is installed'
      },
      'typescript-assignment': {
        description: 'Fix type mismatch in assignment',
        action: 'Ensure types match or add proper type casting'
      },
      'async-promise': {
        description: 'Handle async/Promise properly',
        action: 'Add await or proper Promise handling'
      },
      'promise-chaining': {
        description: 'Fix Promise chaining pattern',
        action: 'Use .then(success, error) instead of .then().catch()'
      },
      'async-supabase': {
        description: 'Add await to Supabase client calls',
        action: 'Ensure all createClient() calls are awaited'
      },
      'missing-await': {
        description: 'Add missing await keyword',
        action: 'Add await to async function calls'
      },
      'unknown': {
        description: 'Unknown error type - manual investigation needed',
        action: 'Review error message and apply appropriate fix'
      }
    };

    return fixes[errorType] || fixes.unknown;
  }

  /**
   * Log result to monitoring file
   */
  async logResult(result) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const logEntry = `
## [${new Date().toISOString()}] - Deployment Check #${this.fixCount}
**Status:** ${result.status}
**Action:** ${result.action}
${result.error ? `**Error:** ${JSON.stringify(result.error, null, 2)}` : ''}
${result.suggestedFix ? `**Fix:** ${JSON.stringify(result.suggestedFix, null, 2)}` : ''}
---
`;

    const logFile = path.join(process.cwd(), 'agent-log-monitoring.md');
    
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      const updatedContent = content.replace(
        '## Latest Monitoring Result',
        `## Latest Monitoring Result\n${logEntry}`
      );
      await fs.writeFile(logFile, updatedContent);
      console.log('✅ Monitoring log updated');
    } catch (error) {
      console.error('Failed to update monitoring log:', error);
    }
  }
}

// Example usage
if (require.main === module) {
  const processor = new DeploymentResultProcessor();
  
  // Example: Process a failed deployment
  const exampleError = {
    status: 'ERROR',
    error: {
      file: 'app/api/contractors/route.ts',
      line: 42,
      message: "Property 'foo' does not exist on type 'Bar'",
      type: 'typescript'
    }
  };
  
  const result = processor.processResult(exampleError);
  console.log('\nProcessed Result:', JSON.stringify(result, null, 2));
  
  // Log the result
  processor.logResult(result);
}

module.exports = DeploymentResultProcessor;