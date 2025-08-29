/**
 * Test script to verify Vercel monitoring setup
 * 
 * This script checks that all dependencies and files are in place
 * for the Vercel deployment monitoring system.
 */

const fs = require('fs');
const path = require('path');

class MonitoringSetupTest {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  checkFile(filePath, description) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      this.log(`${description} exists: ${filePath}`);
      return true;
    } else {
      this.errors.push(`Missing file: ${filePath} (${description})`);
      this.log(`Missing file: ${filePath} (${description})`, 'error');
      return false;
    }
  }

  checkEnvironmentVars() {
    const requiredVars = ['VERCEL_EMAIL', 'VERCEL_PASSWORD'];
    const optionalVars = ['VERCEL_PROJECT_NAME'];
    
    this.log('Checking environment variables...');
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.log(`Required env var set: ${varName}`);
      } else {
        this.warnings.push(`Missing required environment variable: ${varName}`);
        this.log(`Missing required environment variable: ${varName}`, 'warning');
      }
    }
    
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        this.log(`Optional env var set: ${varName}`);
      } else {
        this.log(`Optional env var not set: ${varName} (will use default)`);
      }
    }
  }

  checkDependencies() {
    this.log('Checking package.json dependencies...');
    
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for Playwright
      if (packageJson.devDependencies && packageJson.devDependencies.playwright) {
        this.log(`Playwright version: ${packageJson.devDependencies.playwright}`);
      } else {
        this.errors.push('Playwright not found in devDependencies');
        this.log('Playwright not found in devDependencies', 'error');
      }
      
      // Check for monitoring script in npm scripts
      if (packageJson.scripts && packageJson.scripts['vercel:monitor']) {
        this.log('NPM script "vercel:monitor" is configured');
      } else {
        this.warnings.push('NPM script "vercel:monitor" not found');
        this.log('NPM script "vercel:monitor" not found', 'warning');
      }
      
    } catch (error) {
      this.errors.push(`Error reading package.json: ${error.message}`);
      this.log(`Error reading package.json: ${error.message}`, 'error');
    }
  }

  checkPlaywrightBrowsers() {
    this.log('Checking Playwright browser installation...');
    
    // Check if playwright browsers are installed
    const playwrightCache = path.join(require.main.path || __dirname, '..', 'node_modules', '.playwright');
    
    if (fs.existsSync(playwrightCache)) {
      this.log('Playwright cache directory exists');
    } else {
      this.warnings.push('Playwright browsers may not be installed. Run: npx playwright install chromium');
      this.log('Playwright browsers may not be installed. Run: npx playwright install chromium', 'warning');
    }
  }

  checkLogFilePermissions() {
    this.log('Checking log file permissions...');
    
    const logPath = path.join(this.projectRoot, 'vercel-output-monitor.md');
    
    try {
      // Try to read the file
      if (fs.existsSync(logPath)) {
        fs.readFileSync(logPath, 'utf8');
        this.log('Log file is readable');
        
        // Try to write to the file
        const testContent = `<!-- Test write access at ${new Date().toISOString()} -->`;
        fs.appendFileSync(logPath, `\\n${testContent}\\n`);
        this.log('Log file is writable');
        
        // Clean up test content
        const content = fs.readFileSync(logPath, 'utf8');
        const cleanedContent = content.replace(new RegExp(`\\n${testContent}\\n`), '');
        fs.writeFileSync(logPath, cleanedContent);
        
      } else {
        this.warnings.push('Log file does not exist yet (will be created on first run)');
        this.log('Log file does not exist yet (will be created on first run)', 'warning');
      }
    } catch (error) {
      this.errors.push(`Log file permission error: ${error.message}`);
      this.log(`Log file permission error: ${error.message}`, 'error');
    }
  }

  generateReport() {
    this.log('\\n=== Vercel Monitoring Setup Test Report ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ ALL CHECKS PASSED! Monitoring setup is ready.');
    } else {
      if (this.errors.length > 0) {
        this.log(`\\n❌ ${this.errors.length} ERROR(S) FOUND:`);
        this.errors.forEach(error => this.log(`   - ${error}`, 'error'));
      }
      
      if (this.warnings.length > 0) {
        this.log(`\\n⚠️  ${this.warnings.length} WARNING(S):`);
        this.warnings.forEach(warning => this.log(`   - ${warning}`, 'warning'));
      }
    }
    
    this.log('\\n=== Next Steps ===');
    
    if (this.errors.length > 0) {
      this.log('1. Fix all errors listed above');
      this.log('2. Run this test again to verify fixes');
      this.log('3. Then run the monitoring script');
    } else if (this.warnings.length > 0) {
      this.log('1. Review warnings (optional fixes)');
      this.log('2. Set required environment variables');
      this.log('3. Run: npm run vercel:monitor');
    } else {
      this.log('1. Set environment variables:');
      this.log('   export VERCEL_EMAIL="your-email@domain.com"');
      this.log('   export VERCEL_PASSWORD="your-password"');
      this.log('2. Run: npm run vercel:monitor');
    }
    
    return this.errors.length === 0;
  }

  async runAllChecks() {
    this.log('Starting Vercel Monitoring Setup Test...\\n');
    
    // Check required files
    this.checkFile('scripts/monitor-vercel-deployment.js', 'Main monitoring script');
    this.checkFile('vercel-output-monitor.md', 'Monitoring log file');
    this.checkFile('CLAUDE.md', 'Claude documentation');
    this.checkFile('package.json', 'Package configuration');
    
    // Check dependencies and configuration
    this.checkDependencies();
    this.checkPlaywrightBrowsers();
    
    // Check environment
    this.checkEnvironmentVars();
    this.checkLogFilePermissions();
    
    // Generate final report
    return this.generateReport();
  }
}

// Run the test
if (require.main === module) {
  const test = new MonitoringSetupTest();
  test.runAllChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = MonitoringSetupTest;