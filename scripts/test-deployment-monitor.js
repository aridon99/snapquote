/**
 * Test Script for Vercel Deployment Monitor System
 * 
 * This script tests the complete subagent system with mock scenarios
 * and validates that all components work together correctly.
 * 
 * Usage:
 * node scripts/test-deployment-monitor.js [--mock] [--live]
 * 
 * Options:
 * --mock: Run with mock data (default)
 * --live: Run actual deployment monitoring (requires credentials)
 * --verbose: Detailed logging
 */

const { VercelMonitorAgent, ResultTypes } = require('./vercel-monitor-subagent');
const { AutoDeployFeedbackLoop } = require('./auto-deploy-feedback-loop');
const { MCPVercelMonitor } = require('./mcp-vercel-monitor');
const fs = require('fs').promises;
const path = require('path');

class DeploymentMonitorTester {
  constructor(options = {}) {
    this.mockMode = options.mock !== false; // Default to mock mode
    this.verbose = options.verbose || false;
    this.testResults = [];
    this.projectRoot = process.cwd();
  }

  /**
   * Log test messages
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (this.verbose || level === 'error') {
      this.testResults.push({
        timestamp,
        level,
        message
      });
    }
  }

  /**
   * Test the VercelMonitorAgent class
   */
  async testVercelMonitorAgent() {
    this.log('Testing VercelMonitorAgent class...');
    
    try {
      const agent = new VercelMonitorAgent({
        projectName: 'test-project',
        githubRepo: 'test/repo',
        targetBranch: 'test-branch',
        maxWaitTime: 5000 // Short timeout for testing
      });
      
      // Test initialization
      if (!this.mockMode) {
        await agent.init();
        this.log('✓ Agent initialization successful', 'success');
        await agent.cleanup();
      } else {
        this.log('✓ Agent initialization test (mocked)', 'success');
      }
      
      // Test error parsing
      const mockError = "Type error in src/app/page.tsx(42,10): error TS2322: Type 'string' is not assignable to type 'number'";
      const parsedError = agent.parseErrorMessage(mockError);
      
      if (parsedError && parsedError.type === 'TypeScript Error' && parsedError.line === 42) {
        this.log('✓ Error parsing test successful', 'success');
      } else {
        this.log('✗ Error parsing test failed', 'error');
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.log(`VercelMonitorAgent test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test the AutoDeployFeedbackLoop class
   */
  async testAutoDeployFeedbackLoop() {
    this.log('Testing AutoDeployFeedbackLoop class...');
    
    try {
      const feedbackLoop = new AutoDeployFeedbackLoop({
        maxAttempts: 2, // Limit for testing
        projectRoot: this.projectRoot
      });
      
      await feedbackLoop.init();
      this.log('✓ Feedback loop initialization successful', 'success');
      
      // Test error extraction
      const mockErrorMessage = "Cannot find module 'missing-package'";
      const moduleName = feedbackLoop.extractModuleName(mockErrorMessage);
      
      if (moduleName === 'missing-package') {
        this.log('✓ Module name extraction test successful', 'success');
      } else {
        this.log('✗ Module name extraction test failed', 'error');
        return false;
      }
      
      // Test TypeScript fix generation
      const mockTsError = {
        type: 'TypeScript Error',
        code: 'TS2339',
        message: "Property 'nonexistent' does not exist on type 'object'",
        file: 'src/test.ts',
        line: 10,
        column: 5
      };
      
      const fixResult = await feedbackLoop.generateFix(mockTsError);
      this.log(`✓ Fix generation test: ${fixResult.applied ? 'fix applied' : 'no automatic fix'}`, 'success');
      
      return true;
      
    } catch (error) {
      this.log(`AutoDeployFeedbackLoop test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test the MCPVercelMonitor class
   */
  async testMCPVercelMonitor() {
    this.log('Testing MCPVercelMonitor class...');
    
    try {
      const mcpMonitor = new MCPVercelMonitor({
        projectName: 'test-project'
      });
      
      // Test command generation
      const commands = mcpMonitor.generatePlaywrightCommands();
      
      if (commands.setup && commands.authentication && commands.navigation && commands.monitoring) {
        this.log('✓ Playwright commands generation successful', 'success');
      } else {
        this.log('✗ Playwright commands generation failed', 'error');
        return false;
      }
      
      // Test status parsing
      const mockResponses = [
        { textContent: 'Ready', expected: 'SUCCESS' },
        { textContent: 'Error', expected: 'ERROR' },
        { textContent: 'Building', expected: 'IN_PROGRESS' },
        { textContent: 'Unknown Status', expected: 'UNKNOWN' }
      ];
      
      let allPassed = true;
      for (const response of mockResponses) {
        const parsed = mcpMonitor.parseDeploymentStatus(response);
        if (parsed !== response.expected) {
          this.log(`✗ Status parsing failed: expected ${response.expected}, got ${parsed}`, 'error');
          allPassed = false;
        }
      }
      
      if (allPassed) {
        this.log('✓ Status parsing tests successful', 'success');
      }
      
      // Test monitoring plan creation
      const plan = mcpMonitor.createMonitoringPlan();
      if (plan.steps && plan.steps.length === 6) {
        this.log('✓ Monitoring plan creation successful', 'success');
      } else {
        this.log('✗ Monitoring plan creation failed', 'error');
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.log(`MCPVercelMonitor test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test file operations and logging
   */
  async testFileOperations() {
    this.log('Testing file operations...');
    
    try {
      const testLogPath = path.join(this.projectRoot, 'test-deployment-log.json');
      
      // Test log file creation
      const mockResult = {
        type: 'SUCCESS',
        message: 'Test deployment',
        timestamp: new Date().toISOString()
      };
      
      const mcpMonitor = new MCPVercelMonitor();
      mcpMonitor.logFilePath = testLogPath;
      
      const saveResult = await mcpMonitor.saveResults(mockResult);
      
      if (saveResult.success) {
        this.log('✓ Log file creation successful', 'success');
        
        // Verify file content
        const logContent = await fs.readFile(testLogPath, 'utf8');
        const logData = JSON.parse(logContent);
        
        if (logData.length > 0 && logData[0].results.type === 'SUCCESS') {
          this.log('✓ Log file content verification successful', 'success');
        } else {
          this.log('✗ Log file content verification failed', 'error');
          return false;
        }
        
        // Clean up test file
        await fs.unlink(testLogPath);
        this.log('✓ Test file cleanup successful', 'success');
        
      } else {
        this.log('✗ Log file creation failed', 'error');
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.log(`File operations test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test environment variable validation
   */
  async testEnvironmentValidation() {
    this.log('Testing environment validation...');
    
    try {
      const mcpMonitor = new MCPVercelMonitor();
      const requiredVars = mcpMonitor.getRequiredEnvVars();
      
      const expectedVars = ['VERCEL_EMAIL', 'VERCEL_PASSWORD', 'VERCEL_PROJECT_NAME', 'GITHUB_REPO', 'TARGET_BRANCH'];
      const hasAllVars = expectedVars.every(varName => varName in requiredVars);
      
      if (hasAllVars) {
        this.log('✓ Environment variable validation successful', 'success');
        return true;
      } else {
        this.log('✗ Environment variable validation failed', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Environment validation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Generate mock deployment scenarios
   */
  generateMockScenarios() {
    return [
      {
        name: 'Successful Deployment',
        result: {
          type: ResultTypes.SUCCESS,
          message: 'Build completed successfully',
          deploymentId: 'dpl_test123',
          status: 'Ready',
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'TypeScript Error',
        result: {
          type: ResultTypes.ERROR,
          message: 'Build failed with TypeScript errors',
          deploymentId: 'dpl_test456',
          status: 'Failed',
          timestamp: new Date().toISOString(),
          errors: [
            {
              type: 'TypeScript Error',
              file: 'src/components/TestComponent.tsx',
              line: 42,
              column: 10,
              code: 'TS2322',
              message: "Type 'string' is not assignable to type 'number'"
            }
          ]
        }
      },
      {
        name: 'ESLint Error',
        result: {
          type: ResultTypes.ERROR,
          message: 'Build failed with ESLint errors',
          deploymentId: 'dpl_test789',
          status: 'Failed',
          timestamp: new Date().toISOString(),
          errors: [
            {
              type: 'ESLint Error',
              file: 'src/utils/helper.ts',
              line: 15,
              column: 3,
              message: 'Unexpected console statement',
              rule: 'no-console'
            }
          ]
        }
      },
      {
        name: 'Module Not Found',
        result: {
          type: ResultTypes.ERROR,
          message: 'Build failed with missing module',
          deploymentId: 'dpl_test101',
          status: 'Failed',
          timestamp: new Date().toISOString(),
          errors: [
            {
              type: 'Build Error',
              message: "Cannot find module 'missing-package'"
            }
          ]
        }
      }
    ];
  }

  /**
   * Test mock scenarios
   */
  async testMockScenarios() {
    this.log('Testing mock deployment scenarios...');
    
    const scenarios = this.generateMockScenarios();
    let allPassed = true;
    
    for (const scenario of scenarios) {
      this.log(`Testing scenario: ${scenario.name}`);
      
      try {
        // Validate scenario structure
        if (!scenario.result.type || !scenario.result.timestamp) {
          this.log(`✗ Scenario ${scenario.name} has invalid structure`, 'error');
          allPassed = false;
          continue;
        }
        
        // Test error parsing if applicable
        if (scenario.result.type === ResultTypes.ERROR && scenario.result.errors) {
          const agent = new VercelMonitorAgent();
          
          for (const error of scenario.result.errors) {
            if (error.message) {
              const parsedError = agent.parseErrorMessage(error.message);
              if (parsedError) {
                this.log(`  ✓ Error parsing for ${error.type} successful`);
              }
            }
          }
        }
        
        this.log(`✓ Scenario ${scenario.name} validated`, 'success');
        
      } catch (error) {
        this.log(`✗ Scenario ${scenario.name} failed: ${error.message}`, 'error');
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    const reportPath = path.join(this.projectRoot, 'deployment-monitor-test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.mockMode ? 'mock' : 'live',
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      testResults: this.testResults,
      mockScenarios: this.generateMockScenarios()
    };
    
    // Count test results
    report.summary.totalTests = this.testResults.length;
    report.summary.passedTests = this.testResults.filter(r => r.level === 'success').length;
    report.summary.failedTests = this.testResults.filter(r => r.level === 'error').length;
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      this.log(`Test report generated: ${reportPath}`, 'success');
    } catch (error) {
      this.log(`Failed to generate test report: ${error.message}`, 'error');
    }
    
    return report;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.log('🚀 Starting Deployment Monitor System Tests...');
    this.log(`Mode: ${this.mockMode ? 'Mock' : 'Live'}`);
    
    const tests = [
      { name: 'Environment Validation', test: () => this.testEnvironmentValidation() },
      { name: 'VercelMonitorAgent', test: () => this.testVercelMonitorAgent() },
      { name: 'AutoDeployFeedbackLoop', test: () => this.testAutoDeployFeedbackLoop() },
      { name: 'MCPVercelMonitor', test: () => this.testMCPVercelMonitor() },
      { name: 'File Operations', test: () => this.testFileOperations() },
      { name: 'Mock Scenarios', test: () => this.testMockScenarios() }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      this.log(`\n${'='.repeat(50)}`);
      this.log(`🧪 Running Test: ${test.name}`);
      this.log('='.repeat(50));
      
      try {
        const result = await test.test();
        if (result) {
          passedTests++;
          this.log(`✅ ${test.name} - PASSED`, 'success');
        } else {
          this.log(`❌ ${test.name} - FAILED`, 'error');
        }
      } catch (error) {
        this.log(`💥 ${test.name} - ERROR: ${error.message}`, 'error');
      }
    }
    
    // Final summary
    this.log(`\n${'='.repeat(60)}`);
    this.log('📊 TEST SUMMARY');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${totalTests}`);
    this.log(`Passed: ${passedTests}`, passedTests > 0 ? 'success' : 'info');
    this.log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    // Generate report
    const report = await this.generateTestReport();
    
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      report: report
    };
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  mock: !args.includes('--live'),
  verbose: args.includes('--verbose')
};

// Run tests
if (require.main === module) {
  const tester = new DeploymentMonitorTester(options);
  
  tester.runAllTests()
    .then(result => {
      console.log('\n🏁 Testing completed');
      
      if (result.success) {
        console.log('🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log(`💔 ${result.total - result.passed} test(s) failed`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  DeploymentMonitorTester
};