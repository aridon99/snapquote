// Test Twilio Webhook - Works without Supabase
// For testing WhatsApp voice message processing

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Parse Twilio webhook body
function parseTwilioWebhook(body: string) {
  const params = new URLSearchParams(body);
  const result: any = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Handle WhatsApp voice messages for punch list creation
async function handleWhatsAppVoiceMessage(fromPhone: string, mediaUrl: string, messageSid: string) {
  try {
    console.log(`Processing voice message from ${fromPhone}`);
    console.log(`Media URL: ${mediaUrl}`);

    // Transcribe voice message using OpenAI Whisper
    const transcription = await transcribeVoiceMessage(mediaUrl);
    
    if (!transcription) {
      await sendWhatsAppMessage(fromPhone, 'Sorry, I couldn\'t process your voice message. Please try speaking more clearly.');
      return;
    }

    console.log('Transcription:', transcription);

    // Extract punch list items using GPT-4
    const punchListItems = await extractPunchListItems(transcription);
    
    if (punchListItems.length === 0) {
      await sendWhatsAppMessage(
        fromPhone, 
        `I heard: "${transcription}"\n\nBut couldn't extract any punch list items. Please be more specific about what needs to be done.`
      );
      return;
    }

    // Send confirmation message
    let confirmationMsg = `✅ Punch list created with ${punchListItems.length} items:\n\n`;
    
    punchListItems.forEach((item: any, index: number) => {
      const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      confirmationMsg += `${index + 1}. ${priorityEmoji} ${item.room}: ${item.item}\n`;
      confirmationMsg += `   Trade: ${item.trade} (${item.estimated_hours}h)\n`;
    });
    
    confirmationMsg += '\n📤 Items saved successfully!';
    
    await sendWhatsAppMessage(fromPhone, confirmationMsg);

    console.log(`Successfully processed voice message from ${fromPhone}`);

  } catch (error) {
    console.error('Error handling WhatsApp voice message:', error);
    await sendWhatsAppMessage(fromPhone, 'Sorry, there was an error processing your voice message. Please try again.');
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsAppMessage(toPhone: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return;
    }

    const client = twilio(accountSid, authToken);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toPhone
    });

    console.log(`WhatsApp message sent to ${toPhone}: ${result.sid}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

// Transcribe voice message using OpenAI Whisper
async function transcribeVoiceMessage(mediaUrl: string): Promise<string | null> {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // For Twilio media, we need to authenticate
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Download audio file with auth
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });
    
    if (!response.ok) {
      console.error('Failed to download audio:', response.statusText);
      return null;
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    // Create File object for OpenAI
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });
    
    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    return null;
  }
}

// Extract punch list items using GPT-4
async function extractPunchListItems(transcription: string) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Extract punch list items from this voice message about home renovation/construction.

Voice message: "${transcription}"

Extract each actionable item and return as JSON array with this exact structure:
{
  "items": [
    {
      "item": "specific task description",
      "room": "room or area name",
      "trade": "plumber|electrician|carpenter|painter|general|hvac|tile|drywall|flooring",
      "priority": "high|medium|low", 
      "estimated_hours": 1-8,
      "notes": "additional context if needed"
    }
  ]
}

Only extract actionable items that need to be completed. Be specific and clear.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a construction project manager who extracts actionable punch list items from voice messages. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1500
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"items": []}');
    return result.items || [];
  } catch (error) {
    console.error('GPT-4 extraction error:', error);
    return [];
  }
}

// Handle incoming SMS/WhatsApp messages
async function handleIncomingSMS(webhookData: any) {
  try {
    const { 
      From: fromPhone, 
      Body: messageBody, 
      MessageSid: messageSid,
      NumMedia: numMedia,
      MediaUrl0: mediaUrl,
      MediaContentType0: mediaType
    } = webhookData;

    if (!fromPhone) {
      console.error('Missing phone number in webhook data');
      return;
    }

    console.log(`Processing message from ${fromPhone}:`, { messageBody, numMedia, mediaType });

    // Check if this is a WhatsApp voice message
    const isWhatsApp = fromPhone.includes('whatsapp:');
    const hasAudioMedia = numMedia && parseInt(numMedia) > 0 && 
                         mediaType && mediaType.startsWith('audio/');

    if (isWhatsApp && hasAudioMedia && mediaUrl) {
      console.log('Processing WhatsApp voice message');
      await handleWhatsAppVoiceMessage(fromPhone, mediaUrl, messageSid);
      return;
    }

    // Handle text messages
    if (messageBody) {
      console.log(`Processing text message: "${messageBody}"`);
      await sendWhatsAppMessage(fromPhone, `Got your message: "${messageBody}". Please send a voice message describing renovation issues for punch list processing.`);
    }

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

// POST handler for Twilio webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookData = parseTwilioWebhook(body);
    
    console.log('Twilio webhook received:', JSON.stringify(webhookData, null, 2));

    // Handle incoming messages
    if (webhookData.From) {
      await handleIncomingSMS(webhookData);
    }

    // Return TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    
    // Return empty TwiML response to avoid Twilio retries
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

    return new NextResponse(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
}

// GET handler for webhook health check
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'twilio-test-webhook',
    timestamp: new Date().toISOString(),
    message: 'Test webhook ready - no database required!'
  });
}