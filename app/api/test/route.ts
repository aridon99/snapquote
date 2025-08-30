import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify API is working
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'API is working correctly! (Fix #12)',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        twilio_sid: !!process.env.TWILIO_ACCOUNT_SID,
        twilio_auth: !!process.env.TWILIO_AUTH_TOKEN
      }
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Test API error:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: 'Test API failed',
        error: error instanceof Error ? error.message : String(error)
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