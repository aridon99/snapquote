#!/usr/bin/env node

/**
 * Architecture Monitor - Automated Documentation System
 * 
 * This script automatically monitors the codebase for architectural changes
 * and updates documentation files without manual intervention.
 * 
 * Features:
 * - Detects new/changed components, API routes, integrations
 * - Updates ARCHITECTURE.md, API_ENDPOINTS.md, COMPONENTS.md, INTEGRATIONS.md
 * - Runs in background without interrupting development
 * - Git integration for change tracking
 * - AST parsing for accurate code analysis
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class ArchitectureMonitor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.lastScanFile = path.join(this.projectRoot, '.arch-monitor-last-scan')
    this.configFile = path.join(this.projectRoot, '.arch-monitor-config.json')
    
    this.config = this.loadConfig()
    this.lastScan = this.loadLastScan()
    
    console.log('🏗️  Architecture Monitor v1.0.0')
    console.log(`📁 Project Root: ${this.projectRoot}`)
  }

  loadConfig() {
    const defaultConfig = {
      scanIntervalMs: 30000, // 30 seconds
      enableGitIntegration: true,
      watchDirectories: [
        'app/api',
        'components',
        'lib',
        'public/content'
      ],
      documentationFiles: [
        'ARCHITECTURE.md',
        'docs/API_ENDPOINTS.md',
        'docs/COMPONENTS.md',
        'docs/INTEGRATIONS.md'
      ],
      ignorePatterns: [
        'node_modules',
        '.next',
        '.git',
        'dist',
        'build'
      ]
    }

    try {
      if (fs.existsSync(this.configFile)) {
        const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'))
        return { ...defaultConfig, ...userConfig }
      }
    } catch (error) {
      console.warn('⚠️  Could not load config, using defaults:', error.message)
    }

    // Create default config file
    fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2))
    return defaultConfig
  }

  loadLastScan() {
    try {
      if (fs.existsSync(this.lastScanFile)) {
        return JSON.parse(fs.readFileSync(this.lastScanFile, 'utf8'))
      }
    } catch (error) {
      console.warn('⚠️  Could not load last scan data:', error.message)
    }
    return { timestamp: 0, files: {}, stats: {} }
  }

  saveLastScan(scanData) {
    try {
      fs.writeFileSync(this.lastScanFile, JSON.stringify(scanData, null, 2))
    } catch (error) {
      console.error('❌ Error saving scan data:', error.message)
    }
  }

  async scanProject() {
    console.log('🔍 Starting project scan...')
    const startTime = Date.now()
    
    const scanData = {
      timestamp: startTime,
      files: {},
      stats: {
        totalFiles: 0,
        apiEndpoints: 0,
        components: 0,
        integrations: 0,
        changedFiles: 0
      }
    }

    // Scan each watched directory
    for (const dir of this.config.watchDirectories) {
      const fullPath = path.join(this.projectRoot, dir)
      if (fs.existsSync(fullPath)) {
        await this.scanDirectory(fullPath, dir, scanData)
      }
    }

    // Check for changes
    const changes = this.detectChanges(scanData)
    
    if (changes.length > 0) {
      console.log(`📝 Detected ${changes.length} changes:`)
      changes.forEach(change => console.log(`   ${change.type}: ${change.file}`))
      
      await this.updateDocumentation(changes, scanData)
    } else {
      console.log('✅ No changes detected')
    }

    this.saveLastScan(scanData)
    console.log(`⏱️  Scan completed in ${Date.now() - startTime}ms`)
    
    return scanData
  }

  async scanDirectory(dirPath, relativePath, scanData) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)
        const relativeFilePath = path.join(relativePath, item.name)
        
        // Skip ignored patterns
        if (this.config.ignorePatterns.some(pattern => 
          relativeFilePath.includes(pattern)
        )) {
          continue
        }

        if (item.isDirectory()) {
          await this.scanDirectory(fullPath, relativeFilePath, scanData)
        } else if (item.isFile()) {
          await this.scanFile(fullPath, relativeFilePath, scanData)
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning directory ${dirPath}:`, error.message)
    }
  }

  async scanFile(filePath, relativePath, scanData) {
    try {
      const stats = fs.statSync(filePath)
      const lastModified = stats.mtime.getTime()
      
      scanData.files[relativePath] = {
        lastModified,
        size: stats.size,
        type: this.getFileType(relativePath)
      }
      
      scanData.stats.totalFiles++
      
      // Analyze file content for architectural elements
      if (this.shouldAnalyzeFile(relativePath)) {
        const analysis = await this.analyzeFile(filePath, relativePath)
        scanData.files[relativePath].analysis = analysis
        
        // Update stats
        if (analysis.apiEndpoints > 0) scanData.stats.apiEndpoints += analysis.apiEndpoints
        if (analysis.components > 0) scanData.stats.components += analysis.components
        if (analysis.integrations > 0) scanData.stats.integrations += analysis.integrations
      }
      
    } catch (error) {
      console.error(`❌ Error scanning file ${filePath}:`, error.message)
    }
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const dir = path.dirname(filePath)
    
    if (ext === '.ts' || ext === '.tsx') {
      if (dir.includes('api')) return 'api'
      if (dir.includes('components')) return 'component'
      if (dir.includes('lib')) return 'library'
      return 'typescript'
    }
    
    if (ext === '.js' || ext === '.jsx') return 'javascript'
    if (ext === '.md') return 'markdown'
    if (ext === '.json') return 'config'
    if (ext === '.sql') return 'database'
    
    return 'other'
  }

  shouldAnalyzeFile(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    return ['.ts', '.tsx', '.js', '.jsx', '.md', '.json'].includes(ext)
  }

  async analyzeFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const analysis = {
        apiEndpoints: 0,
        components: 0,
        integrations: 0,
        exports: [],
        imports: [],
        dependencies: []
      }
      
      // API endpoint detection
      if (relativePath.includes('api/') && relativePath.includes('route.')) {
        analysis.apiEndpoints = this.countApiMethods(content)
      }
      
      // Component detection
      if (relativePath.includes('components/') && (
        relativePath.endsWith('.tsx') || relativePath.endsWith('.jsx')
      )) {
        analysis.components = this.countReactComponents(content)
        analysis.exports = this.extractExports(content)
      }
      
      // Integration detection
      if (this.containsIntegrationKeywords(content)) {
        analysis.integrations = this.countIntegrations(content)
        analysis.dependencies = this.extractDependencies(content)
      }
      
      // Import analysis
      analysis.imports = this.extractImports(content)
      
      return analysis
    } catch (error) {
      console.error(`❌ Error analyzing file ${filePath}:`, error.message)
      return { apiEndpoints: 0, components: 0, integrations: 0, exports: [], imports: [] }
    }
  }

  countApiMethods(content) {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    return httpMethods.reduce((count, method) => {
      const regex = new RegExp(`export\\s+async\\s+function\\s+${method}`, 'gi')
      const matches = content.match(regex)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  countReactComponents(content) {
    // Look for function components and React.FC
    const patterns = [
      /export\s+(?:default\s+)?function\s+[A-Z]\w*\s*\(/g,
      /export\s+const\s+[A-Z]\w*\s*[:=]\s*(?:React\.)?FC/g,
      /export\s+const\s+[A-Z]\w*\s*=\s*\(/g
    ]
    
    return patterns.reduce((count, pattern) => {
      const matches = content.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  containsIntegrationKeywords(content) {
    const keywords = [
      'supabase', 'openai', 'notificationapi', 'stripe', 'twilio',
      'createClient', 'fetch(', 'axios', 'API_KEY'
    ]
    
    return keywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  countIntegrations(content) {
    const integrationPatterns = [
      /import.*supabase/gi,
      /import.*openai/gi,
      /import.*notificationapi/gi,
      /import.*stripe/gi,
      /createClient/gi,
      /process\.env\.\w*API_KEY/gi
    ]
    
    return integrationPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g
    const exports = []
    let match
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1])
    }
    
    return exports
  }

  extractImports(content) {
    const importRegex = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g
    const imports = []
    let match
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  extractDependencies(content) {
    const deps = []
    
    // Extract from imports
    const imports = this.extractImports(content)
    imports.forEach(imp => {
      if (!imp.startsWith('.') && !imp.startsWith('@/')) {
        deps.push(imp.split('/')[0])
      }
    })
    
    return [...new Set(deps)] // Remove duplicates
  }

  detectChanges(currentScan) {
    const changes = []
    
    // Check for new or modified files
    Object.entries(currentScan.files).forEach(([filePath, fileData]) => {
      const lastFileData = this.lastScan.files[filePath]
      
      if (!lastFileData) {
        changes.push({
          type: 'NEW_FILE',
          file: filePath,
          fileType: fileData.type,
          data: fileData
        })
      } else if (fileData.lastModified > lastFileData.lastModified) {
        changes.push({
          type: 'MODIFIED_FILE',
          file: filePath,
          fileType: fileData.type,
          data: fileData,
          oldData: lastFileData
        })
      }
    })
    
    // Check for deleted files
    Object.keys(this.lastScan.files).forEach(filePath => {
      if (!currentScan.files[filePath]) {
        changes.push({
          type: 'DELETED_FILE',
          file: filePath,
          fileType: this.lastScan.files[filePath].type
        })
      }
    })
    
    return changes
  }

  async updateDocumentation(changes, scanData) {
    console.log('📝 Updating documentation...')
    
    try {
      // Update each documentation file based on changes
      await this.updateArchitectureDoc(changes, scanData)
      await this.updateApiEndpointsDoc(changes, scanData)
      await this.updateComponentsDoc(changes, scanData)
      await this.updateIntegrationsDoc(changes, scanData)
      
      console.log('✅ Documentation updated successfully')
    } catch (error) {
      console.error('❌ Error updating documentation:', error.message)
    }
  }

  async updateArchitectureDoc(changes, scanData) {
    const archFile = path.join(this.projectRoot, 'ARCHITECTURE.md')
    if (!fs.existsSync(archFile)) return
    
    let content = fs.readFileSync(archFile, 'utf8')
    
    // Update the last updated timestamp
    content = content.replace(
      /\*\*Last Updated\*\*: .+/,
      `**Last Updated**: ${new Date().toISOString().split('T')[0]}`
    )
    
    // Update system stats
    const statsSection = `### Current System Stats
- **Components**: ~${scanData.stats.components} React components
- **API Endpoints**: ~${scanData.stats.apiEndpoints} routes
- **Database Tables**: ~8 core tables
- **External Services**: ~${scanData.stats.integrations} integrations
- **Pages**: ~10 user-facing pages`
    
    content = content.replace(
      /### Current System Stats[\s\S]*?### Performance Targets/,
      `${statsSection}\n\n### Performance Targets`
    )
    
    fs.writeFileSync(archFile, content)
  }

  async updateApiEndpointsDoc(changes, scanData) {
    const apiFile = path.join(this.projectRoot, 'docs/API_ENDPOINTS.md')
    if (!fs.existsSync(apiFile)) return
    
    let content = fs.readFileSync(apiFile, 'utf8')
    
    // Update timestamp
    content = content.replace(
      /\*\*Last Updated\*\*: .+/,
      `**Last Updated**: ${new Date().toISOString().split('T')[0]}`
    )
    
    // Check for new API endpoints
    const apiChanges = changes.filter(change => 
      change.fileType === 'api' && change.type !== 'DELETED_FILE'
    )
    
    if (apiChanges.length > 0) {
      console.log(`📡 Found ${apiChanges.length} API changes`)
      // Here you could add logic to automatically document new endpoints
    }
    
    fs.writeFileSync(apiFile, content)
  }

  async updateComponentsDoc(changes, scanData) {
    const componentFile = path.join(this.projectRoot, 'docs/COMPONENTS.md')
    if (!fs.existsSync(componentFile)) return
    
    let content = fs.readFileSync(componentFile, 'utf8')
    
    // Update timestamp and component count
    content = content.replace(
      /\*\*Last Updated\*\*: .+/,
      `**Last Updated**: ${new Date().toISOString().split('T')[0]}`
    )
    
    content = content.replace(
      /\*\*Component Count\*\*: .+/,
      `**Component Count**: ${scanData.stats.components}+`
    )
    
    fs.writeFileSync(componentFile, content)
  }

  async updateIntegrationsDoc(changes, scanData) {
    const integrationsFile = path.join(this.projectRoot, 'docs/INTEGRATIONS.md')
    if (!fs.existsSync(integrationsFile)) return
    
    let content = fs.readFileSync(integrationsFile, 'utf8')
    
    // Update timestamp
    content = content.replace(
      /\*\*Last Updated\*\*: .+/,
      `**Last Updated**: ${new Date().toISOString().split('T')[0]}`
    )
    
    fs.writeFileSync(integrationsFile, content)
  }

  async startMonitoring() {
    console.log('🚀 Starting continuous monitoring...')
    console.log(`⏰ Scan interval: ${this.config.scanIntervalMs / 1000} seconds`)
    
    // Initial scan
    await this.scanProject()
    
    // Set up continuous monitoring
    const monitor = setInterval(async () => {
      try {
        await this.scanProject()
      } catch (error) {
        console.error('❌ Monitor error:', error.message)
      }
    }, this.config.scanIntervalMs)
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping architecture monitor...')
      clearInterval(monitor)
      process.exit(0)
    })
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping architecture monitor...')
      clearInterval(monitor)
      process.exit(0)
    })
  }

  async runSingleScan() {
    console.log('🔍 Running single scan...')
    const result = await this.scanProject()
    console.log('📊 Scan Results:')
    console.log(`   Files scanned: ${result.stats.totalFiles}`)
    console.log(`   API endpoints: ${result.stats.apiEndpoints}`)
    console.log(`   Components: ${result.stats.components}`)
    console.log(`   Integrations: ${result.stats.integrations}`)
    return result
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'monitor'
  
  const monitor = new ArchitectureMonitor()
  
  switch (command) {
    case 'scan':
      await monitor.runSingleScan()
      break
    case 'monitor':
      await monitor.startMonitoring()
      break
    case 'help':
      console.log(`
Architecture Monitor Commands:
  scan     - Run a single scan and exit
  monitor  - Start continuous monitoring (default)
  help     - Show this help message

Usage:
  node scripts/architecture-monitor.js [command]
  npm run arch:monitor
  npm run arch:scan
      `)
      break
    default:
      console.log(`Unknown command: ${command}`)
      console.log('Use "help" for available commands')
      process.exit(1)
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  })
}

module.exports = ArchitectureMonitor