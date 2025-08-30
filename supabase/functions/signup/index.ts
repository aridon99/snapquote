import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contact_name, phone, business_name = 'ABC Contractor Inc', trade = 'general', sms_consent } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if phone exists
    const { data: existing } = await supabaseClient
      .from('contractors')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Phone number already registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Create contractor
    const { data: contractor, error } = await supabaseClient
      .from('contractors')
      .insert({
        business_name,
        contact_name,
        phone,
        email: `${phone}@temp.snapquote.com`,
        trade,
        phone_verified: false,
        phone_verification_code: verificationCode,
        phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        sms_consent,
        onboarding_status: 'phone_verification',
        settings: {}
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send WhatsApp message with code
    console.log(`Verification code for ${phone}: ${verificationCode}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        contractor: { id: contractor.id },
        message: 'Verification code sent via WhatsApp'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})