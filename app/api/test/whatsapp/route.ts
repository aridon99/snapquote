import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to verify WhatsApp webhook integration
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'whatsapp-test',
    timestamp: new Date().toISOString(),
    webhook_url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/twilio',
    environment: process.env.NODE_ENV,
    message: 'WhatsApp Punch List Bot is ready!'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Echo back the request for testing
    return NextResponse.json({
      message: 'Test endpoint received your request',
      received_data: body,
      timestamp: new Date().toISOString(),
      next_step: 'Configure Twilio webhook to point to /api/webhooks/twilio'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid JSON',
      message: 'Please send valid JSON in request body'
    }, { status: 400 })
  }
}