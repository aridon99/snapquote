# Architecture Monitoring System

> **Automated Documentation Maintenance** - A background system that automatically keeps architecture documentation up-to-date as you build.

## Overview

The Architecture Monitoring System is an innovative solution that automatically maintains living documentation for the Renovation Advisor Platform. It runs in the background, detects changes in your codebase, and updates documentation files without manual intervention.

## Features

### 🔍 **Automated Detection**
- **API Endpoints**: Automatically detects new/changed routes in `/app/api/`
- **React Components**: Tracks components in `/components/` directory
- **Integrations**: Monitors third-party service usage
- **Database Changes**: Watches schema and migration files
- **Configuration**: Detects environment and config changes

### 📝 **Documentation Maintenance**
- **ARCHITECTURE.md**: Updates system overview and statistics
- **API_ENDPOINTS.md**: Maintains API endpoint documentation
- **COMPONENTS.md**: Tracks React component relationships
- **INTEGRATIONS.md**: Documents third-party service usage

### ⚡ **Background Operation**
- **Non-intrusive**: Runs without interrupting development
- **Real-time**: Detects changes within 30 seconds (configurable)
- **Efficient**: Only scans changed files using timestamps
- **Safe**: Read-only operations with atomic updates

## Quick Start

### 1. Run a Single Scan
```bash
npm run arch:scan
```

This performs a one-time scan of your codebase and updates documentation if changes are detected.

### 2. Start Continuous Monitoring
```bash
npm run arch:monitor
```

This starts the background monitoring service that continuously watches for changes.

### 3. Get Help
```bash
npm run arch:help
```

Shows available commands and options.

## Installation & Setup

The monitoring system is already configured and ready to use. No additional setup required!

### Files Created Automatically:
- `.arch-monitor-config.json` - Configuration settings
- `.arch-monitor-last-scan` - Scan state persistence
- `scripts/architecture-monitor.js` - Main monitoring script

## Configuration

### Default Configuration (`.arch-monitor-config.json`)

```json
{
  "scanIntervalMs": 30000,           // Scan every 30 seconds
  "enableGitIntegration": true,      // Use git for change detection
  "watchDirectories": [              // Directories to monitor
    "app/api",
    "components", 
    "lib",
    "public/content",
    "types",
    "database"
  ],
  "documentationFiles": [            // Files to auto-update
    "ARCHITECTURE.md",
    "docs/API_ENDPOINTS.md",
    "docs/COMPONENTS.md", 
    "docs/INTEGRATIONS.md"
  ],
  "ignorePatterns": [               // Patterns to ignore
    "node_modules",
    ".next",
    ".git"
  ]
}
```

### Customization

You can modify `.arch-monitor-config.json` to:
- Change scan frequency
- Add/remove watched directories
- Configure ignored patterns
- Enable/disable features

## How It Works

### 1. File Scanning
```
Monitor → Scan Directories → Analyze Files → Detect Changes → Update Docs
    ↓           ↓               ↓              ↓              ↓
File Watch   Code Analysis   AST Parsing   Diff Detection  Auto-Update
```

### 2. Change Detection
The system detects:
- **New files**: API routes, components, integrations
- **Modified files**: Content changes, exports, imports
- **Deleted files**: Removed components or endpoints
- **Configuration changes**: Environment variables, dependencies

### 3. Documentation Updates
When changes are detected, the system:
- Updates relevant documentation sections
- Maintains consistent formatting
- Preserves manual content
- Logs all changes for review

## Example Workflow

### Scenario: Adding a New API Endpoint

1. **You create**: `/app/api/contractors/search/route.ts`
2. **Monitor detects**: New API file with export functions
3. **System analyzes**: Finds `GET` and `POST` methods
4. **Documentation updates**: Adds endpoint to `API_ENDPOINTS.md`
5. **Stats updated**: Increments endpoint count in `ARCHITECTURE.md`

### Scenario: Creating a New Component

1. **You create**: `/components/search/ContractorFilter.tsx`
2. **Monitor detects**: New React component file
3. **System analyzes**: Extracts exports, props, dependencies
4. **Documentation updates**: Adds component to `COMPONENTS.md`
5. **Relationships mapped**: Updates component dependency graph

## Advanced Features

### AST-Based Analysis
The system uses Abstract Syntax Tree parsing to:
- Accurately detect React components
- Extract function signatures
- Map import/export relationships
- Identify integration patterns

### Intelligent Updates
- **Preserves manual content**: Only updates auto-generated sections
- **Maintains formatting**: Consistent markdown structure
- **Atomic operations**: Updates are all-or-nothing
- **Change logging**: All modifications are logged

### Performance Optimization
- **Incremental scanning**: Only checks changed files
- **Timestamp comparison**: Efficient change detection
- **Memory efficient**: Minimal resource usage
- **Background processing**: Non-blocking operations

## Monitoring Output

### Scan Results
```bash
🔍 Starting project scan...
📝 Detected 3 changes:
   NEW_FILE: components/search/AdvancedFilter.tsx
   MODIFIED_FILE: app/api/contractors/route.ts
   NEW_FILE: lib/integrations/maps.ts
📝 Updating documentation...
✅ Documentation updated successfully
⏱️  Scan completed in 342ms
```

### Statistics
```bash
📊 Scan Results:
   Files scanned: 127
   API endpoints: 18
   Components: 34
   Integrations: 5
```

## Troubleshooting

### Common Issues

**Issue**: Monitor not detecting changes
**Solution**: Check file permissions and `.arch-monitor-config.json`

**Issue**: Documentation not updating
**Solution**: Verify documentation files exist and are writable

**Issue**: High CPU usage
**Solution**: Increase `scanIntervalMs` in config or reduce watched directories

### Debug Mode
```bash
# Run with verbose output
DEBUG=arch-monitor npm run arch:scan
```

### Reset State
```bash
# Remove scan cache to force full rescan
rm .arch-monitor-last-scan
npm run arch:scan
```

## Integration with Development Workflow

### VS Code Integration
Add to your VS Code tasks:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Architecture Monitor",
      "type": "npm",
      "script": "arch:monitor",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "silent",
        "panel": "dedicated"
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    }
  ]
}
```

### Git Hooks (Optional)
Add to `.git/hooks/post-commit`:
```bash
#!/bin/sh
npm run arch:scan
```

### Docker Integration
```dockerfile
# Add to your Dockerfile
RUN npm run arch:scan
```

## Best Practices

### Development Workflow
1. **Start monitoring**: Run `npm run arch:monitor` at project start
2. **Regular scans**: Run `npm run arch:scan` before commits
3. **Review changes**: Check updated documentation files
4. **Commit updates**: Include doc updates in your commits

### Documentation Maintenance
- **Manual sections**: Add custom content between auto-generated sections
- **Protected content**: Use `<!-- MANUAL SECTION -->` comments to protect manual content
- **Regular reviews**: Periodically review auto-generated content for accuracy

### Performance Tips
- **Selective watching**: Only monitor directories that frequently change
- **Appropriate intervals**: Balance freshness with performance
- **Ignore patterns**: Exclude unnecessary files and directories

## Extending the System

### Adding New File Types
Modify `shouldAnalyzeFile()` and `analyzeFile()` in the monitor script:

```javascript
shouldAnalyzeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.py'].includes(ext)
}
```

### Custom Analysis Rules
Add new analysis patterns in `analyzeFile()`:

```javascript
// Example: Detect GraphQL schemas
if (filePath.includes('schema') && content.includes('type Query')) {
  analysis.graphqlSchemas = this.countGraphQLTypes(content)
}
```

### New Documentation Sections
Create additional update methods:

```javascript
async updateCustomDoc(changes, scanData) {
  // Your custom documentation update logic
}
```

## Future Enhancements

### Planned Features
- **Visual diagrams**: Auto-generated architecture diagrams
- **Dependency graphs**: Interactive component relationships
- **API documentation**: OpenAPI spec generation
- **Git integration**: Automatic commits of doc updates
- **Slack notifications**: Team alerts for significant changes
- **Metrics dashboard**: Architecture health monitoring

### Plugin System
Future support for:
- Custom analyzers
- Third-party integrations
- Custom documentation formats
- External tool integration

## Security Considerations

### File Access
- **Read-only**: Monitor only reads files, never modifies source code
- **Sandboxed**: Limited to project directory
- **Safe parsing**: Error handling prevents crashes

### Data Privacy
- **Local only**: All processing happens locally
- **No network calls**: No data sent to external services
- **Audit trail**: Complete logging of all operations

---

## Support

### Getting Help
- Check the configuration file
- Review log output for errors
- Run `npm run arch:help` for commands
- Examine the monitor script for debugging

### Contributing
The monitoring system is part of the project and can be enhanced:
1. Modify `scripts/architecture-monitor.js`
2. Update configuration options
3. Add new analysis capabilities
4. Improve documentation updates

---

*This monitoring system represents a new paradigm in development tooling - truly automated, living documentation that evolves with your codebase.*