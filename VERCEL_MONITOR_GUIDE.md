
# Vercel Deployment Monitor Script for Claude Code

## Overview
This script provides automated Vercel deployment monitoring using MCP Playwright tools.

**Project**: renovation-advisor  
**GitHub Repo**: aridon99/snapquote  
**Target Branch**: master  

## Required Environment Variables
```bash
export VERCEL_EMAIL="your-vercel-email@example.com"
export VERCEL_PASSWORD="your-vercel-password"
export VERCEL_PROJECT_NAME="renovation-advisor"
export GITHUB_REPO="aridon99/snapquote"
export TARGET_BRANCH="master"
```

## Monitoring Steps


### Step 1: Environment Check
Verify required environment variables

**Action**: `validate_environment`




### Step 2: Browser Setup
Initialize Playwright browser with optimal settings

**Action**: `setup_browser`



**Commands**:
```javascript
[
  {
    "action": "launch",
    "options": {
      "headless": true,
      "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    }
  },
  {
    "action": "newPage",
    "options": {}
  },
  {
    "action": "setViewportSize",
    "options": {
      "width": 1280,
      "height": 720
    }
  }
]
```


### Step 3: Vercel Authentication
Log into Vercel dashboard

**Action**: `authenticate`
**Expected Result**: Successful navigation to dashboard


**Commands**:
```javascript
[
  {
    "action": "goto",
    "url": "https://vercel.com/login",
    "options": {
      "waitUntil": "networkidle",
      "timeout": 15000
    }
  },
  {
    "action": "fill",
    "selector": "input[name=\"email\"]",
    "value": "${VERCEL_EMAIL}"
  },
  {
    "action": "fill",
    "selector": "input[name=\"password\"]",
    "value": "${VERCEL_PASSWORD}"
  },
  {
    "action": "click",
    "selector": "button[type=\"submit\"]"
  },
  {
    "action": "waitForURL",
    "pattern": "**/dashboard**",
    "options": {
      "timeout": 15000
    }
  }
]
```


### Step 4: Project Navigation
Navigate to renovation-advisor project deployments

**Action**: `navigate_to_project`
**Expected Result**: Deployment list visible


**Commands**:
```javascript
[
  {
    "action": "goto",
    "url": "https://vercel.com/aridon99/renovation-advisor/deployments",
    "options": {
      "waitUntil": "networkidle",
      "timeout": 15000
    }
  },
  {
    "action": "waitForSelector",
    "selector": "[data-testid=\"deployment-list\"], .deployment-list",
    "options": {
      "timeout": 10000
    }
  }
]
```


### Step 5: Status Monitoring
Monitor deployment status until completion

**Action**: `monitor_status`

**Max Wait Time**: 300000ms

**Commands**:
```javascript
[
  {
    "action": "locator",
    "selector": "[data-testid=\"deployment-item\"]",
    "method": "first"
  },
  {
    "action": "getAttribute",
    "selector": "[data-testid=\"deployment-item\"] [data-testid=\"deployment-status\"]",
    "attribute": "textContent"
  }
]
```


### Step 6: Result Processing
Extract and structure deployment results

**Action**: `process_results`





## Expected Return Types

### Success Response
```json
{
  "type": "SUCCESS",
  "message": "Build completed successfully",
  "structure": {
    "deploymentId": "string",
    "status": "string",
    "timestamp": "ISO string"
  }
}
```

### Error Response
```json
{
  "type": "ERROR",
  "message": "Build failed with specific error details",
  "structure": {
    "deploymentId": "string",
    "status": "string",
    "timestamp": "ISO string",
    "errors": [
      {
        "type": "string (TypeScript Error, ESLint Error, etc.)",
        "file": "string (file path)",
        "line": "number (optional)",
        "column": "number (optional)",
        "message": "string (error description)",
        "code": "string (error code, optional)"
      }
    ],
    "buildOutput": "string (last 1000 chars of build output)"
  }
}
```

## Usage with Claude Code

1. Set environment variables
2. Call this monitor after each git push
3. Parse the returned JSON structure
4. Use error details to make targeted fixes
5. Repeat until SUCCESS

## Example Integration

```bash
# After making fixes and pushing to git
git add .
git commit -m "Fix deployment issues"
git push origin master

# Monitor deployment
node scripts/mcp-vercel-monitor.js

# Check result and repeat if needed
```
