// API endpoint for processing voice edit commands on quotes
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  QUOTE_EDIT_SYSTEM_PROMPT,
  createEditPrompt,
  parseGPTEditResponse,
  formatChangeConfirmation,
  applyEditsToItems
} from '@/lib/ai/quote-edit-prompts'
import { generateQuotePDF } from '@/lib/pdf/quote-generator'
import { createOpenAIClient } from '@/lib/services/secure-api-keys'
import { QuoteItem, VoiceEditCommand } from '@/types/quotes'
import { testLogger } from '@/lib/services/test-logger'

export async function POST(request: NextRequest) {
  const start = Date.now()
  await testLogger.testStart('quote-system', 'edit', 'Starting quote edit API call')
  
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    await testLogger.apiCall('/api/quotes/edit', 'POST', {
      hasQuoteId: !!body.quoteId,
      hasVoiceTranscript: !!body.voiceTranscript,
      action: body.action
    })
    
    const {
      quoteId,
      voiceTranscript,
      action, // 'process' or 'confirm'
      sessionId
    } = body

    if (!quoteId || !sessionId) {
      await testLogger.testFail('quote-system', 'edit', 'Quote edit failed: missing required fields', 
        { quoteId: !!quoteId, sessionId: !!sessionId })
      return NextResponse.json(
        { error: 'Quote ID and session ID required' },
        { status: 400 }
      )
    }

    // Get current session
    await testLogger.dbOperation('select', 'quote_review_sessions', { sessionId })
    const { data: session, error: sessionError } = await supabase
      .from('quote_review_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      await testLogger.testFail('quote-system', 'edit', 'Quote edit session not found', 
        { sessionId, error: sessionError })
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (action === 'process' && voiceTranscript) {
      // Process voice edit command
      await testLogger.testStart('quote-system', 'voice_edit_processing', 
        `Processing voice edit: "${voiceTranscript.substring(0, 100)}..."`)
      
      // Get current quote and items
      await testLogger.dbOperation('select', 'quotes', { quoteId })
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      await testLogger.dbOperation('select', 'quote_items', { quote_id: quoteId })
      const { data: currentItems } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('display_order')

      if (!quote || !currentItems) {
        await testLogger.testFail('quote-system', 'voice_edit_processing', 'Quote or items not found for editing', 
          { quoteId, hasQuote: !!quote, itemsCount: currentItems?.length || 0 })
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        )
      }

      // Use GPT to parse the voice command
      let editCommands: VoiceEditCommand[] = []
      
      // Check if we're in mock mode or real GPT mode
      if (process.env.USE_MOCK_GPT === 'true') {
        // Mock GPT response for testing
        await testLogger.log('INFO', 'quote-system', 'voice_edit_processing', 'Using mock GPT for voice parsing', 
          { transcript: voiceTranscript, mockMode: true })
        editCommands = mockParseVoiceCommand(voiceTranscript, currentItems as QuoteItem[])
      } else {
        // Real GPT-4 processing
        try {
          await testLogger.log('INFO', 'quote-system', 'voice_edit_processing', 'Using real GPT-4o-mini for voice parsing', 
            { transcript: voiceTranscript.substring(0, 200), itemsCount: currentItems.length })
          
          const openai = await createOpenAIClient()
          const prompt = createEditPrompt(voiceTranscript, currentItems as QuoteItem[])
          
          const gptStart = Date.now()
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: QUOTE_EDIT_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000
          })
          const gptDuration = Date.now() - gptStart

          const gptResponse = completion.choices[0]?.message?.content || '[]'
          editCommands = parseGPTEditResponse(gptResponse)
          
          await testLogger.log('INFO', 'quote-system', 'voice_edit_processing', 'GPT processing completed', 
            { commandsFound: editCommands.length, gptResponse: gptResponse.substring(0, 200) }, gptDuration)
        } catch (gptError) {
          console.error('GPT processing error:', gptError)
          await testLogger.log('API_ERROR', 'quote-system', 'voice_edit_processing', 
            'GPT processing failed, falling back to mock', gptError)
          // Fall back to mock if GPT fails
          editCommands = mockParseVoiceCommand(voiceTranscript, currentItems as QuoteItem[])
        }
      }

      // Format confirmation message
      const confirmationMessage = formatChangeConfirmation(editCommands, currentItems as QuoteItem[])

      // Update session with pending changes
      await testLogger.dbOperation('update', 'quote_review_sessions', 
        { sessionId, pendingChangesCount: editCommands.length })
      await supabase
        .from('quote_review_sessions')
        .update({
          pending_changes: editCommands,
          state: 'CONFIRMING_CHANGES',
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)

      const duration = Date.now() - start
      await testLogger.testPass('quote-system', 'voice_edit_processing', 
        'Voice edit processing completed successfully', {
          quoteId,
          transcript: voiceTranscript.substring(0, 100),
          changesFound: editCommands.length,
          requiresConfirmation: true
        }, duration)
      
      return NextResponse.json({
        success: true,
        message: confirmationMessage,
        changes: editCommands,
        requiresConfirmation: true
      })

    } else if (action === 'confirm') {
      // Apply confirmed changes
      await testLogger.testStart('quote-system', 'edit_confirm', 'Starting quote edit confirmation')
      
      if (!session.pending_changes) {
        await testLogger.testFail('quote-system', 'edit_confirm', 'No pending changes to confirm', { sessionId })
        return NextResponse.json(
          { error: 'No pending changes to confirm' },
          { status: 400 }
        )
      }

      // Get current items
      await testLogger.dbOperation('select', 'quote_items', { quote_id: quoteId })
      const { data: currentItems } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('display_order')

      if (!currentItems) {
        await testLogger.testFail('quote-system', 'edit_confirm', 'Quote items not found for confirmation', 
          { quoteId })
        return NextResponse.json(
          { error: 'Quote items not found' },
          { status: 404 }
        )
      }

      // Apply edits to items
      const updatedItems = applyEditsToItems(
        currentItems as QuoteItem[],
        session.pending_changes as VoiceEditCommand[]
      )
      
      await testLogger.log('INFO', 'quote-system', 'edit_confirm', 'Applying quote edits', {
        originalItemsCount: currentItems.length,
        updatedItemsCount: updatedItems.length,
        changesCount: session.pending_changes.length
      })

      // Update database
      // First, delete all existing items
      await testLogger.dbOperation('delete', 'quote_items', { quote_id: quoteId })
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId)

      // Insert updated items
      const itemsToInsert = updatedItems.map((item, index) => ({
        quote_id: quoteId,
        item_code: item.item_code,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: item.category,
        notes: item.notes,
        display_order: index,
        confidence_score: (item as any).confidence_score || 0.9
      }))

      await testLogger.dbOperation('insert', 'quote_items', 
        { quote_id: quoteId, items_count: itemsToInsert.length })
      await supabase
        .from('quote_items')
        .insert(itemsToInsert)

      // Record the edit in audit trail
      const { data: quote } = await supabase
        .from('quotes')
        .select('version')
        .eq('id', quoteId)
        .single()

      await supabase
        .from('quote_edits')
        .insert({
          quote_id: quoteId,
          version_from: quote?.version || 1,
          version_to: (quote?.version || 1) + 1,
          edit_type: 'bulk_change',
          voice_transcript: session.pending_changes,
          changes_json: session.pending_changes,
          confidence_score: 0.9
        })

      // Generate new PDF
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      const { data: template } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('contractor_id', quoteData?.contractor_id)
        .single()

      if (quoteData && template) {
        try {
          await testLogger.pdfGeneration('start', 
            { quote_id: quoteId, updated_items_count: updatedItems.length })
          const pdfBuffer = await generateQuotePDF(
            quoteData as any,
            updatedItems,
            template as any
          )

          // Store new version of PDF
          const fileName = `quotes/${quoteId}/quote-v${(quoteData.version || 1) + 1}.pdf`
          await testLogger.dbOperation('storage_upload', 'documents', 
            { fileName, size: pdfBuffer.length })
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            })

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName)

            await supabase
              .from('quotes')
              .update({ 
                pdf_url: publicUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', quoteId)
              
            await testLogger.pdfGeneration('success', 
              { quote_id: quoteId, pdf_url: publicUrl, file_size: pdfBuffer.length })
          } else {
            await testLogger.pdfGeneration('error', { quote_id: quoteId, error: uploadError })
          }
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError)
          await testLogger.pdfGeneration('error', { quote_id: quoteId, error: pdfError })
        }
      }

      // Update session
      await supabase
        .from('quote_review_sessions')
        .update({
          pending_changes: null,
          state: 'REVIEWING_QUOTE',
          current_version: (quote?.version || 1) + 1,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)

      // Calculate new total
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0)
      
      const duration = Date.now() - start
      await testLogger.testPass('quote-system', 'edit_confirm', 
        'Quote edit confirmation completed successfully', {
          quoteId,
          newTotal,
          newVersion: (quote?.version || 1) + 1,
          itemsCount: updatedItems.length
        }, duration)

      return NextResponse.json({
        success: true,
        message: `Quote updated successfully. New total: $${newTotal.toFixed(2)}`,
        newVersion: (quote?.version || 1) + 1,
        pdf_url: quoteData?.pdf_url
      })
    }

    await testLogger.testFail('quote-system', 'edit', 'Invalid action specified', { action })
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Quote edit error:', error)
    const duration = Date.now() - start
    await testLogger.testFail('quote-system', 'edit', 'Quote edit failed with error', error, duration)
    await testLogger.apiError('/api/quotes/edit', 'POST', error, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock function for testing without GPT
function mockParseVoiceCommand(transcript: string, items: QuoteItem[]): VoiceEditCommand[] {
  const commands: VoiceEditCommand[] = []
  const lowerTranscript = transcript.toLowerCase()

  // Simple pattern matching for testing
  if (lowerTranscript.includes('change') && lowerTranscript.includes('toilet')) {
    const priceMatch = transcript.match(/\$?(\d+)/g)
    if (priceMatch) {
      const newPrice = parseFloat(priceMatch[0].replace('$', ''))
      commands.push({
        type: 'CHANGE_PRICE',
        target: 'toilet',
        value: newPrice,
        confidence: 0.9
      })
    }
  }

  if (lowerTranscript.includes('add')) {
    if (lowerTranscript.includes('wax ring')) {
      commands.push({
        type: 'ADD_ITEM',
        description: 'Wax Ring Replacement',
        value: 25,
        confidence: 0.85
      })
    }
    if (lowerTranscript.includes('shut-off valve') || lowerTranscript.includes('shutoff valve')) {
      commands.push({
        type: 'ADD_ITEM',
        description: 'Shut-off Valve Replacement',
        value: 85,
        confidence: 0.9
      })
    }
  }

  if (lowerTranscript.includes('remove')) {
    const removePatterns = ['second bathroom', 'vanity', 'disposal']
    removePatterns.forEach(pattern => {
      if (lowerTranscript.includes(pattern)) {
        commands.push({
          type: 'REMOVE_ITEM',
          target: pattern,
          confidence: 0.8
        })
      }
    })
  }

  if (lowerTranscript.includes('percent') || lowerTranscript.includes('%')) {
    const percentMatch = transcript.match(/(\d+)\s*(%|percent)/i)
    if (percentMatch) {
      const percentage = parseFloat(percentMatch[1])
      commands.push({
        type: 'BULK_CHANGE',
        operation: 'add_percentage',
        value: percentage,
        scope: 'all',
        confidence: 0.85
      })
    }
  }

  return commands
}