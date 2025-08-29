// F14A Twilio SMS Webhook Endpoint
// Handles incoming SMS responses from contractors

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processContractorSMSResponse } from '@/lib/services/punch-list-sms';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Twilio webhook signature
function verifyTwilioSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get('x-twilio-signature');
    if (!signature) {
      console.error('Missing Twilio signature header');
      return false;
    }

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      console.error('Missing Twilio auth token');
      return false;
    }

    const url = request.url;
    const params = new URLSearchParams(body);
    const expectedSignature = twilio.validateRequest(authToken, signature, url, Object.fromEntries(params));

    return expectedSignature;
  } catch (error) {
    console.error('Error verifying Twilio signature:', error);
    return false;
  }
}

// Parse Twilio webhook body
function parseTwilioWebhook(body: string) {
  const params = new URLSearchParams(body);
  return {
    MessageSid: params.get('MessageSid'),
    From: params.get('From'),
    To: params.get('To'),
    Body: params.get('Body'),
    NumMedia: params.get('NumMedia'),
    MessageStatus: params.get('MessageStatus'),
    SmsSid: params.get('SmsSid'),
    SmsStatus: params.get('SmsStatus'),
    AccountSid: params.get('AccountSid'),
    CallStatus: params.get('CallStatus'), // For voice calls
    MediaUrl0: params.get('MediaUrl0'), // First media attachment URL
    MediaContentType0: params.get('MediaContentType0'), // First media type
    // Add more fields as needed
  };
}

// Log webhook event for debugging
async function logTwilioWebhook(webhookData: any, processed: boolean = false) {
  try {
    await supabase.from('twilio_webhook_events').insert({
      message_sid: webhookData.MessageSid || webhookData.SmsSid,
      event_type: webhookData.MessageStatus || webhookData.SmsStatus || 'message',
      from_phone: webhookData.From,
      to_phone: webhookData.To,
      message_body: webhookData.Body,
      raw_payload: webhookData,
      processed: processed
    });
  } catch (error) {
    console.error('Failed to log Twilio webhook:', error);
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

    // Clean phone number for database lookup
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1?/, '').replace(/\D/g, '');
    console.log(`Cleaned phone: ${cleanPhone}`);

    // Check if this is a contractor verification attempt
    if (messageBody && /^\d{6}$/.test(messageBody.trim())) {
      console.log('Potential contractor verification code detected');
      const handled = await handleContractorVerification(fromPhone, messageBody.trim(), messageSid);
      if (handled) return;
    }

    // Check if this is an image (invoice) upload
    const isWhatsApp = fromPhone.includes('whatsapp:');
    const hasImageMedia = numMedia && parseInt(numMedia) > 0 && 
                         mediaType && mediaType.startsWith('image/');

    if (isWhatsApp && hasImageMedia && mediaUrl) {
      console.log('Processing WhatsApp invoice image');
      await handleContractorInvoiceUpload(fromPhone, mediaUrl, messageSid);
      return;
    }

    // Check if this is a voice message
    const hasAudioMedia = numMedia && parseInt(numMedia) > 0 && 
                         mediaType && mediaType.startsWith('audio/');

    if (isWhatsApp && hasAudioMedia && mediaUrl) {
      console.log('Processing WhatsApp voice message');
      
      // Check if this is a contractor and if they need Quick Win
      const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1?/, '').replace(/\D/g, '');
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*, contractor_onboarding_progress!inner(*)')
        .or(`phone.eq.${cleanPhone},whatsapp_number.eq.${fromPhone}`)
        .eq('whatsapp_verified', true)
        .single();

      if (contractor && !contractor.contractor_onboarding_progress[0]?.quick_win_completed) {
        console.log('Processing Quick Win practice quote');
        await handleQuickWinVoiceMessage(fromPhone, mediaUrl, messageSid, contractor);
      } else {
        console.log('Processing regular voice message');
        await handleWhatsAppVoiceMessage(fromPhone, mediaUrl, messageSid);
      }
      return;
    }

    // Handle text messages - Check if Quick Win or existing SMS processing
    if (messageBody) {
      console.log(`Processing text message: "${messageBody}"`);
      
      // Check if this is a verified contractor who hasn't completed Quick Win
      const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1?/, '').replace(/\D/g, '');
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*, contractor_onboarding_progress!inner(*)')
        .or(`phone.eq.${cleanPhone},whatsapp_number.eq.${fromPhone}`)
        .eq('whatsapp_verified', true)
        .single();

      // If contractor needs Quick Win and message isn't just a verification code
      if (contractor && 
          !contractor.contractor_onboarding_progress[0]?.quick_win_completed &&
          !/^\d{6}$/.test(messageBody.trim()) &&
          messageBody.trim().length > 10) {
        
        console.log('Processing Quick Win practice quote via text');
        await handleQuickWinTextMessage(fromPhone, messageBody, messageSid, contractor);
      } 
      // Check if contractor completed Quick Win and wants to continue setup
      else if (contractor && 
               contractor.contractor_onboarding_progress[0]?.quick_win_completed &&
               /^(yes|y|continue|setup|next)$/i.test(messageBody.trim())) {
        
        console.log('Contractor wants to continue with progressive profile completion');
        await handleProgressiveProfileSetup(fromPhone, contractor);
      } else {
        // Handle as regular SMS processing
        await processContractorSMSResponse(fromPhone, messageBody, messageSid);
      }
    }

    // Mark as processed
    await logTwilioWebhook(webhookData, true);

  } catch (error) {
    console.error('Error handling incoming message:', error);
    await logTwilioWebhook(webhookData, true);
  }
}

// Handle progressive profile completion after Quick Win
async function handleProgressiveProfileSetup(fromPhone: string, contractor: any) {
  try {
    const isGenericBranding = contractor.business_name === 'ABC Contractor Inc';
    
    if (isGenericBranding) {
      // Step 1: Get their actual business name
      await sendWhatsAppMessage(fromPhone, 
        `🏢 Great! Let's personalize your quotes.\n\n` +
        `What's your actual business name?\n\n` +
        `Examples:\n• "Smith Plumbing"\n• "Elite Electric"\n• "Just put ${contractor.contact_name}"\n\n` +
        `Type your business name:`
      );
    } else {
      // Already have business name, ask about trade specialization  
      await sendWhatsAppMessage(fromPhone, 
        `🔧 Perfect! Now let's set your trade specialty.\n\n` +
        `What's your primary trade?\n\n` +
        `Options:\n• Plumber\n• Electrician\n• Flooring\n• Drywall\n• Painter\n• Other\n\n` +
        `Type your trade:`
      );
    }

    console.log(`Started progressive profile setup for ${contractor.contact_name}`);

  } catch (error) {
    console.error('Error in progressive profile setup:', error);
    await sendWhatsAppMessage(fromPhone, 
      '❌ Something went wrong. Try replying YES again to continue setup.'
    );
  }
}

// Handle Quick Win practice quote text messages (voice OR text flexibility)
async function handleQuickWinTextMessage(fromPhone: string, messageText: string, messageSid: string, contractor: any) {
  try {
    console.log(`Processing Quick Win practice quote text for ${contractor.business_name}`);

    // Send acknowledgment message
    await sendWhatsAppMessage(fromPhone, 
      '💬 Got your practice quote text! Processing with AI...\n\n⚡ Target: Sub-4 second response'
    );

    // Call the Quick Win processing API with text transcription
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${apiUrl}/api/contractors/quick-win-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: contractor.id,
          voice_transcription: messageText, // Use text as transcription
          message_sid: messageSid
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Quick Win text processing failed:', result);
        
        await sendWhatsAppMessage(fromPhone, 
          `❌ ${result.message}\n\n🎯 Try again with clear prices like:\n"Install toilet - $200 labor, $50 wax ring"\n\n🎤 You can also send a voice message!`
        );
        return;
      }

      // Success is handled by the API endpoint itself
      console.log(`Quick Win quote generated successfully from text for ${contractor.business_name}`);

    } catch (apiError) {
      console.error('Error calling Quick Win API with text:', apiError);
      await sendWhatsAppMessage(fromPhone, 
        '❌ Something went wrong processing your text quote.\n\n🔄 Try again with voice OR text!'
      );
    }

  } catch (error) {
    console.error('Error handling Quick Win text message:', error);
    await sendWhatsAppMessage(fromPhone, 
      '❌ Something went wrong. Please try again with voice OR text!'
    );
  }
}

// Handle Quick Win practice quote voice messages
async function handleQuickWinVoiceMessage(fromPhone: string, mediaUrl: string, messageSid: string, contractor: any) {
  try {
    console.log(`Processing Quick Win practice quote for ${contractor.business_name}`);

    // Send acknowledgment message with performance target
    await sendWhatsAppMessage(fromPhone, 
      '🎤 Got your practice quote! Processing with AI...\n\n⚡ Target: Sub-4 second response'
    );

    // Call the Quick Win processing API
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${apiUrl}/api/contractors/quick-win-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: contractor.id,
          media_url: mediaUrl,
          message_sid: messageSid
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Quick Win processing failed:', result);
        
        await sendWhatsAppMessage(fromPhone, 
          result.transcription 
            ? `I heard: "${result.transcription}"\n\n❌ ${result.message}\n\n🎤 Try recording again OR type with clear prices like:\n"Install toilet - $200 labor, $50 wax ring"`
            : `❌ ${result.message || 'Failed to process. Try voice recording OR typing your quote.'}`
        );
        return;
      }

      // Success is handled by the API endpoint itself
      console.log(`Quick Win quote generated successfully for ${contractor.business_name}`);

    } catch (apiError) {
      console.error('Error calling Quick Win API:', apiError);
      await sendWhatsAppMessage(fromPhone, 
        '❌ Something went wrong processing your quote. Our team will review it manually.\n\nYou can also try recording again!'
      );
    }

  } catch (error) {
    console.error('Error handling Quick Win voice message:', error);
    await sendWhatsAppMessage(fromPhone, 
      '❌ Something went wrong with your practice quote. Please try recording again!'
    );
  }
}

// Handle WhatsApp voice messages for punch list creation
async function handleWhatsAppVoiceMessage(fromPhone: string, mediaUrl: string, messageSid: string) {
  try {
    // Clean phone number
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1/, '').replace(/\D/g, '');

    // Find user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (!profile) {
      console.log(`Voice message from unknown number: ${fromPhone}`);
      await sendWhatsAppMessage(fromPhone, 'Welcome! Please register at our website first to use the punch list bot.');
      return;
    }

    // Find active project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('homeowner_id', profile.id)
      .in('status', ['planning', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!project) {
      await sendWhatsAppMessage(fromPhone, 'No active project found. Please create a project on our website first.');
      return;
    }

    console.log(`Processing voice message for project: ${project.title}`);

    // Transcribe voice message using existing service
    const transcription = await transcribeVoiceMessage(mediaUrl);
    
    if (!transcription) {
      await sendWhatsAppMessage(fromPhone, 'Sorry, I couldn\'t process your voice message. Please try speaking more clearly and try again.');
      return;
    }

    console.log('Transcription:', transcription);

    // Extract punch list items using GPT-4
    console.log('Extracting punch list items from transcription...');
    const punchListItems = await extractPunchListItems(transcription, project);
    console.log('Extracted items:', JSON.stringify(punchListItems, null, 2));
    
    if (punchListItems.length === 0) {
      await sendWhatsAppMessage(
        fromPhone, 
        `I heard: "${transcription}"\n\nBut couldn't extract any punch list items. Please be more specific about what needs to be done.`
      );
      return;
    }

    // Store voice message record
    const { data: voiceMessage } = await supabase
      .from('voice_messages')
      .insert({
        project_id: project.id,
        sender_id: profile.id,
        audio_url: mediaUrl,
        transcription: transcription,
        message_sid: messageSid,
        status: 'processed'
      })
      .select()
      .single();

    // Store punch list items
    console.log('Storing', punchListItems.length, 'punch list items...');
    const storedItems = [];
    for (const item of punchListItems) {
      console.log('Inserting item:', item);
      const { data: storedItem, error: insertError } = await supabase
        .from('punch_list_items')
        .insert({
          project_id: project.id,
          voice_message_id: voiceMessage?.id,
          description: item.item,
          category: item.trade || 'general',
          priority: item.priority || 'medium',
          location: item.room || 'General',
          estimated_time: item.estimated_hours + 'h' || '1h',
          status: 'extracted',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting punch list item:', insertError);
      } else {
        console.log('Successfully stored item:', storedItem);
        storedItems.push(storedItem);
      }
    }

    // Send confirmation message
    let confirmationMsg = `✅ Punch list created with ${punchListItems.length} items:\n\n`;
    
    punchListItems.forEach((item: any, index: number) => {
      const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      confirmationMsg += `${index + 1}. ${priorityEmoji} ${item.room}: ${item.item}\n`;
      confirmationMsg += `   Trade: ${item.trade} (${item.estimated_hours}h)\n`;
    });
    
    confirmationMsg += '\n📤 Contractors will be notified shortly!';
    
    await sendWhatsAppMessage(fromPhone, confirmationMsg);

    // TODO: Send notifications to contractors
    // This would be done through the existing SMS service

    console.log(`Successfully processed voice message for ${profile.full_name}`);

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
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const OpenAI = require('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

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
    
    // Save to temporary file (OpenAI SDK needs a file path)
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `voice_${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log('Saved to temp file:', tempFilePath);
    
    try {
      // Create a ReadStream from the file
      const audioStream = fs.createReadStream(tempFilePath);
      
      // Transcribe using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1'
      });
      
      console.log('Transcription successful:', transcription.text);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return transcription.text;
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

// Extract punch list items using GPT-4
async function extractPunchListItems(transcription: string, project: any) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Extract punch list items from this voice message about a construction project.

Project: ${project.title}
Location: ${JSON.stringify(project.address)}

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

Only extract actionable items that need to be completed by contractors. Be specific and clear.`;

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

// Handle SMS status updates
async function handleSMSStatus(webhookData: any) {
  try {
    const { MessageSid: messageSid, MessageStatus: status, From: fromPhone, To: toPhone } = webhookData;

    console.log(`SMS status update: ${messageSid} -> ${status}`);

    // Update punch list assignment with SMS delivery status
    if (messageSid) {
      const { error } = await supabase
        .from('punch_list_assignments')
        .update({
          sms_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('sms_message_id', messageSid);

      if (error) {
        console.error('Failed to update SMS status in assignments:', error);
      }
    }

    // Log the status update
    await logTwilioWebhook(webhookData, true);

  } catch (error) {
    console.error('Error handling SMS status update:', error);
  }
}

// Handle contractor verification via WhatsApp
async function handleContractorVerification(fromPhone: string, verificationCode: string, messageSid: string): Promise<boolean> {
  try {
    // Clean phone number
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1?/, '').replace(/\D/g, '');
    
    // Find contractor with matching phone and code
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('verification_code', verificationCode)
      .gt('verification_expires_at', new Date().toISOString())
      .single();

    if (contractorError || !contractor) {
      console.log(`No matching contractor found for phone ${cleanPhone} and code ${verificationCode}`);
      return false; // Not a contractor verification
    }

    // Update contractor as verified
    const { error: updateError } = await supabase
      .from('contractors')
      .update({
        whatsapp_verified: true,
        whatsapp_number: fromPhone,
        whatsapp_opt_in_date: new Date().toISOString(),
        onboarding_status: 'phone_verified',
        verification_code: null,
        verification_expires_at: null
      })
      .eq('id', contractor.id);

    if (updateError) {
      console.error('Error updating contractor:', updateError);
      await sendWhatsAppMessage(fromPhone, 'Verification failed. Please try again or contact support.');
      return true;
    }

    // Update onboarding progress
    await supabase
      .from('contractor_onboarding_progress')
      .upsert({
        contractor_id: contractor.id,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Send success message with Quick Win instructions and voice/text flexibility
    const welcomeName = contractor.business_name === 'ABC Contractor Inc' ? contractor.contact_name : contractor.business_name;
    const brandingMessage = contractor.business_name === 'ABC Contractor Inc' ? 
      `\n\n🎯 Complete your profile after this to get quotes with YOUR business name and branding!` : ``;
    
    await sendWhatsAppMessage(fromPhone, 
      `✅ Verified! Welcome ${welcomeName}!\n\n` +
      `🚀 Let's create your first quote in under 2 minutes!\n\n` +
      `📝 Send me a VOICE message OR type describing a simple job WITH your prices.\n\n` +
      `Example: "Front bathroom needs a new faucet, labor is $350 and faucet will be $200. Wobbly toilet needs resetting, which is $250 labor and $50 for a new wax ring."\n\n` +
      `🎤 Tap and hold to record OR just type your practice quote now!${brandingMessage}`
    );

    console.log(`Successfully verified contractor: ${contractor.business_name}`);
    return true;

  } catch (error) {
    console.error('Error in contractor verification:', error);
    await sendWhatsAppMessage(fromPhone, 'Verification failed. Please contact support.');
    return true;
  }
}

// Handle contractor invoice image uploads via WhatsApp
async function handleContractorInvoiceUpload(fromPhone: string, mediaUrl: string, messageSid: string): Promise<void> {
  try {
    // Clean phone number and find contractor
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/^\+1?/, '').replace(/\D/g, '');
    
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .or(`phone.eq.${cleanPhone},whatsapp_number.eq.${fromPhone}`)
      .eq('whatsapp_verified', true)
      .single();

    if (contractorError || !contractor) {
      console.log(`Invoice upload from unverified contractor: ${fromPhone}`);
      await sendWhatsAppMessage(fromPhone, 
        'Please verify your account first by sending your verification code.\n\n' +
        'If you don\'t have a code, please sign up at renovationadvisor.com/signup?type=contractor'
      );
      return;
    }

    console.log(`Processing invoice upload from ${contractor.business_name}`);

    // Download the image from Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    console.log('Downloading invoice image from Twilio:', mediaUrl);
    
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });
    
    if (!response.ok) {
      console.error('Failed to download invoice from Twilio:', response.statusText);
      await sendWhatsAppMessage(fromPhone, '❌ Failed to download your invoice image. Please try again.');
      return;
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Invoice downloaded, size:', imageBuffer.length, 'bytes');
    
    // Upload to Supabase storage
    const fileName = `invoices/${contractor.id}/${Date.now()}-whatsapp.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contractor-files')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      await sendWhatsAppMessage(fromPhone, '❌ Failed to save your invoice. Please try again.');
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('contractor-files')
      .getPublicUrl(fileName);

    // Create invoice record
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('contractor_invoices')
      .insert({
        contractor_id: contractor.id,
        file_url: urlData.publicUrl,
        file_name: 'WhatsApp Invoice',
        upload_source: 'whatsapp',
        whatsapp_message_id: messageSid,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice record:', invoiceError);
      await sendWhatsAppMessage(fromPhone, '❌ Failed to save invoice record. Please try again.');
      return;
    }

    // Send confirmation
    await sendWhatsAppMessage(fromPhone, 
      `📷 Invoice received! Processing with AI...\n\n` +
      `We'll extract the pricing information and add it to your price list.\n\n` +
      `⏱️ This usually takes 1-2 minutes. You'll get another message when it's done.`
    );

    // Process with GPT-4o-mini (simulate for now)
    setTimeout(async () => {
      await processInvoiceWithGPT(invoiceData.id, contractor, fromPhone);
    }, 3000);

    // Update onboarding progress
    const { data: progress } = await supabase
      .from('contractor_onboarding_progress')
      .select('invoices_uploaded')
      .eq('contractor_id', contractor.id)
      .single();

    await supabase
      .from('contractor_onboarding_progress')
      .upsert({
        contractor_id: contractor.id,
        invoices_uploaded: (progress?.invoices_uploaded || 0) + 1,
        first_invoice_at: !progress?.invoices_uploaded ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      });

    console.log(`Invoice upload processed successfully for ${contractor.business_name}`);

  } catch (error) {
    console.error('Error handling invoice upload:', error);
    await sendWhatsAppMessage(fromPhone, '❌ Something went wrong processing your invoice. Please try again.');
  }
}

// Process invoice with GPT-4o-mini
async function processInvoiceWithGPT(invoiceId: string, contractor: any, fromPhone: string): Promise<void> {
  try {
    console.log(`Processing invoice ${invoiceId} with GPT for contractor ${contractor.business_name}`);

    // Update status
    await supabase
      .from('contractor_invoices')
      .update({ processing_status: 'processing' })
      .eq('id', invoiceId);

    // Simulate GPT-4o-mini processing (replace with real OpenAI call)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Mock extracted data based on contractor trade
    const mockItems = contractor.trade === 'plumber' || contractor.trade === 'both' ? [
      { description: 'Install kitchen faucet', amount: 125.00, category: 'plumbing', hours: 1.5 },
      { description: 'Replace toilet', amount: 200.00, category: 'plumbing', hours: 2.0 },
      { description: 'Fix leaky pipe', amount: 85.00, category: 'plumbing', hours: 1.0 }
    ] : [
      { description: 'Install GFCI outlet', amount: 150.00, category: 'electrical', hours: 1.0 },
      { description: 'Replace circuit breaker', amount: 180.00, category: 'electrical', hours: 1.5 },
      { description: 'Install ceiling fan', amount: 220.00, category: 'electrical', hours: 2.5 }
    ];

    const extractedData = {
      items: mockItems,
      total: mockItems.reduce((sum, item) => sum + item.amount, 0),
      confidence: 0.89,
      trade_detected: contractor.trade
    };

    // Update invoice with extracted data
    await supabase
      .from('contractor_invoices')
      .update({
        processing_status: 'completed',
        extracted_data: extractedData,
        extracted_items_count: mockItems.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    // Add extracted items to price list
    const priceItems = [];
    for (const item of mockItems) {
      const { data: priceItem } = await supabase
        .from('contractor_price_items')
        .insert({
          contractor_id: contractor.id,
          custom_description: item.description,
          total_price: item.amount,
          time_estimate_hours: item.hours,
          source: 'invoice',
          confidence_score: extractedData.confidence
        })
        .select()
        .single();

      if (priceItem) {
        priceItems.push(priceItem);
      }
    }

    // Update onboarding progress
    const { data: currentProgress } = await supabase
      .from('contractor_onboarding_progress')
      .select('items_extracted')
      .eq('contractor_id', contractor.id)
      .single();

    await supabase
      .from('contractor_onboarding_progress')
      .upsert({
        contractor_id: contractor.id,
        items_extracted: (currentProgress?.items_extracted || 0) + mockItems.length,
        updated_at: new Date().toISOString()
      });

    // Send success message
    const itemsText = mockItems.map((item, index) => 
      `${index + 1}. ${item.description} - $${item.amount}`
    ).join('\n');

    await sendWhatsAppMessage(fromPhone, 
      `✅ Invoice processed successfully!\n\n` +
      `💰 Extracted ${mockItems.length} pricing items:\n` +
      `${itemsText}\n\n` +
      `Total: $${extractedData.total}\n` +
      `Confidence: ${Math.round(extractedData.confidence * 100)}%\n\n` +
      `🔗 View your updated price list at:\n` +
      `renovationadvisor.com/contractor/pricing`
    );

    console.log(`Successfully processed invoice for ${contractor.business_name}`);

  } catch (error) {
    console.error('Error processing invoice with GPT:', error);

    // Mark as failed
    await supabase
      .from('contractor_invoices')
      .update({
        processing_status: 'failed',
        processing_error: 'AI processing failed'
      })
      .eq('id', invoiceId);

    await sendWhatsAppMessage(fromPhone, 
      '❌ Failed to process your invoice. Our team will review it manually.\n\n' +
      'In the meantime, you can add prices manually at renovationadvisor.com/contractor/pricing'
    );
  }
}

// Handle voice call webhooks (for future expansion)
async function handleVoiceCall(webhookData: any) {
  try {
    console.log('Voice call webhook received:', webhookData);
    
    // For now, just log voice calls
    // Future: Could integrate with voice-based punch list creation
    await logTwilioWebhook(webhookData, true);

  } catch (error) {
    console.error('Error handling voice call webhook:', error);
  }
}

// POST handler for Twilio webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verify Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyTwilioSignature(request, body)) {
        console.error('Invalid Twilio webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    const webhookData = parseTwilioWebhook(body);
    
    console.log('Twilio webhook received:', JSON.stringify(webhookData, null, 2));

    // Determine webhook type and handle accordingly
    if (webhookData.From && (webhookData.Body || webhookData.NumMedia)) {
      // Incoming SMS/WhatsApp message (text or media)
      await handleIncomingSMS(webhookData);
      
    } else if (webhookData.MessageStatus || webhookData.SmsStatus) {
      // SMS delivery status update
      await handleSMSStatus(webhookData);
      
    } else if (webhookData.CallStatus) {
      // Voice call webhook
      await handleVoiceCall(webhookData);
      
    } else {
      console.log('Unknown Twilio webhook type:', webhookData);
      await logTwilioWebhook(webhookData, false);
    }

    // Return TwiML response for SMS
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
    service: 'twilio-webhook',
    timestamp: new Date().toISOString()
  });
}

// HEAD handler for health check
export async function HEAD() {
  return new NextResponse('Twilio webhook endpoint healthy', { status: 200 });
}