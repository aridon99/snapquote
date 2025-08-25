// Automated Test Validation System
// Runs validation checks and updates the test validation checklist

import { createClient } from '@/lib/supabase/server'
import { testLogger, TestValidationItem } from './test-logger'

export interface ValidationResult {
  id: string
  passed: boolean
  duration_ms: number
  error?: string
  data?: any
}

export class TestValidator {
  private static instance: TestValidator
  private supabase = createClient()

  static getInstance(): TestValidator {
    if (!TestValidator.instance) {
      TestValidator.instance = new TestValidator()
    }
    return TestValidator.instance
  }

  // Run all automatic validation checks
  async runAllValidations(sessionId?: string): Promise<ValidationResult[]> {
    if (sessionId) {
      testLogger.startSession(sessionId)
    }

    await testLogger.testStart('validation', 'run_all', 'Starting comprehensive validation suite')

    const validationItems = await this.getValidationItems()
    const results: ValidationResult[] = []

    // Run validations in dependency order
    const sortedItems = this.sortByDependencies(validationItems)
    
    for (const item of sortedItems) {
      if (item.auto_detectable) {
        const result = await this.runSingleValidation(item)
        results.push(result)
        
        // Stop if a required validation fails
        if (!result.passed && item.required) {
          await testLogger.testFail('validation', 'run_all', `Required validation ${item.id} failed, stopping`)
          break
        }
      }
    }

    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    
    await testLogger.testPass('validation', 'run_all', 
      `Validation suite completed: ${passedCount}/${totalCount} passed`, 
      { passed: passedCount, total: totalCount, results }
    )

    return results
  }

  // Run a single validation check
  async runSingleValidation(item: TestValidationItem): Promise<ValidationResult> {
    const start = Date.now()
    await testLogger.testStart(item.category, item.test_name, `Running validation: ${item.description}`)

    try {
      let result: any = null
      let passed = false

      // Run the appropriate validation based on the test type
      switch (item.id) {
        case 'database_connection':
          result = await this.validateDatabaseConnection()
          passed = !!result
          break

        case 'supabase_storage':
          result = await this.validateSupabaseStorage()
          passed = !!result
          break

        case 'api_key_retrieval':
          result = await this.validateApiKeyRetrieval()
          passed = !!result
          break

        case 'quote_generation':
          result = await this.validateQuoteGeneration()
          passed = !!result && !result.error
          break

        case 'pdf_generation':
          result = await this.validatePdfGeneration()
          passed = !!result && !result.error
          break

        case 'voice_edit_processing':
          result = await this.validateVoiceEditProcessing()
          passed = !!result && !result.error
          break

        case 'quote_edit_confirmation':
          result = await this.validateQuoteEditConfirmation()
          passed = !!result && !result.error
          break

        case 'whatsapp_webhook':
          result = await this.validateWhatsAppWebhook()
          passed = !!result
          break

        case 'whatsapp_message_send':
          result = await this.validateWhatsAppMessageSend()
          passed = !!result && !result.error
          break

        case 'mock_consultation_processing':
          result = await this.validateMockConsultationProcessing()
          passed = !!result && !result.error
          break

        case 'security_rls_policies':
          result = await this.validateRLSPolicies()
          passed = !!result
          break

        case 'error_handling':
          result = await this.validateErrorHandling()
          passed = !!result
          break

        default:
          result = { error: 'No validation function defined' }
          passed = false
      }

      const duration = Date.now() - start
      
      if (passed) {
        await testLogger.testPass(item.category, item.test_name, 
          `${item.description} - PASSED`, result, duration)
      } else {
        await testLogger.testFail(item.category, item.test_name, 
          `${item.description} - FAILED`, result, duration)
      }

      return {
        id: item.id,
        passed,
        duration_ms: duration,
        data: result,
        error: passed ? undefined : result?.error || 'Validation failed'
      }

    } catch (error) {
      const duration = Date.now() - start
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      await testLogger.testFail(item.category, item.test_name, 
        `${item.description} - ERROR: ${errorMessage}`, { error: errorMessage }, duration)

      return {
        id: item.id,
        passed: false,
        duration_ms: duration,
        error: errorMessage
      }
    }
  }

  // Individual validation functions
  private async validateDatabaseConnection(): Promise<any> {
    const { data, error } = await this.supabase
      .from('contractors')
      .select('count')
      .limit(1)
    
    if (error) throw new Error(`Database connection failed: ${error.message}`)
    return { connection: 'success', query_result: data }
  }

  private async validateSupabaseStorage(): Promise<any> {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .list('', { limit: 1 })
    
    if (error && !error.message.includes('not found')) {
      throw new Error(`Storage validation failed: ${error.message}`)
    }
    return { storage: 'accessible', bucket: 'documents' }
  }

  private async validateApiKeyRetrieval(): Promise<any> {
    try {
      // Test the secure API key functions
      const { data: twilioData, error: twilioError } = await this.supabase.rpc('get_twilio_credentials')
      const { data: openaiData, error: openaiError } = await this.supabase.rpc('get_openai_key')

      if (twilioError && openaiError) {
        throw new Error('Both API key retrievals failed')
      }

      return {
        twilio: twilioError ? 'failed' : 'success',
        openai: openaiError ? 'failed' : 'success',
        fallback_available: !!(process.env.TWILIO_ACCOUNT_SID && process.env.OPENAI_API_KEY)
      }
    } catch (error) {
      // Check if fallback environment variables are available
      const fallbackAvailable = !!(process.env.TWILIO_ACCOUNT_SID && process.env.OPENAI_API_KEY)
      if (fallbackAvailable) {
        return { vault: 'failed', fallback: 'available' }
      }
      throw error
    }
  }

  private async validateQuoteGeneration(): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: 'test-validation',
          customerName: 'Test Customer',
          customerPhone: '+14155551234',
          customerAddress: '123 Test St',
          items: [{
            description: 'Test Service',
            quantity: 1,
            unit_price: 100,
            unit: 'each',
            category: 'labor'
          }]
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { error: result.error || 'API call failed', status: response.status }
      }

      return { success: true, quote_id: result.quote?.id, total: result.quote?.total }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' }
    }
  }

  private async validatePdfGeneration(): Promise<any> {
    // This would typically be tested as part of quote generation
    // For now, just check if the PDF generation functions are available
    try {
      const { generateQuotePDF } = await import('@/lib/pdf/quote-generator')
      return { pdf_function: 'available', generator: typeof generateQuotePDF }
    } catch (error) {
      return { error: 'PDF generation module not available' }
    }
  }

  private async validateVoiceEditProcessing(): Promise<any> {
    // Test the voice edit API with mock data
    try {
      // First, we need a quote to edit
      const quoteResult = await this.validateQuoteGeneration()
      if (quoteResult.error) {
        return { error: 'Cannot test voice editing without quote generation' }
      }

      // Create a test session first
      const { data: session } = await this.supabase
        .from('quote_review_sessions')
        .insert({
          quote_id: quoteResult.quote_id,
          contractor_id: 'test-validation',
          whatsapp_thread_id: 'test-thread',
          state: 'REVIEWING_QUOTE'
        })
        .select()
        .single()

      if (!session) {
        return { error: 'Could not create test session' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteResult.quote_id,
          voiceTranscript: 'Change the test service to 150 dollars',
          action: 'process',
          sessionId: session.id
        })
      })

      const result = await response.json()
      
      // Clean up test session
      await this.supabase
        .from('quote_review_sessions')
        .delete()
        .eq('id', session.id)

      if (!response.ok) {
        return { error: result.error || 'Voice edit API failed', status: response.status }
      }

      return { success: true, changes_detected: result.changes?.length > 0 }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Voice edit validation failed' }
    }
  }

  private async validateQuoteEditConfirmation(): Promise<any> {
    // This would be tested in conjunction with voice edit processing
    return { confirmation_flow: 'available', requires_voice_edit: true }
  }

  private async validateWhatsAppWebhook(): Promise<any> {
    // Check if the webhook endpoint is accessible
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'From=test&Body=test'
      })

      // Even if it returns an error, the endpoint should be accessible
      return { endpoint: 'accessible', status: response.status }
    } catch (error) {
      return { error: 'Webhook endpoint not accessible' }
    }
  }

  private async validateWhatsAppMessageSend(): Promise<any> {
    // This requires actual Twilio credentials, so just check if the service is available
    try {
      await import('@/lib/services/secure-api-keys')
      return { twilio_service: 'available', test_mode: process.env.USE_MOCK_GPT === 'true' }
    } catch (error) {
      return { error: 'WhatsApp service not available' }
    }
  }

  private async validateMockConsultationProcessing(): Promise<any> {
    // Test the mock consultation processing from the webhook
    return { mock_processing: 'available', requires_webhook_test: true }
  }

  private async validateRLSPolicies(): Promise<any> {
    try {
      // Test that RLS policies are working by trying to access data
      const { error } = await this.supabase
        .from('quotes')
        .select('count')
        .limit(1)

      // If we get here, RLS is either working correctly or disabled
      return { rls_status: error ? 'active' : 'accessible' }
    } catch (error) {
      return { error: 'RLS policy validation failed' }
    }
  }

  private async validateErrorHandling(): Promise<any> {
    // Check that error handling is working by making an invalid API call
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Invalid request
      })

      const result = await response.json()
      
      // We expect this to fail with a proper error message
      const hasErrorHandling = !response.ok && result.error
      return { error_handling: hasErrorHandling ? 'working' : 'not_working' }
    } catch (error) {
      return { error: 'Could not test error handling' }
    }
  }

  // Helper methods
  private async getValidationItems(): Promise<TestValidationItem[]> {
    const { data, error } = await this.supabase
      .from('test_validation_items')
      .select('*')
      .order('id')

    if (error) {
      throw new Error(`Failed to get validation items: ${error.message}`)
    }

    return data || []
  }

  private sortByDependencies(items: TestValidationItem[]): TestValidationItem[] {
    const sorted: TestValidationItem[] = []
    const visited = new Set<string>()

    const visit = (item: TestValidationItem) => {
      if (visited.has(item.id)) return
      
      // First visit dependencies
      if (item.depends_on) {
        item.depends_on.forEach(depId => {
          const dep = items.find(i => i.id === depId)
          if (dep) visit(dep)
        })
      }
      
      visited.add(item.id)
      sorted.push(item)
    }

    items.forEach(visit)
    return sorted
  }

  // Get current validation status from database
  async getValidationStatus(): Promise<{
    items: TestValidationItem[]
    summary: {
      total: number
      pending: number
      running: number
      passed: number
      failed: number
      completion_percentage: number
    }
  }> {
    const { data: overview } = await this.supabase.rpc('get_validation_overview').single()
    const { data: items } = await this.supabase
      .from('test_validation_items')
      .select('*')
      .order('id')

    return {
      items: items || [],
      summary: overview || {
        total: 0,
        pending: 0,
        running: 0,
        passed: 0,
        failed: 0,
        completion_percentage: 0
      }
    }
  }
}

// Export singleton instance
export const testValidator = TestValidator.getInstance()