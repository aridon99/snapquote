import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { messageSchema } from '@/lib/utils/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = params.id
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or contractor on this project
    const isHomeowner = project.homeowner_id === user.id
    let isContractor = false
    
    if (!isHomeowner) {
      const { data: contractorAccess } = await supabase
        .from('project_contractors')
        .select('contractor_id')
        .eq('project_id', projectId)
        .eq('contractor_id', user.id)
        .single()
      
      isContractor = !!contractorAccess
    }
    
    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get messages with sender profiles
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id,
          full_name,
          role,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ messages })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const projectId = params.id
    
    // Validate message data
    const validationResult = messageSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }
    
    const { content, is_action_item, mentions } = validationResult.data
    
    const supabase = await createClient()
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or contractor on this project
    const isHomeowner = project.homeowner_id === user.id
    let isContractor = false
    
    if (!isHomeowner) {
      const { data: contractorAccess } = await supabase
        .from('project_contractors')
        .select('contractor_id')
        .eq('project_id', projectId)
        .eq('contractor_id', user.id)
        .single()
      
      isContractor = !!contractorAccess
    }
    
    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        content,
        mentions: mentions || [],
        is_action_item: is_action_item || false,
        is_read: false
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id,
          full_name,
          role,
          avatar_url
        )
      `)
      .single()
    
    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }
    
    // TODO: Send real-time notification
    // TODO: Send email/SMS notifications if mentioned
    // TODO: Update project last_activity timestamp
    
    return NextResponse.json({
      message: 'Message sent successfully',
      data: message
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}