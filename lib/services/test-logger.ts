// Structured Test Validation Logging Service
// Provides centralized logging for test validation and progress tracking

import { createClient } from '@/lib/supabase/server'

export type TestLogLevel = 
  | 'TEST_START'      // Starting a test
  | 'TEST_PASS'       // Test passed
  | 'TEST_FAIL'       // Test failed
  | 'TEST_SKIP'       // Test skipped
  | 'API_CALL'        // API endpoint called
  | 'API_SUCCESS'     // API call succeeded
  | 'API_ERROR'       // API call failed
  | 'DB_OPERATION'    // Database operation
  | 'PDF_GENERATION'  // PDF generation event
  | 'WEBHOOK_EVENT'   // WhatsApp webhook event
  | 'SECURITY_CHECK'  // Security/auth validation
  | 'INFO'            // General information
  | 'DEBUG'           // Debug information

export interface TestLogEntry {
  level: TestLogLevel
  category: string        // 'quote-system', 'whatsapp', 'security', etc.
  test_name: string       // Specific test being performed
  message: string         // Human-readable description
  data?: any             // Additional context data
  duration_ms?: number    // How long the operation took
  stack_trace?: string    // Error stack trace if applicable
  session_id?: string     // Group related tests
  timestamp: Date
}

export interface TestValidationItem {
  id: string
  category: string
  test_name: string
  description: string
  required: boolean
  depends_on?: string[]   // Other tests that must pass first
  auto_detectable: boolean // Can be detected automatically
  test_function?: string   // Function to run for validation
  expected_result?: any    // What we expect to see
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  last_run?: Date
  last_result?: any
}

class TestLogger {
  private static instance: TestLogger
  private logs: TestLogEntry[] = []
  private validationItems: Map<string, TestValidationItem> = new Map()
  private currentSession: string = `session_${Date.now()}`

  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger()
    }
    return TestLogger.instance
  }

  // Start a new test session
  startSession(sessionName?: string): string {
    this.currentSession = sessionName || `session_${Date.now()}`
    this.log('TEST_START', 'session', 'test_session', `Starting test session: ${this.currentSession}`)
    return this.currentSession
  }

  // Main logging function
  async log(
    level: TestLogLevel,
    category: string,
    test_name: string,
    message: string,
    data?: any,
    duration_ms?: number
  ): Promise<void> {
    const entry: TestLogEntry = {
      level,
      category,
      test_name,
      message,
      data,
      duration_ms,
      session_id: this.currentSession,
      timestamp: new Date()
    }

    // Add to in-memory logs
    this.logs.push(entry)

    // Console output with color coding
    const colorCode = this.getColorCode(level)
    const timestamp = entry.timestamp.toISOString().substring(11, 23) // HH:mm:ss.sss
    const durationStr = duration_ms ? ` (${duration_ms}ms)` : ''
    
    console.log(`${colorCode}[${timestamp}] ${level} ${category}/${test_name}: ${message}${durationStr}\x1b[0m`)
    
    if (data) {
      console.log(`  Data:`, data)
    }

    // Store in database (async, non-blocking)
    this.persistLog(entry).catch(err => {
      console.error('Failed to persist test log:', err)
    })

    // Check if this completes a validation item
    this.checkValidationCompletion(category, test_name, level, data)
  }

  // Convenience methods for different log levels
  async testStart(category: string, test_name: string, description: string, data?: any): Promise<void> {
    await this.log('TEST_START', category, test_name, description, data)
  }

  async testPass(category: string, test_name: string, message: string, data?: any, duration_ms?: number): Promise<void> {
    await this.log('TEST_PASS', category, test_name, message, data, duration_ms)
  }

  async testFail(category: string, test_name: string, error: string, data?: any, duration_ms?: number): Promise<void> {
    const entry = { error, data }
    if (data instanceof Error) {
      entry.data = { message: data.message, stack: data.stack }
    }
    await this.log('TEST_FAIL', category, test_name, error, entry, duration_ms)
  }

  async apiCall(endpoint: string, method: string, data?: any): Promise<void> {
    await this.log('API_CALL', 'api', endpoint, `${method} ${endpoint}`, data)
  }

  async apiSuccess(endpoint: string, method: string, response: any, duration_ms?: number): Promise<void> {
    await this.log('API_SUCCESS', 'api', endpoint, `${method} ${endpoint} succeeded`, { status: response.status }, duration_ms)
  }

  async apiError(endpoint: string, method: string, error: any, duration_ms?: number): Promise<void> {
    await this.log('API_ERROR', 'api', endpoint, `${method} ${endpoint} failed`, error, duration_ms)
  }

  async dbOperation(operation: string, table: string, result: any, duration_ms?: number): Promise<void> {
    await this.log('DB_OPERATION', 'database', operation, `${operation} on ${table}`, result, duration_ms)
  }

  async pdfGeneration(status: 'start' | 'success' | 'error', details: any, duration_ms?: number): Promise<void> {
    const level = status === 'error' ? 'TEST_FAIL' : status === 'success' ? 'TEST_PASS' : 'TEST_START'
    await this.log(level, 'pdf', 'generation', `PDF generation ${status}`, details, duration_ms)
  }

  async webhookEvent(event_type: string, data: any): Promise<void> {
    await this.log('WEBHOOK_EVENT', 'whatsapp', event_type, `WhatsApp webhook: ${event_type}`, data)
  }

  async securityCheck(check_type: string, result: 'pass' | 'fail', details?: any): Promise<void> {
    const level = result === 'pass' ? 'TEST_PASS' : 'TEST_FAIL'
    await this.log(level, 'security', check_type, `Security check: ${check_type} ${result}`, details)
  }

  // Register validation items that can be automatically checked
  registerValidationItem(item: Omit<TestValidationItem, 'status' | 'last_run' | 'last_result'>): void {
    const validationItem: TestValidationItem = {
      ...item,
      status: 'pending'
    }
    this.validationItems.set(item.id, validationItem)
  }

  // Get current validation status
  getValidationStatus(): TestValidationItem[] {
    return Array.from(this.validationItems.values())
  }

  // Get logs for current session
  getSessionLogs(): TestLogEntry[] {
    return this.logs.filter(log => log.session_id === this.currentSession)
  }

  // Get test summary
  getTestSummary(): {
    total: number
    passed: number
    failed: number
    pending: number
    running: number
  } {
    const items = Array.from(this.validationItems.values())
    return {
      total: items.length,
      passed: items.filter(i => i.status === 'passed').length,
      failed: items.filter(i => i.status === 'failed').length,
      pending: items.filter(i => i.status === 'pending').length,
      running: items.filter(i => i.status === 'running').length
    }
  }

  // Private helper methods
  private getColorCode(level: TestLogLevel): string {
    const colors = {
      'TEST_PASS': '\x1b[32m',      // Green
      'TEST_FAIL': '\x1b[31m',      // Red
      'TEST_START': '\x1b[34m',     // Blue
      'TEST_SKIP': '\x1b[33m',      // Yellow
      'API_SUCCESS': '\x1b[32m',    // Green
      'API_ERROR': '\x1b[31m',      // Red
      'API_CALL': '\x1b[36m',       // Cyan
      'DB_OPERATION': '\x1b[35m',   // Magenta
      'PDF_GENERATION': '\x1b[33m', // Yellow
      'WEBHOOK_EVENT': '\x1b[36m',  // Cyan
      'SECURITY_CHECK': '\x1b[35m', // Magenta
      'INFO': '\x1b[37m',           // White
      'DEBUG': '\x1b[90m'           // Gray
    }
    return colors[level] || '\x1b[37m'
  }

  private async persistLog(entry: TestLogEntry): Promise<void> {
    try {
      const supabase = createClient()
      
      // Store in test_logs table (will be created in schema)
      await supabase.from('test_logs').insert({
        session_id: entry.session_id,
        level: entry.level,
        category: entry.category,
        test_name: entry.test_name,
        message: entry.message,
        data: entry.data,
        duration_ms: entry.duration_ms,
        stack_trace: entry.stack_trace,
        created_at: entry.timestamp.toISOString()
      })
    } catch (error) {
      // Don't throw - logging should never break the app
      console.error('Failed to persist test log:', error)
    }
  }

  private checkValidationCompletion(
    category: string,
    test_name: string,
    level: TestLogLevel,
    data: any
  ): void {
    // Find validation items that match this log entry
    const matchingItems = Array.from(this.validationItems.values()).filter(
      item => item.category === category && item.test_name === test_name
    )

    matchingItems.forEach(item => {
      if (level === 'TEST_PASS' || level === 'API_SUCCESS') {
        item.status = 'passed'
        item.last_run = new Date()
        item.last_result = data
      } else if (level === 'TEST_FAIL' || level === 'API_ERROR') {
        item.status = 'failed'
        item.last_run = new Date()
        item.last_result = data
      } else if (level === 'TEST_START' || level === 'API_CALL') {
        item.status = 'running'
      }
    })
  }
}

// Export singleton instance
export const testLogger = TestLogger.getInstance()

// Initialize core validation items
export function initializeValidationItems(): void {
  const coreValidations: Omit<TestValidationItem, 'status' | 'last_run' | 'last_result'>[] = [
    {
      id: 'database_connection',
      category: 'database',
      test_name: 'connection',
      description: 'Database connection and basic queries work',
      required: true,
      auto_detectable: true
    },
    {
      id: 'quote_generation',
      category: 'quote-system',
      test_name: 'generation',
      description: 'Quote can be generated from API call',
      required: true,
      auto_detectable: true,
      depends_on: ['database_connection']
    },
    {
      id: 'pdf_generation',
      category: 'pdf',
      test_name: 'generation',
      description: 'PDF quote can be generated and stored',
      required: true,
      auto_detectable: true,
      depends_on: ['quote_generation']
    },
    {
      id: 'voice_edit_processing',
      category: 'quote-system',
      test_name: 'edit',
      description: 'Voice edit commands can be processed',
      required: true,
      auto_detectable: true,
      depends_on: ['quote_generation']
    },
    {
      id: 'whatsapp_webhook',
      category: 'whatsapp',
      test_name: 'webhook',
      description: 'WhatsApp webhook receives and processes messages',
      required: true,
      auto_detectable: true
    },
    {
      id: 'api_key_security',
      category: 'security',
      test_name: 'api_keys',
      description: 'API keys are retrieved securely from Supabase Vault',
      required: true,
      auto_detectable: true
    },
    {
      id: 'contractor_signup',
      category: 'auth',
      test_name: 'contractor_signup',
      description: 'Contractor can sign up and create account',
      required: true,
      auto_detectable: false
    },
    {
      id: 'complete_quote_flow',
      category: 'integration',
      test_name: 'end_to_end',
      description: 'Complete flow: consultation → quote → edit → send',
      required: true,
      auto_detectable: false,
      depends_on: ['quote_generation', 'voice_edit_processing', 'pdf_generation']
    }
  ]

  coreValidations.forEach(item => {
    testLogger.registerValidationItem(item)
  })
}

// Helper function to time operations
export async function timeOperation<T>(
  operation: () => Promise<T>,
  category: string,
  test_name: string,
  description: string
): Promise<T> {
  const start = Date.now()
  await testLogger.testStart(category, test_name, description)
  
  try {
    const result = await operation()
    const duration = Date.now() - start
    await testLogger.testPass(category, test_name, `${description} completed`, result, duration)
    return result
  } catch (error) {
    const duration = Date.now() - start
    await testLogger.testFail(category, test_name, `${description} failed: ${error}`, error, duration)
    throw error
  }
}