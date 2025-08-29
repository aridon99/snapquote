# Vercel Deployment Monitoring

This directory contains automated monitoring tools for Vercel deployments.

## Files

- `monitor-vercel-deployment.js` - Main monitoring script using Playwright
- `README-monitoring.md` - This documentation file

## Setup Instructions

### 1. Environment Variables

Set these environment variables before running the monitoring script:

```bash
export VERCEL_EMAIL="your-vercel-email@domain.com"
export VERCEL_PASSWORD="your-vercel-password"
export VERCEL_PROJECT_NAME="renovation-advisor"  # Optional, defaults to "renovation-advisor"
```

**Security Note**: Consider using a `.env` file or secure credential storage instead of environment variables in production.

### 2. Dependencies

The monitoring script requires Playwright, which is already installed in this project:

```bash
# Playwright is included in package.json devDependencies
# Install browsers if not already done
npx playwright install chromium
```

### 3. Running the Monitor

Use either of these methods:

```bash
# Method 1: Using npm script (recommended)
npm run vercel:monitor

# Method 2: Direct node execution
node scripts/monitor-vercel-deployment.js
```

## Output

The script generates a log file at the project root: `vercel-output-monitor.md`

This file contains:
- Latest deployment status check
- Historical deployment tracking
- Error messages and build logs
- Status indicators with emojis

## Troubleshooting

### Common Issues

1. **Login Failed**: 
   - Verify VERCEL_EMAIL and VERCEL_PASSWORD are correct
   - Check if 2FA is enabled (may require different authentication approach)

2. **Project Not Found**:
   - Verify VERCEL_PROJECT_NAME matches your Vercel project name
   - Check if you have access permissions to the project

3. **Browser Issues**:
   - Ensure Chromium is installed: `npx playwright install chromium`
   - Check if running in headless mode is supported in your environment

4. **Timeout Errors**:
   - Increase timeout values in the script if Vercel dashboard loads slowly
   - Check internet connection stability

### Debug Mode

To run with visible browser for debugging:

1. Edit `monitor-vercel-deployment.js`
2. Change `headless: true` to `headless: false` in the browser launch options
3. Run the script to see browser actions

## Integration

### Automated Monitoring

Consider setting up automated monitoring using cron jobs or CI/CD pipelines:

```bash
# Example cron job (runs every 15 minutes)
*/15 * * * * cd /path/to/project && npm run vercel:monitor
```

### Alerts

You can extend the script to send alerts (email, Slack, etc.) when deployments fail by modifying the error handling sections.

## Security Considerations

- Store credentials securely
- Use environment variables or secure credential management
- Consider using Vercel API tokens instead of password authentication
- Rotate credentials regularly
- Don't commit credentials to version control