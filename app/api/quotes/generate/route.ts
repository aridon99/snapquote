// API endpoint for generating quotes from consultation data
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuotePDF } from '@/lib/pdf/quote-generator'
import { Quote, QuoteItem, QuoteTemplate } from '@/types/quotes'
import { testLogger } from '@/lib/services/test-logger'

export async function POST(request: NextRequest) {
  const start = Date.now()
  await testLogger.testStart('quote-system', 'generation', 'Starting quote generation API call')
  
  try {
    const supabase = createClient()
    const body = await request.json()
    
    await testLogger.apiCall('/api/quotes/generate', 'POST', {
      hasItems: !!body.items?.length,
      contractorId: body.contractorId,
      hasWhatsApp: !!body.whatsappThreadId
    })
    
    const {
      contractorId,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      projectDescription,
      items, // Array of quote items
      consultationTranscript,
      consultationAudioUrl,
      whatsappThreadId
    } = body

    // Validate required fields
    if (!contractorId || !customerName || !customerPhone || !customerAddress || !items?.length) {
      await testLogger.testFail('quote-system', 'generation', 'Quote generation failed: missing required fields', 
        { contractorId, customerName: !!customerName, customerPhone: !!customerPhone, items: items?.length })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get contractor template
    await testLogger.dbOperation('select', 'quote_templates', { contractor_id: contractorId })
    const { data: template, error: templateError } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('contractor_id', contractorId)
      .single()

    if (templateError || !template) {
      // Create default template if none exists
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', contractorId)
        .single()

      if (!contractor) {
        await testLogger.testFail('quote-system', 'generation', 'Contractor not found', { contractorId })
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 404 }
        )
      }

      const defaultTemplate: QuoteTemplate = {
        business_name: contractor.business_name || 'Professional Plumbing Services',
        business_phone: contractor.phone,
        business_email: contractor.email,
        business_address: 'Your Business Address',
        license_number: 'LIC123456',
        terms_and_conditions: 'Payment due upon completion. All work guaranteed.',
        payment_terms: 'Net 30',
        warranty_info: '1 Year Labor Warranty'
      }

      // Save default template
      await supabase
        .from('quote_templates')
        .insert({
          contractor_id: contractorId,
          ...defaultTemplate
        })
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    )

    // Create quote record
    await testLogger.dbOperation('insert', 'quotes', { 
      contractor_id: contractorId, 
      total_amount: totalAmount, 
      items_count: items.length 
    })
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        contractor_id: contractorId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_email: customerEmail,
        project_description: projectDescription,
        status: 'draft',
        version: 1,
        total_amount: totalAmount,
        consultation_transcript: consultationTranscript,
        consultation_audio_url: consultationAudioUrl,
        whatsapp_thread_id: whatsappThreadId
      })
      .select()
      .single()

    if (quoteError || !quote) {
      console.error('Error creating quote:', quoteError)
      await testLogger.testFail('quote-system', 'generation', 'Failed to create quote record', quoteError)
      return NextResponse.json(
        { error: 'Failed to create quote' },
        { status: 500 }
      )
    }

    // Insert quote items
    const quoteItems = items.map((item: any, index: number) => ({
      quote_id: quote.id,
      item_code: item.item_code,
      description: item.description,
      quantity: item.quantity || 1,
      unit: item.unit || 'each',
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      category: item.category || 'other',
      notes: item.notes,
      display_order: index,
      confidence_score: item.confidence || 0.9
    }))

    await testLogger.dbOperation('insert', 'quote_items', { quote_id: quote.id, items_count: quoteItems.length })
    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems)

    if (itemsError) {
      console.error('Error creating quote items:', itemsError)
      await testLogger.testFail('quote-system', 'generation', 'Failed to create quote items', itemsError)
      // Delete the quote if items fail
      await supabase.from('quotes').delete().eq('id', quote.id)
      return NextResponse.json(
        { error: 'Failed to create quote items' },
        { status: 500 }
      )
    }

    // Generate PDF
    try {
      await testLogger.pdfGeneration('start', { quote_id: quote.id, items_count: quoteItems.length })
      const pdfBuffer = await generateQuotePDF(
        quote as Quote,
        quoteItems as QuoteItem[],
        template || {
          business_name: 'Professional Services',
          business_phone: customerPhone,
          business_email: '',
          business_address: '',
          terms_and_conditions: 'Standard terms apply',
          payment_terms: 'Due on completion',
          warranty_info: '1 year warranty'
        }
      )

      // Store PDF in Supabase Storage
      const fileName = `quotes/${quote.id}/quote-v${quote.version}.pdf`
      await testLogger.dbOperation('storage_upload', 'documents', { fileName, size: pdfBuffer.length })
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (!uploadError) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName)

        // Update quote with PDF URL
        await supabase
          .from('quotes')
          .update({ pdf_url: publicUrl })
          .eq('id', quote.id)
          
        await testLogger.pdfGeneration('success', { 
          quote_id: quote.id, 
          pdf_url: publicUrl,
          file_size: pdfBuffer.length 
        })
      } else {
        await testLogger.pdfGeneration('error', { quote_id: quote.id, error: uploadError })
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      await testLogger.pdfGeneration('error', { quote_id: quote.id, error: pdfError })
      // Continue without PDF - it can be generated later
    }

    // Create review session for WhatsApp interaction
    if (whatsappThreadId) {
      await testLogger.dbOperation('insert', 'quote_review_sessions', { 
        quote_id: quote.id, 
        whatsapp_thread_id: whatsappThreadId 
      })
      await supabase
        .from('quote_review_sessions')
        .insert({
          quote_id: quote.id,
          contractor_id: contractorId,
          state: 'REVIEWING_QUOTE',
          current_version: 1,
          whatsapp_thread_id: whatsappThreadId
        })
    }

    const duration = Date.now() - start
    await testLogger.testPass('quote-system', 'generation', 'Quote generated successfully', {
      quote_id: quote.id,
      total_amount: totalAmount,
      items_count: quoteItems.length,
      has_pdf: !!quote.pdf_url,
      has_whatsapp: !!whatsappThreadId
    }, duration)
    
    await testLogger.apiSuccess('/api/quotes/generate', 'POST', { status: 200, quote_id: quote.id }, duration)
    
    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        total: totalAmount,
        version: quote.version,
        pdf_url: quote.pdf_url
      },
      message: 'Quote generated successfully'
    })

  } catch (error) {
    console.error('Quote generation error:', error)
    const duration = Date.now() - start
    await testLogger.testFail('quote-system', 'generation', 'Quote generation failed with error', error, duration)
    await testLogger.apiError('/api/quotes/generate', 'POST', error, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve a quote
export async function GET(request: NextRequest) {
  const start = Date.now()
  await testLogger.testStart('quote-system', 'retrieval', 'Starting quote retrieval API call')
  
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('id')
    
    await testLogger.apiCall('/api/quotes/generate', 'GET', { quoteId })

    if (!quoteId) {
      await testLogger.testFail('quote-system', 'retrieval', 'Quote retrieval failed: missing quote ID')
      return NextResponse.json(
        { error: 'Quote ID required' },
        { status: 400 }
      )
    }

    // Get quote with items
    await testLogger.dbOperation('select', 'quotes', { quote_id: quoteId })
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        quote_templates!quotes_contractor_id_fkey (*)
      `)
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      await testLogger.testFail('quote-system', 'retrieval', 'Quote not found', { quoteId, error: quoteError })
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    const duration = Date.now() - start
    await testLogger.testPass('quote-system', 'retrieval', 'Quote retrieved successfully', {
      quote_id: quote.id,
      items_count: quote.quote_items?.length || 0,
      has_template: !!quote.quote_templates
    }, duration)
    
    await testLogger.apiSuccess('/api/quotes/generate', 'GET', { status: 200, quote_id: quote.id }, duration)
    
    return NextResponse.json({
      quote,
      items: quote.quote_items,
      template: quote.quote_templates
    })

  } catch (error) {
    console.error('Quote retrieval error:', error)
    const duration = Date.now() - start
    await testLogger.testFail('quote-system', 'retrieval', 'Quote retrieval failed with error', error, duration)
    await testLogger.apiError('/api/quotes/generate', 'GET', error, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}