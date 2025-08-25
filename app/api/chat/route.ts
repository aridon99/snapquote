import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renovationChatbot } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, projectId, threadId } = body

    if (!message || !projectId) {
      return NextResponse.json(
        { error: 'Message and project ID are required' },
        { status: 400 }
      )
    }

    // Get user's tenant info
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify project belongs to user's tenant
    const { data: project } = await supabase
      .from('projects')
      .select('id, tenant_id, chatbot_context')
      .eq('id', projectId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get or create thread ID
    let currentThreadId = threadId
    if (!currentThreadId) {
      // Check if project has existing chatbot context
      const existingContext = project.chatbot_context as any
      if (existingContext?.threadId) {
        currentThreadId = existingContext.threadId
      } else {
        // Create new thread
        currentThreadId = await renovationChatbot.createThread()
        
        // Save thread ID to project
        await supabase
          .from('projects')
          .update({
            chatbot_context: {
              ...existingContext,
              threadId: currentThreadId,
              createdAt: new Date().toISOString()
            }
          })
          .eq('id', projectId)
      }
    }

    // Add user message to thread
    await renovationChatbot.addMessage(currentThreadId, message, projectId)

    // Get assistant response
    const response = await renovationChatbot.runAssistant(currentThreadId, projectId)

    // Store conversation in messages table for audit trail
    await supabase.from('messages').insert([
      {
        project_id: projectId,
        tenant_id: profile.tenant_id,
        sender_id: user.id,
        content: message,
        sender_name: profile.role === 'admin' ? 'Admin' : 'Homeowner',
        mentions: [],
        is_action_item: false,
        is_read: true,
      },
      {
        project_id: projectId,
        tenant_id: profile.tenant_id,
        sender_id: 'system',
        content: response,
        sender_name: 'AI Assistant',
        mentions: [],
        is_action_item: false,
        is_read: false,
      }
    ])

    return NextResponse.json({
      response,
      threadId: currentThreadId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      )
    }

    // Get user's tenant info
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get chat messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Filter for AI assistant and user messages only
    const chatMessages = messages
      .filter(msg => msg.sender_name === 'AI Assistant' || msg.sender_id === user.id)
      .reverse() // Show chronological order

    return NextResponse.json({ messages: chatMessages })
  } catch (error) {
    console.error('Get chat history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}