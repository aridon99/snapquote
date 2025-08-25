import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import notificationService from '@/lib/services/notifications'
import analytics from '@/lib/services/analytics'

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json()
    
    // Validate required fields
    const { name, email, phone, source } = leadData
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, email')
      .eq('email', email)
      .single()

    let leadId: string

    if (existingLead) {
      // Update existing lead
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
          name,
          phone,
          preferred_time: leadData.preferredTime,
          project_type: leadData.projectType,
          project_details: leadData.projectDetails,
          budget_range: leadData.budget,
          timeline: leadData.timeline,
          address: leadData.address,
          source: source || 'chatbot',
          updated_at: new Date().toISOString(),
          notes: `Updated via ${source || 'chatbot'} on ${new Date().toISOString()}`
        })
        .eq('id', existingLead.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating lead:', updateError)
        return NextResponse.json(
          { error: 'Failed to update lead information' },
          { status: 500 }
        )
      }

      leadId = updatedLead.id
    } else {
      // Create new lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          name,
          email,
          phone,
          preferred_time: leadData.preferredTime || 'afternoon',
          project_type: leadData.projectType,
          project_details: leadData.projectDetails,
          budget_range: leadData.budget,
          timeline: leadData.timeline,
          address: leadData.address,
          source: source || 'chatbot',
          status: 'new',
          lead_quality: determineLeadQuality(leadData),
          notes: `Lead captured via ${source || 'chatbot'} on ${new Date().toISOString()}`
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating lead:', insertError)
        return NextResponse.json(
          { error: 'Failed to save lead information' },
          { status: 500 }
        )
      }

      leadId = newLead.id
    }

    // Send notifications (fire and forget)
    const leadWithMetadata = {
      ...leadData,
      lead_quality: determineLeadQuality(leadData),
      urgency: determineUrgency(leadData)
    }
    
    notificationService.notifyNewLead(leadWithMetadata, leadId).catch(error => {
      console.error('Failed to send lead notifications:', error)
    })

    // Track lead capture in analytics
    const sessionId = request.headers.get('x-session-id') || 'anonymous'
    analytics.trackLeadCapture(leadId, sessionId, undefined, leadData.source).catch(error => {
      console.error('Failed to track lead capture:', error)
    })

    // Log analytics event
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'lead_captured',
        event_data: {
          leadId,
          source: source || 'chatbot',
          projectType: leadData.projectType,
          leadQuality: determineLeadQuality(leadData)
        },
        session_id: request.headers.get('x-session-id') || 'anonymous',
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead information saved successfully'
    })

  } catch (error) {
    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function determineLeadQuality(leadData: any): 'hot' | 'warm' | 'cold' {
  let score = 0
  
  // Project details provided
  if (leadData.projectDetails && leadData.projectDetails.length > 20) score += 2
  
  // Budget specified
  if (leadData.budget) score += 2
  
  // Timeline specified
  if (leadData.timeline) score += 1
  
  // Address provided
  if (leadData.address) score += 1
  
  // Project type specified
  if (leadData.projectType) score += 1
  
  // Specific timing preference
  if (leadData.preferredTime && leadData.preferredTime !== 'afternoon') score += 1

  if (score >= 5) return 'hot'
  if (score >= 3) return 'warm'
  return 'cold'
}

function determineUrgency(leadData: any): 'immediate' | 'planning' | 'exploring' {
  const details = (leadData.projectDetails || '').toLowerCase()
  const timeline = (leadData.timeline || '').toLowerCase()
  
  if (details.includes('urgent') || details.includes('asap') || timeline.includes('immediately')) {
    return 'immediate'
  }
  
  if (timeline.includes('month') || timeline.includes('weeks') || details.includes('planning')) {
    return 'planning'
  }
  
  return 'exploring'
}

