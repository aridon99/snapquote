# Vercel Deployment Monitor Subagent System

## Overview

This specialized subagent system provides **automated Vercel deployment monitoring** for the renovation-advisor project with seamless integration into Claude Code's MCP Playwright tools. It creates an automated feedback loop that monitors deployments, extracts error details, and enables rapid fix-push-monitor cycles.

## 🎯 Key Features

- **Automated Deployment Monitoring**: Wait for builds to complete and get structured results
- **Intelligent Error Extraction**: Extract specific error messages, file locations, and line numbers
- **MCP Playwright Integration**: Optimized for Claude Code's Playwright MCP tools
- **Automated Fix Application**: Apply common fixes for TypeScript, ESLint, and build errors
- **Complete Feedback Loop**: Fix → Push → Monitor → Fix cycle automation
- **Structured Result Types**: Return SUCCESS or ERROR with actionable data

## 🏗️ System Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Claude Code       │    │  MCP Playwright      │    │   Vercel Dashboard  │
│   Subagent Call     │◄──►│  Browser Automation  │◄──►│   Deployment Info   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                                                        │
           ▼                                                        ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Auto Feedback     │    │  Error Extraction    │    │   Structured        │
│   Loop              │◄──►│  & Fix Application   │◄──►│   Results           │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Git Push          │
│   Commit Changes    │
└─────────────────────┘
```

## 📁 System Components

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|--------|
| `vercel-monitor-subagent.js` | Main monitoring agent with Playwright | Direct deployment monitoring |
| `mcp-vercel-monitor.js` | MCP-compatible command generator | Claude Code integration |
| `auto-deploy-feedback-loop.js` | Complete automation loop | Automated fix-deploy cycles |
| `test-deployment-monitor.js` | Comprehensive testing suite | System validation |

### Supporting Files

| File | Purpose |
|------|---------|
| `vercel-monitor-plan.json` | MCP monitoring plan structure |
| `VERCEL_MONITOR_GUIDE.md` | Integration guide for Claude Code |
| `deployment-monitor-test-report.json` | Latest test results |

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Required environment variables
export VERCEL_EMAIL="your-vercel-email@example.com"
export VERCEL_PASSWORD="your-vercel-password"
export VERCEL_PROJECT_NAME="renovation-advisor"
export GITHUB_REPO="aridon99/snapquote"
export TARGET_BRANCH="master"
```

### 2. Install Dependencies

```bash
# Install Playwright (if not already installed)
npm install playwright
npx playwright install chromium
```

### 3. Run System Tests

```bash
# Run comprehensive tests
npm run deploy:test

# Run with live Vercel credentials (optional)
npm run deploy:test-live
```

### 4. Basic Usage Examples

```bash
# Direct monitoring (one-time check)
npm run deploy:monitor

# Generate MCP command plan
npm run deploy:mcp

# Run automated feedback loop
npm run deploy:feedback
```

## 🔧 Integration with Claude Code

### Method 1: Direct Subagent Call

```javascript
const { VercelMonitorAgent, ResultTypes } = require('./scripts/vercel-monitor-subagent');

async function monitorDeployment() {
  const agent = new VercelMonitorAgent();
  const result = await agent.monitorDeployment();
  
  if (result.type === ResultTypes.SUCCESS) {
    console.log('✅ Deployment successful!');
  } else if (result.type === ResultTypes.ERROR) {
    console.log('❌ Deployment failed:', result.errors);
  }
  
  return result;
}
```

### Method 2: MCP Playwright Commands

```javascript
const { MCPVercelMonitor } = require('./scripts/mcp-vercel-monitor');

const monitor = new MCPVercelMonitor();
const commands = monitor.generatePlaywrightCommands();

// Use commands with Claude Code's MCP Playwright tools
```

### Method 3: Automated Feedback Loop

```javascript
const { AutoDeployFeedbackLoop } = require('./scripts/auto-deploy-feedback-loop');

const feedbackLoop = new AutoDeployFeedbackLoop({
  maxAttempts: 5,
  projectRoot: process.cwd()
});

const result = await feedbackLoop.run();
```

## 📊 Result Types & Structures

### Success Result
```json
{
  "type": "SUCCESS",
  "message": "Build completed successfully",
  "deploymentId": "dpl_abc123",
  "status": "Ready",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Result
```json
{
  "type": "ERROR",
  "message": "Build failed with specific error details",
  "deploymentId": "dpl_def456",
  "status": "Failed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "errors": [
    {
      "type": "TypeScript Error",
      "file": "src/components/Button.tsx",
      "line": 42,
      "column": 10,
      "code": "TS2322",
      "message": "Type 'string' is not assignable to type 'number'"
    }
  ],
  "buildOutput": "Last 1000 chars of build logs..."
}
```

### Timeout Result
```json
{
  "type": "TIMEOUT",
  "message": "Deployment monitoring timeout after 300 seconds",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Authentication Error
```json
{
  "type": "AUTH_ERROR",
  "message": "Authentication failed: Invalid credentials",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🤖 Automated Fix Application

The system can automatically apply fixes for common deployment errors:

### TypeScript Errors
- **TS2322**: Type assertion fixes (`as any`)
- **TS2339**: Optional chaining (`?.`)
- **TS7006**: Type annotations (`: any`)

### ESLint Errors
- Automatic `eslint --fix` application
- Rule-specific fixes

### Module Not Found Errors
- Automatic `npm install` for missing packages
- `@types/*` package installation for TypeScript

### Build Errors
- Memory limit increases
- Configuration adjustments

## 📋 Monitoring Workflow

### Standard Monitoring Flow
```
1. Initialize Browser → 2. Authenticate → 3. Navigate to Project
       ↓                      ↓                    ↓
4. Get Latest Deployment → 5. Monitor Status → 6. Extract Results
       ↓                      ↓                    ↓
7. Parse Errors → 8. Structure Response → 9. Return Results
```

### Automated Feedback Loop
```
1. Check for Changes → 2. Commit & Push → 3. Wait for Deployment
       ↓                     ↓                   ↓
4. Monitor Status → 5. Process Results → 6. Apply Fixes (if needed)
       ↓                     ↓                   ↓
7. Repeat (if fixes) → 8. Max Attempts → 9. Final Result
```

## 🧪 Testing & Validation

### Test Coverage
- ✅ Environment validation
- ✅ Agent initialization
- ✅ Error parsing accuracy
- ✅ Fix application logic
- ✅ File operations
- ✅ Mock scenario validation
- ✅ MCP command generation
- ✅ Status parsing

### Mock Test Scenarios
1. **Successful Deployment**: Validates success path
2. **TypeScript Error**: Tests error extraction and parsing
3. **ESLint Error**: Tests linting error handling
4. **Module Not Found**: Tests dependency resolution

### Running Tests
```bash
# Mock tests (safe, no actual API calls)
npm run deploy:test

# Live tests (requires Vercel credentials)
npm run deploy:test-live

# Verbose output
node scripts/test-deployment-monitor.js --mock --verbose
```

## 🔒 Security & Best Practices

### Environment Variables
- Store credentials in `.env` file (not committed)
- Use environment-specific configurations
- Validate required variables before execution

### Authentication
- Secure credential handling
- Browser session management
- Automatic cleanup of browser resources

### Error Handling
- Graceful degradation on failures
- Detailed error logging
- Timeout protection

## 📈 Performance Optimization

### Browser Optimization
- Headless mode for speed
- Resource blocking (images, fonts)
- Optimized viewport settings
- Connection reuse

### Monitoring Efficiency
- Adaptive polling intervals
- Status change detection
- Early completion detection
- Resource cleanup

### Memory Management
- Browser process cleanup
- Log file rotation
- Result caching

## 🔄 Integration Examples

### Basic Claude Code Integration
```markdown
1. Make code changes
2. Call: `const result = await monitorAgent.monitorDeployment()`
3. Check: `result.type === 'SUCCESS'`
4. If error: Use `result.errors` for targeted fixes
5. Repeat until success
```

### Automated CI/CD Integration
```bash
#!/bin/bash
# post-push-hook.sh
git push origin master
node scripts/vercel-monitor-subagent.js
if [ $? -eq 0 ]; then
  echo "✅ Deployment successful"
else
  echo "❌ Deployment failed - check logs"
fi
```

### Custom Webhook Integration
```javascript
// webhook-handler.js
app.post('/deployment-webhook', async (req, res) => {
  const { deploymentId, status } = req.body;
  
  if (status === 'BUILDING') {
    const agent = new VercelMonitorAgent();
    const result = await agent.monitorDeployment();
    
    // Process result and take action
    await processDeploymentResult(result);
  }
  
  res.status(200).json({ received: true });
});
```

## 📚 API Reference

### VercelMonitorAgent Class

#### Constructor Options
```javascript
{
  projectName: 'string',      // Vercel project name
  githubRepo: 'string',       // GitHub repository
  targetBranch: 'string',     // Git branch to monitor
  maxWaitTime: 'number',      // Max monitoring time (ms)
  pollInterval: 'number'      // Polling interval (ms)
}
```

#### Main Methods
- `monitorDeployment()` → Promise\<Result\>
- `init()` → Promise\<void\>
- `cleanup()` → Promise\<void\>
- `parseErrorMessage(text)` → ParsedError

### AutoDeployFeedbackLoop Class

#### Constructor Options
```javascript
{
  maxAttempts: 'number',      // Maximum fix attempts
  projectRoot: 'string',      // Project directory path
  monitorAgent: 'Agent'       // VercelMonitorAgent instance
}
```

#### Main Methods
- `run()` → Promise\<Result\>
- `applyFixes(errors)` → Promise\<FixResult\>
- `generateFix(error)` → Promise\<Fix\>

### MCPVercelMonitor Class

#### Main Methods
- `generatePlaywrightCommands()` → Commands
- `createMonitoringPlan()` → Plan
- `parseDeploymentStatus(response)` → Status

## 🐛 Troubleshooting

### Common Issues

**Authentication Failures**
```bash
# Check credentials
echo $VERCEL_EMAIL
echo $VERCEL_PASSWORD

# Test login manually
node -e "console.log(process.env.VERCEL_EMAIL ? 'Email set' : 'Email missing')"
```

**Browser Launch Failures**
```bash
# Install/update Playwright
npx playwright install chromium

# Check system dependencies
npx playwright install-deps
```

**Project Not Found**
```bash
# Verify project URL patterns
# Try: https://vercel.com/aridon99/renovation-advisor
# Try: https://vercel.com/renovation-advisor
# Try: https://vercel.com/dashboard/renovation-advisor
```

**Timeout Issues**
```javascript
// Increase timeout for slow builds
const agent = new VercelMonitorAgent({
  maxWaitTime: 600000  // 10 minutes
});
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* node scripts/vercel-monitor-subagent.js

# Save debug output
node scripts/vercel-monitor-subagent.js > debug.log 2>&1
```

## 📞 Support & Maintenance

### Log Files
- `deployment-monitor-log.json` - Monitoring history
- `auto-deploy-log.json` - Feedback loop sessions
- `mcp-deployment-log.json` - MCP command logs

### Health Checks
```bash
# Test system health
npm run deploy:test

# Verify environment
node -e "const {MCPVercelMonitor} = require('./scripts/mcp-vercel-monitor'); console.log(new MCPVercelMonitor().getRequiredEnvVars());"
```

### Updates & Maintenance
- Update Playwright regularly: `npx playwright install`
- Monitor Vercel API changes
- Update selectors if UI changes
- Review error parsing patterns

## 🎉 Success Stories

This subagent system enables:

1. **Rapid Development Cycles**: Fix → Push → Monitor in seconds
2. **Automated Error Resolution**: Common issues fixed automatically
3. **Detailed Error Reporting**: Precise file and line locations
4. **Integration with Claude Code**: Seamless MCP Playwright usage
5. **Comprehensive Monitoring**: Complete deployment lifecycle tracking

The system transforms manual deployment monitoring into an automated, intelligent process that accelerates development and reduces debugging time.

---

**Created**: 2025-08-29  
**Version**: 1.0.0  
**Compatibility**: Node.js 16+, Playwright 1.54+  
**Project**: renovation-advisor (aridon99/snapquote)