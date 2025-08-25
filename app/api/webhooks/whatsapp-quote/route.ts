// Enhanced WhatsApp Webhook for Quote Review System
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTwilioClient } from '@/lib/services/secure-api-keys'
import { testLogger } from '@/lib/services/test-logger'

let twilioClient: any = null

// Initialize Twilio client lazily
async function getTwilioClient() {
  if (!twilioClient) {
    twilioClient = await createTwilioClient()
  }
  return twilioClient
}

// Parse WhatsApp/SMS webhook body
function parseWebhookBody(body: string) {
  const params = new URLSearchParams(body)
  return {
    MessageSid: params.get('MessageSid'),
    From: params.get('From'),
    To: params.get('To'),
    Body: params.get('Body'),
    NumMedia: params.get('NumMedia'),
    MediaUrl0: params.get('MediaUrl0'),
    MediaContentType0: params.get('MediaContentType0'),
    // Voice message fields
    RecordingUrl: params.get('RecordingUrl'),
    RecordingDuration: params.get('RecordingDuration'),
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  await testLogger.testStart('whatsapp', 'webhook', 'WhatsApp webhook received')
  
  try {
    const body = await request.text()
    const webhookData = parseWebhookBody(body)
    const supabase = createClient()
    
    await testLogger.webhookEvent('whatsapp_message', {
      from: webhookData.From,
      hasBody: !!webhookData.Body,
      hasMedia: parseInt(webhookData.NumMedia || '0') > 0,
      hasRecording: !!webhookData.RecordingUrl
    })

    const {
      From: fromPhone,
      Body: messageBody,
      NumMedia: numMedia,
      MediaUrl0: mediaUrl,
      MediaContentType0: mediaType,
      RecordingUrl: recordingUrl,
      RecordingDuration: recordingDuration
    } = webhookData

    if (!fromPhone) {
      await testLogger.testFail('whatsapp', 'webhook', 'WhatsApp webhook missing phone number')
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Clean phone number
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+/, '')
    
    // Find contractor by phone
    const { data: contractor } = await supabase
      .from('contractors')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    if (!contractor) {
      // Not a registered contractor
      await testLogger.log('INFO', 'whatsapp', 'webhook', 'Unregistered contractor attempted to use webhook', 
        { phone: cleanPhone })
      await sendWhatsAppMessage(fromPhone, 
        "Welcome! You need to register as a contractor first. Visit our website to sign up."
      )
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Check for active quote review session
    const { data: activeSession } = await supabase
      .from('quote_review_sessions')
      .select('*')
      .eq('contractor_id', contractor.id)
      .eq('whatsapp_thread_id', cleanPhone)
      .neq('state', 'FINALIZED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Handle different message types based on session state
    if (activeSession) {
      await handleQuoteReviewFlow(
        activeSession,
        contractor,
        messageBody,
        mediaUrl,
        mediaType,
        recordingUrl,
        fromPhone,
        supabase
      )
    } else {
      // No active session - check what they're trying to do
      await handleGeneralMessage(
        contractor,
        messageBody,
        mediaUrl,
        mediaType,
        recordingUrl,
        fromPhone,
        supabase
      )
    }

    const duration = Date.now() - start
    await testLogger.testPass('whatsapp', 'webhook', 'WhatsApp webhook processed successfully', {
      contractorId: contractor.id,
      hasActiveSession: !!activeSession,
      messageType: recordingUrl ? 'voice' : messageBody ? 'text' : 'media'
    }, duration)
    
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    const duration = Date.now() - start
    await testLogger.testFail('whatsapp', 'webhook', 'WhatsApp webhook failed with error', error, duration)
    
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}

async function handleQuoteReviewFlow(
  session: any,
  contractor: any,
  messageBody: string | null,
  mediaUrl: string | null,
  mediaType: string | null,
  recordingUrl: string | null,
  fromPhone: string,
  supabase: any
) {
  switch (session.state) {
    case 'REVIEWING_QUOTE':
      // They should be sending voice edits or "send it"
      if (recordingUrl || (mediaType && mediaType.includes('audio'))) {
        // Process voice edit command
        const voiceUrl = recordingUrl || mediaUrl
        
        // Transcribe voice (mock for now)
        const transcript = await mockTranscribeVoice(voiceUrl)
        
        if (transcript.toLowerCase().includes('send it') || 
            transcript.toLowerCase().includes('looks good') ||
            transcript.toLowerCase().includes('perfect')) {
          // Finalize and send quote
          await finalizeQuote(session.quote_id, supabase)
          
          await sendWhatsAppMessage(fromPhone,
            "✅ Quote sent to customer! You'll be notified when they view it."
          )
          
          // Update session
          await supabase
            .from('quote_review_sessions')
            .update({ 
              state: 'FINALIZED',
              finalized_at: new Date().toISOString()
            })
            .eq('id', session.id)
        } else {
          // Process edit commands
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteId: session.quote_id,
              voiceTranscript: transcript,
              action: 'process',
              sessionId: session.id
            })
          })
          
          const result = await response.json()
          
          // Send confirmation message
          await sendWhatsAppMessage(fromPhone, result.message)
        }
      } else if (messageBody === '👍' || messageBody?.toLowerCase() === 'yes') {
        // Confirm pending changes
        if (session.state === 'CONFIRMING_CHANGES' && session.pending_changes) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteId: session.quote_id,
              action: 'confirm',
              sessionId: session.id
            })
          })
          
          const result = await response.json()
          
          // Send updated PDF
          if (result.pdf_url) {
            await sendWhatsAppPDF(fromPhone, result.pdf_url, 
              `Updated quote ready 📄\nReview and record any other changes, or say 'send it' to deliver to customer`
            )
          }
        }
      }
      break

    case 'CONFIRMING_CHANGES':
      // Waiting for confirmation
      if (messageBody === '👍' || messageBody?.toLowerCase() === 'yes') {
        // Apply changes
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId: session.quote_id,
            action: 'confirm',
            sessionId: session.id
          })
        })
        
        const result = await response.json()
        
        // Send updated PDF
        if (result.pdf_url) {
          await sendWhatsAppPDF(fromPhone, result.pdf_url,
            `Updated quote ready 📄\nReview and record any other changes, or say 'send it' to deliver to customer`
          )
        }
      } else if (recordingUrl || (mediaType && mediaType.includes('audio'))) {
        // They're adjusting the changes
        const voiceUrl = recordingUrl || mediaUrl
        const transcript = await mockTranscribeVoice(voiceUrl)
        
        // Re-process with new instructions
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId: session.quote_id,
            voiceTranscript: transcript,
            action: 'process',
            sessionId: session.id
          })
        })
        
        const result = await response.json()
        await sendWhatsAppMessage(fromPhone, result.message)
      }
      break
  }
}

async function handleGeneralMessage(
  contractor: any,
  messageBody: string | null,
  mediaUrl: string | null,
  mediaType: string | null,
  recordingUrl: string | null,
  fromPhone: string,
  supabase: any
) {
  // Check if they're trying to start a consultation
  if (recordingUrl || (mediaType && mediaType.includes('audio'))) {
    const voiceUrl = recordingUrl || mediaUrl
    
    // Check if this is a long consultation recording (>5 minutes)
    // For now, we'll assume it's a consultation
    await sendWhatsAppMessage(fromPhone,
      "📝 Processing your consultation recording...\nThis may take a few minutes."
    )
    
    // Mock consultation processing
    const mockQuoteData = await mockProcessConsultation(voiceUrl, contractor)
    
    // Generate quote
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractorId: contractor.id,
        ...mockQuoteData,
        whatsappThreadId: fromPhone.replace('whatsapp:', '')
      })
    })
    
    const result = await response.json()
    
    if (result.success && result.quote.pdf_url) {
      await sendWhatsAppPDF(fromPhone, result.quote.pdf_url,
        `Your quote for $${result.quote.total.toFixed(2)} is ready 📄\nReply with voice to make changes or say 'send it' to deliver.`
      )
    }
  } else if (messageBody?.toLowerCase().includes('help')) {
    await sendWhatsAppMessage(fromPhone,
      `📱 *Contractor Quote System*\n\n` +
      `1️⃣ Record consultation with customer (15-30 min)\n` +
      `2️⃣ Send voice recording here\n` +
      `3️⃣ Review generated quote PDF\n` +
      `4️⃣ Make voice edits if needed\n` +
      `5️⃣ Say "send it" to deliver to customer\n\n` +
      `Need assistance? Reply 'support'`
    )
  }
}

// Helper functions
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    await testLogger.log('INFO', 'whatsapp', 'send_message', 'Sending WhatsApp text message', 
      { to: to.replace(/whatsapp:/, ''), messageLength: message.length })
    
    const client = await getTwilioClient()
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: to.includes('whatsapp:') ? to : `whatsapp:${to}`,
      body: message
    })
    
    await testLogger.testPass('whatsapp', 'send_message', 'WhatsApp message sent successfully', 
      { to: to.replace(/whatsapp:/, ''), messageLength: message.length })
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    await testLogger.testFail('whatsapp', 'send_message', 'Failed to send WhatsApp message', error)
  }
}

async function sendWhatsAppPDF(to: string, pdfUrl: string, caption: string) {
  try {
    await testLogger.testStart('whatsapp', 'send_pdf', 'Sending WhatsApp PDF attachment')
    
    const client = await getTwilioClient()
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: to.includes('whatsapp:') ? to : `whatsapp:${to}`,
      body: caption,
      mediaUrl: [pdfUrl]
    })
    
    await testLogger.testPass('whatsapp', 'send_pdf', 'WhatsApp PDF sent successfully', 
      { to: to.replace(/whatsapp:/, ''), pdfUrl, captionLength: caption.length })
    
  } catch (error) {
    console.error('Error sending WhatsApp PDF:', error)
    await testLogger.testFail('whatsapp', 'send_pdf', 'Failed to send WhatsApp PDF', error)
  }
}

async function mockTranscribeVoice(voiceUrl: string | null): Promise<string> {
  // Mock transcription for testing
  // In production, this would use OpenAI Whisper or similar
  console.log('Mock transcribing voice from:', voiceUrl)
  
  // Return different mock transcripts based on testing scenarios
  const mockTranscripts = [
    "Change the toilet install to 650 and add a shut-off valve for 85",
    "Looks good, send it to the customer",
    "Remove the second bathroom vanity",
    "Add 10 percent to everything for rush job"
  ]
  
  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
}

async function mockProcessConsultation(voiceUrl: string | null, contractor: any) {
  // Mock consultation processing
  console.log('Mock processing consultation from:', voiceUrl)
  
  return {
    customerName: "John Smith",
    customerPhone: "+14155551234",
    customerAddress: "123 Main St, San Francisco, CA 94102",
    customerEmail: "john.smith@example.com",
    projectDescription: "Master bathroom renovation including toilet replacement, new faucet installation, and minor plumbing repairs",
    items: [
      {
        item_code: 'TOILET_COMFORT',
        description: 'Toilet Installation (Comfort Height)',
        quantity: 1,
        unit: 'each',
        unit_price: 450,
        category: 'fixtures'
      },
      {
        item_code: 'FAUCET_BATH',
        description: 'Bathroom Faucet Replacement',
        quantity: 1,
        unit: 'each',
        unit_price: 125,
        category: 'fixtures'
      },
      {
        item_code: 'SHUTOFF_VALVE',
        description: 'Shut-off Valve Replacement',
        quantity: 2,
        unit: 'each',
        unit_price: 85,
        category: 'repairs'
      },
      {
        description: 'Miscellaneous supplies and materials',
        quantity: 1,
        unit: 'job',
        unit_price: 75,
        category: 'material'
      }
    ],
    consultationTranscript: "Mock transcript of consultation",
    consultationAudioUrl: voiceUrl
  }
}

async function finalizeQuote(quoteId: string, supabase: any) {
  // Update quote status to sent
  await supabase
    .from('quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', quoteId)
  
  // In production, this would actually send the quote to the customer
  console.log('Quote finalized and sent:', quoteId)
}