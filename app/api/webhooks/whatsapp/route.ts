// F14A WhatsApp Webhook Endpoint
// Handles incoming WhatsApp voice messages for punch list processing

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processVoiceTranscription } from '@/lib/services/voice-transcription';
import { processTranscribedMessages } from '@/lib/services/punch-list-extraction';
import { processExtractedItemsForAssignment } from '@/lib/services/contractor-assignment';
import { processAssignmentsForSMS } from '@/lib/services/punch-list-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// WhatsApp webhook verification
async function verifyWebhook(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Check if the verification token matches
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('WhatsApp webhook verification failed');
  return new NextResponse('Verification failed', { status: 403 });
}

// Process incoming WhatsApp message
async function processWhatsAppMessage(messageData: any) {
  try {
    console.log('Processing WhatsApp message:', messageData);

    // Extract message details
    const {
      id: whatsappMessageId,
      from: senderPhone,
      type: messageType,
      voice,
      timestamp
    } = messageData;

    // Only process voice messages for F14A
    if (messageType !== 'voice') {
      console.log(`Ignoring non-voice message type: ${messageType}`);
      return;
    }

    if (!voice || !voice.id) {
      console.error('Voice message missing audio data');
      return;
    }

    // Map phone number to user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', senderPhone.replace(/^\+1/, '').replace(/\D/g, '')) // Clean phone for matching
      .single();

    if (profileError || !profile) {
      console.log(`Voice message from unknown number: ${senderPhone}`);
      // Could implement user registration flow here
      return;
    }

    // Find active project for this homeowner
    const { data: activeProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('homeowner_id', profile.id)
      .in('status', ['planning', 'contractor_selection', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (projectError || !activeProject) {
      console.log(`No active project found for user: ${profile.id}`);
      // Could send WhatsApp message asking to create a project
      return;
    }

    // Download voice message from WhatsApp
    const voiceUrl = await downloadWhatsAppVoiceMessage(voice.id);
    
    if (!voiceUrl) {
      console.error('Failed to download voice message from WhatsApp');
      return;
    }

    // Store voice message in database
    const { data: voiceMessage, error: voiceError } = await supabase
      .from('voice_messages')
      .insert({
        project_id: activeProject.id,
        sender_id: profile.id,
        whatsapp_message_id: whatsappMessageId,
        audio_url: voiceUrl,
        duration_seconds: voice.duration || 0,
        status: 'received'
      })
      .select()
      .single();

    if (voiceError) {
      console.error('Failed to store voice message:', voiceError);
      return;
    }

    console.log(`Stored voice message ${voiceMessage.id} for project ${activeProject.id}`);

    // Trigger the processing pipeline asynchronously
    // Note: In production, this would be better handled by a queue system
    setTimeout(async () => {
      try {
        console.log(`Starting pipeline for voice message ${voiceMessage.id}`);
        
        // Step 1: Transcribe voice message
        await processVoiceTranscription(voiceMessage.id);
        
        // Step 2: Extract punch list items
        await processTranscribedMessages(1);
        
        // Step 3: Assign contractors
        await processExtractedItemsForAssignment(5);
        
        // Step 4: Send SMS notifications
        await processAssignmentsForSMS(5);
        
        console.log(`Completed pipeline for voice message ${voiceMessage.id}`);
        
      } catch (pipelineError) {
        console.error(`Pipeline error for voice message ${voiceMessage.id}:`, pipelineError);
      }
    }, 1000);

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

// Download voice message file from WhatsApp
async function downloadWhatsAppVoiceMessage(voiceId: string): Promise<string | null> {
  try {
    // Get WhatsApp media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${voiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media info: ${mediaResponse.statusText}`);
    }

    const mediaData = await mediaResponse.json();
    const mediaUrl = mediaData.url;

    if (!mediaUrl) {
      throw new Error('No media URL found');
    }

    // Download the actual file
    const fileResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to download media: ${fileResponse.statusText}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    
    // Upload to Supabase storage
    const fileName = `voice-messages/${voiceId}-${Date.now()}.ogg`;
    
    const { data, error } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, fileBuffer, {
        contentType: 'audio/ogg'
      });

    if (error) {
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Error downloading WhatsApp voice message:', error);
    return null;
  }
}

// GET handler for webhook verification
export async function GET(request: NextRequest) {
  return verifyWebhook(request);
}

// POST handler for incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Store raw webhook event for debugging
    await supabase.from('whatsapp_webhook_events').insert({
      webhook_id: body.entry?.[0]?.id || `webhook_${Date.now()}`,
      event_type: body.object || 'message',
      phone_number: body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || 'unknown',
      raw_payload: body,
      processed: false
    });

    // Process each entry in the webhook
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value?.messages) {
              for (const message of change.value.messages) {
                await processWhatsAppMessage(message);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    
    // Return success to WhatsApp even on error to avoid retries
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse('WhatsApp webhook endpoint healthy', { status: 200 });
}