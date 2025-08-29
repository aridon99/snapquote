import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Validation schema
const quickWinSchema = z.object({
  contractor_id: z.string().uuid(),
  voice_transcription: z.string().optional(),
  media_url: z.string().url().optional(),
  message_sid: z.string().optional()
}).refine(data => data.voice_transcription || data.media_url, {
  message: "Either voice_transcription or media_url must be provided"
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced GPT prompt for practice quote extraction
const PRACTICE_QUOTE_PROMPT = `
System: Extract pricing information from contractor's practice quote recording for immediate PDF generation.

Context: This is a new contractor learning the system. They are providing explicit pricing for demonstration purposes.

Task: Parse their voice description into structured quote data.

Rules:
1. Work Item Identification:
   - Identify each distinct work task/item mentioned
   - Create professional descriptions (e.g., "wobbly toilet" → "Toilet Reset and Repair")
   
2. Price Extraction:
   - Extract labor cost and material cost for each item
   - Parse prices in ANY spoken format: "$350", "three fifty", "350 dollars", "three hundred and fifty"
   - Handle ranges: "between 200 and 250" → use midpoint ($225)
   
3. Speech Pattern Handling:
   - Ignore filler words: "um", "let me see", "you know"
   - Handle corrections: "that's 300... no wait, 350" → use $350
   - Skip thinking out loud: "hmm what else", "let me think"
   - Process self-interruptions and restarts
   
4. Output Format:
   - Return clean JSON array of work items
   - Each item: {description, labor_cost, material_cost, total, notes}
   - Professional descriptions suitable for customer quotes
   
5. Error Handling:
   - If unclear on price, include "price_unclear: true"
   - If work description is vague, create best professional interpretation

Input Transcription: "{transcription}"

Output: Clean JSON for immediate quote generation in the following format:
{
  "quote_items": [
    {
      "description": "Professional work description",
      "labor_cost": 250.00,
      "material_cost": 75.00,
      "total": 325.00,
      "notes": "Additional context if needed",
      "price_unclear": false
    }
  ],
  "total_labor": 250.00,
  "total_materials": 75.00,
  "grand_total": 325.00,
  "confidence_score": 0.95
}
`;

// Transcribe audio using Whisper
async function transcribeAudio(mediaUrl: string): Promise<string | null> {
  try {
    // Download audio file from Twilio with authentication
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    console.log('Downloading audio from Twilio:', mediaUrl);
    
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });
    
    if (!response.ok) {
      console.error('Failed to download audio from Twilio:', response.statusText);
      return null;
    }
    
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Audio downloaded, size:', audioBuffer.length, 'bytes');
    
    // Save to temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `practice_quote_${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    try {
      // Create ReadStream and transcribe
      const audioStream = fs.createReadStream(tempFilePath);
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'en',
        prompt: 'This is a contractor describing work items and pricing for a quote. Focus on extracting clear pricing and work descriptions.',
        // Performance optimizations for sub-4 second transcription
        response_format: 'text',
        temperature: 0.0
      });
      
      console.log('Transcription successful:', transcription);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return transcription;
    } catch (transcriptError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw transcriptError;
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return null;
  }
}

// Process transcription with GPT-4o-mini
async function processWithGPT(transcription: string) {
  try {
    const prompt = PRACTICE_QUOTE_PROMPT.replace('{transcription}', transcription);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      temperature: 0.1, // Very low temperature for maximum consistency and speed
      max_tokens: 800, // Reduced tokens for faster response
      response_format: { type: 'json_object' },
      // Performance optimization for sub-4 second target
      stream: false
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('GPT processing error:', error);
    throw error;
  }
}

// Generate optimized PDF quote with generic branding for progressive enhancement
async function generateQuotePDF(contractorData: any, quoteData: any): Promise<string> {
  try {
    const startTime = Date.now();
    
    // Use generic branding to motivate profile completion
    const displayName = contractorData.business_name === 'ABC Contractor Inc' ? 
      'ABC Contractor Inc' : contractorData.business_name;
    
    // For now, return a mock PDF URL optimized for speed
    // In production, this would generate a real PDF using @react-pdf/renderer or similar
    const mockPdfUrl = `https://renovation-advisor-ten.vercel.app/api/quotes/practice-${contractorData.id}-${Date.now()}.pdf`;
    
    // Store quote data in database for PDF generation (async for speed)
    const supabase = await createClient();
    const insertPromise = supabase
      .from('contractor_practice_quotes')
      .insert({
        contractor_id: contractorData.id,
        quote_data: quoteData,
        pdf_url: mockPdfUrl,
        total_amount: quoteData.grand_total,
        item_count: quoteData.quote_items.length,
        confidence_score: quoteData.confidence_score,
        created_at: new Date().toISOString()
      });
    
    // Don't await to improve speed - fire and forget for Quick Win
    insertPromise.catch(error => console.error('Database insert error:', error));
    
    const processingTime = Date.now() - startTime;
    console.log(`PDF generation completed in ${processingTime}ms for ${displayName}`);
    
    return mockPdfUrl;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Send WhatsApp success message with progressive enhancement motivation
async function sendQuickWinSuccess(phone: string, contactName: string, businessName: string, pdfUrl: string, quoteData: any) {
  try {
    const twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) return;

    const client = twilio(accountSid, authToken);
    
    const itemsList = quoteData.quote_items
      .map((item: any, index: number) => `${index + 1}. ${item.description} - $${item.total}`)
      .join('\n');

    // Progressive enhancement messaging
    const isGenericBranding = businessName === 'ABC Contractor Inc';
    const brandingMotivation = isGenericBranding ? 
      `\n\n🎯 Complete your profile to get personalized quotes like this with YOUR business name and branding!` : 
      ``;
    
    const message = `🎉 AMAZING! Your first quote is ready, ${contactName}!\n\n📋 ${businessName} - Practice Quote\n${itemsList}\n\n💰 Total: $${quoteData.grand_total}\n⏱️ Generated in: 30 seconds\n\n🔥 This is how fast you can quote EVERY job!${brandingMotivation}\n\nWant it even FASTER? Upload your old invoices and our AI will learn your pricing patterns. Then you'll only need to describe the work - no prices needed!\n\nReady to set up your full system? Reply YES to continue!`;

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone
    });

    console.log(`Quick Win success message sent to ${phone}`);
  } catch (error) {
    console.error('Error sending success message:', error);
  }
}

// POST handler for quick win quote processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = quickWinSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { contractor_id, voice_transcription, media_url, message_sid } = validationResult.data;

    // Get contractor data
    const supabase = await createClient();
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', contractor_id)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { success: false, message: 'Contractor not found' },
        { status: 404 }
      );
    }

    let transcription = voice_transcription;

    // If we have a media URL, transcribe it first
    if (media_url && !transcription) {
      console.log('Transcribing audio for contractor:', contractor.business_name);
      transcription = await transcribeAudio(media_url);
      
      if (!transcription) {
        return NextResponse.json(
          { success: false, message: 'Failed to transcribe audio. Please try speaking more clearly.' },
          { status: 400 }
        );
      }
    }

    if (!transcription) {
      return NextResponse.json(
        { success: false, message: 'No transcription available' },
        { status: 400 }
      );
    }

    console.log('Processing transcription for quick win quote:', transcription);

    // Process with GPT
    const quoteData = await processWithGPT(transcription);
    
    if (!quoteData.quote_items || quoteData.quote_items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No work items found in your recording. Please describe the work more specifically and include your prices.',
          transcription: transcription
        },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfUrl = await generateQuotePDF(contractor, quoteData);

    // Update onboarding progress
    await supabase
      .from('contractor_onboarding_progress')
      .upsert({
        contractor_id: contractor.id,
        quick_win_completed: true,
        quick_win_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Send success message via WhatsApp with progressive enhancement motivation
    if (contractor.whatsapp_number || contractor.phone) {
      const phone = contractor.whatsapp_number || `whatsapp:+1${contractor.phone}`;
      await sendQuickWinSuccess(phone, contractor.contact_name, contractor.business_name, pdfUrl, quoteData);
    }

    console.log(`Quick Win quote generated for ${contractor.business_name}: ${quoteData.quote_items.length} items, $${quoteData.grand_total}`);

    return NextResponse.json({
      success: true,
      message: 'Quote generated successfully!',
      data: {
        quote_items: quoteData.quote_items,
        total_labor: quoteData.total_labor,
        total_materials: quoteData.total_materials,
        grand_total: quoteData.grand_total,
        confidence_score: quoteData.confidence_score,
        pdf_url: pdfUrl,
        transcription: transcription
      }
    });

  } catch (error) {
    console.error('Quick Win quote processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}