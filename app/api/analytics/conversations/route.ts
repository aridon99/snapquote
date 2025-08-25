import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' || 'day'

    const supabase = await createClient()
    
    const startDate = new Date()
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    // Get analytics events for conversation metrics
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('event_type, event_data')
      .eq('event_type', 'chatbot_message_exchange')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Failed to get conversation analytics:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve conversation metrics' },
        { status: 500 }
      )
    }

    // Process the data
    const byCategory: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    const byUrgency: Record<string, number> = {}
    const byLeadQuality: Record<string, number> = {}

    events.forEach(event => {
      const data = event.event_data

      // Category breakdown
      const category = data.category || 'general'
      byCategory[category] = (byCategory[category] || 0) + 1

      // Urgency breakdown
      const urgency = data.urgency || 'exploring'
      byUrgency[urgency] = (byUrgency[urgency] || 0) + 1

      // Lead quality breakdown
      const leadQuality = data.leadQuality || 'low'
      byLeadQuality[leadQuality] = (byLeadQuality[leadQuality] || 0) + 1

      // Source (for now just chatbot, but could include web, email, etc.)
      bySource['chatbot'] = (bySource['chatbot'] || 0) + 1
    })

    return NextResponse.json({
      byCategory,
      bySource,
      byUrgency,
      byLeadQuality,
      totalEvents: events.length,
      timeRange,
      periodStart: startDate.toISOString(),
      periodEnd: new Date().toISOString()
    })

  } catch (error) {
    console.error('Conversation analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve conversation metrics' },
      { status: 500 }
    )
  }
}