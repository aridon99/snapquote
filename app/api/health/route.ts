import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Health check endpoint to verify all services are working
export async function GET(request: NextRequest) {
  try {
    const checks = {
      api: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      supabase: false,
      twilio: false,
      openai: false
    };

    // Check Supabase connection
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('contractors').select('count').limit(1);
      checks.supabase = !error;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      checks.supabase = false;
    }

    // Check Twilio credentials (WhatsApp only for now)
    checks.twilio = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    );

    // Check OpenAI credentials
    checks.openai = !!process.env.OPENAI_API_KEY;

    const allHealthy = checks.supabase && checks.twilio && checks.openai;
    
    const response = NextResponse.json({
      success: allHealthy,
      message: allHealthy ? 'All services healthy' : 'Some services have issues',
      checks: checks,
      missing_env_vars: [
        ...(checks.twilio ? [] : ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER']),
        ...(checks.openai ? [] : ['OPENAI_API_KEY']),
        ...(checks.supabase ? [] : ['SUPABASE credentials'])
      ]
    }, { 
      status: allHealthy ? 200 : 503 
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
