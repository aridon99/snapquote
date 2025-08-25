import { NextRequest, NextResponse } from 'next/server'
import analytics from '@/lib/services/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, event_data, session_id } = body

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      )
    }

    // Extract client information from headers
    const userAgent = request.headers.get('user-agent')
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') ||
                     'unknown'

    await analytics.trackEvent({
      event_type,
      event_data: event_data || {},
      session_id: session_id || request.headers.get('x-session-id'),
      user_agent: userAgent,
      ip_address: ipAddress
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (in a real app, you'd verify auth)
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' || 'day'

    const metrics = await analytics.getConversationMetrics(timeRange)

    if (!metrics) {
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Analytics metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}