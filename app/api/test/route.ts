import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify API is working
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'API is working correctly!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
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
        error: error.message 
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