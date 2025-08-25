import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isMilestoneStatus, isMilestoneType } from '@/types/milestones'

// GET /api/projects/[id]/milestones - Get all milestones for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = id
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id, assigned_contractor_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or assigned contractor
    if (project.homeowner_id !== user.id && project.assigned_contractor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get milestones
    const { data: milestones, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ milestones })
    
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/milestones - Create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  const { id } = await params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = id
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id, assigned_contractor_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or assigned contractor
    if (project.homeowner_id !== user.id && project.assigned_contractor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const body = await request.json()
    const { title, description, due_date, type, amount, assigned_to, dependencies } = body
    
    // Validate required fields
    if (!title || !description || !due_date || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate milestone type
    if (!isMilestoneType(type)) {
      return NextResponse.json(
        { error: 'Invalid milestone type' },
        { status: 400 }
      )
    }
    
    // Create milestone
    const { data: milestone, error } = await supabase
      .from('milestones')
      .insert({
        project_id: projectId,
        title,
        description,
        due_date,
        type,
        amount: amount ? parseFloat(amount) : null,
        assigned_to,
        dependencies
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ milestone }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}