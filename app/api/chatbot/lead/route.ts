import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendLeadNotifications } from '@/lib/services/notificationapi'

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  projectType: z.string().optional(),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
  conversationId: z.string().optional()
})


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the lead data
    const validatedLead = leadSchema.parse(body)
    
    // Store lead in database (implement with Supabase later)
    const leadRecord = {
      ...validatedLead,
      createdAt: new Date().toISOString(),
      source: 'chatbot',
      status: 'new'
    }
    
    // TODO: Save to Supabase
    console.log('Saving lead to database:', leadRecord)
    
    // Send notifications via NotificationAPI
    await sendLeadNotifications({
      name: leadRecord.name,
      phone: leadRecord.phone,
      email: leadRecord.email,
      projectType: leadRecord.projectType,
      notes: leadRecord.notes
    })
    
    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      leadId: `lead_${Date.now()}`
    })
    
  } catch (error) {
    console.error('Lead capture error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid lead data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    )
  }
}