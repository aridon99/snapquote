import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';
import { z } from 'zod';

// Validation schema for progressive onboarding signup (2 fields only)
const signupSchema = z.object({
  contact_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits'),
  // Optional fields for progressive enhancement
  business_name: z.string().optional(),
  trade: z.string().optional()
});

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS verification code (primary method for reliability)
async function sendSMSVerification(phone: string, code: string, contactName: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_SMS_NUMBER || '+18885551234';

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return false;
    }

    const client = twilio(accountSid, authToken);
    
    const message = `Your SnapQuote verification code: ${code}\n\nHi ${contactName}! Reply with this code to start creating professional quotes in minutes.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: `+1${phone}`
    });

    console.log(`SMS verification sent to +1${phone}: ${result.sid}`);
    return true;

  } catch (error) {
    console.error('Error sending SMS verification:', error);
    return false;
  }
}

// Send WhatsApp verification code (backup method)
async function sendWhatsAppVerification(phone: string, code: string, contactName: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return false;
    }

    const client = twilio(accountSid, authToken);
    
    // Format phone number for WhatsApp
    const toPhone = `whatsapp:+1${phone}`;
    
    const message = `🔐 Your SnapQuote verification code: ${code}\n\nHi ${contactName}!\n\nReply with this code to verify your account and try your first quote in under 2 minutes.\n\nNeed help? Just ask!`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toPhone
    });

    console.log(`WhatsApp verification sent to ${toPhone}: ${result.sid}`);
    return true;

  } catch (error) {
    console.error('Error sending WhatsApp verification:', error);
    return false;
  }
}

// POST handler for contractor signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      const validationResponse = NextResponse.json(
        { 
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
      return addCORSHeaders(validationResponse);
    }

    const { contact_name, phone, business_name = 'ABC Contractor Inc', trade = 'general' } = validationResult.data;

    // Initialize Supabase client
    const supabase = await createClient();

    // Check if phone number is already registered
    const { data: existingContractor } = await supabase
      .from('contractors')
      .select('id, business_name, whatsapp_verified')
      .eq('phone', phone)
      .single();

    if (existingContractor) {
      if (existingContractor.whatsapp_verified) {
        return NextResponse.json(
          {
            success: false,
            message: 'This phone number is already registered and verified.',
            action: 'login'
          },
          { status: 409 }
        );
      } else {
        // Resend verification code to existing contractor
        const newCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        const { error: updateError } = await supabase
          .from('contractors')
          .update({
            verification_code: newCode,
            verification_expires_at: expiresAt.toISOString(),
            business_name: business_name, // Update in case they changed it
            contact_name: contact_name,
            trade: trade
          })
          .eq('id', existingContractor.id);

        if (updateError) {
          console.error('Error updating existing contractor:', updateError);
          return NextResponse.json(
            { success: false, message: 'Database error occurred' },
            { status: 500 }
          );
        }

        // WhatsApp-only verification (SMS approval pending)
        const verificationSent = await sendWhatsAppVerification(phone, newCode, contact_name);
        const deliveryMethod = 'WhatsApp';
        
        if (!verificationSent) {
          return NextResponse.json(
            { success: false, message: 'Failed to send WhatsApp verification. Please check your phone number and try again.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Verification code sent via ${deliveryMethod}`,
          contractor: { id: existingContractor.id, contact_name, business_name },
          delivery_method: deliveryMethod,
          action: 'verify'
        });
      }
    }

    // Create new contractor record
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const { data: newContractor, error: createError } = await supabase
      .from('contractors')
      .insert({
        business_name,
        contact_name,
        phone,
        trade,
        verification_code: verificationCode,
        verification_expires_at: expiresAt.toISOString(),
        onboarding_status: 'pending',
        whatsapp_verified: false
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating contractor:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Create onboarding progress record
    await supabase
      .from('contractor_onboarding_progress')
      .insert({
        contractor_id: newContractor.id,
        phone_verified: false,
        invoices_uploaded: 0,
        items_extracted: 0,
        items_manually_added: 0,
        interview_questions_total: 0,
        interview_questions_answered: 0,
        google_sheet_connected: false,
        profile_complete: false
      });

    // WhatsApp-only verification (SMS approval pending)
    const verificationSent = await sendWhatsAppVerification(phone, verificationCode, contact_name);
    const deliveryMethod = 'WhatsApp';
    
    if (!verificationSent) {
      // Clean up the created contractor if WhatsApp fails
      await supabase
        .from('contractors')
        .delete()
        .eq('id', newContractor.id);

      return NextResponse.json(
        { success: false, message: 'Failed to send WhatsApp verification. Please check your phone number and try again.' },
        { status: 500 }
      );
    }

    // Log successful signup with progressive enhancement approach
    console.log(`New contractor signup: ${contact_name} (${phone}) - Generic branding for Quick Win`);

    const response = NextResponse.json({
      success: true,
      message: `Account created successfully! Check your phone for a verification code via ${deliveryMethod}.`,
      contractor: { id: newContractor.id, contact_name, business_name },
      delivery_method: deliveryMethod,
      action: 'verify'
    });
    
    return addCORSHeaders(response);

  } catch (error) {
    console.error('Contractor signup error:', error);
    
    // More detailed error logging for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
    
    return addCORSHeaders(errorResponse);
  }
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Add CORS headers to all responses
function addCORSHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}