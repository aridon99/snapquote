import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isMilestoneStatus, isMilestoneType } from '@/types/milestones'

// GET /api/milestones/[id] - Get a specific milestone
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const milestoneId = params.id
    
    // Get milestone with project info to check permissions
    const { data: milestone, error } = await supabase
      .from('milestones')
      .select(`
        *,
        project:projects(homeowner_id, assigned_contractor_id)
      `)
      .eq('id', milestoneId)
      .single()
    
    if (error || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }
    
    // Check if user has access to this milestone's project
    const project = milestone.project as any
    if (project.homeowner_id !== user.id && project.assigned_contractor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    return NextResponse.json({ milestone })
    
  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

// PUT /api/milestones/[id] - Update a milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const milestoneId = params.id
    
    // Get milestone with project info to check permissions
    const { data: milestone, error: fetchError } = await supabase
      .from('milestones')
      .select(`
        *,
        project:projects(homeowner_id, assigned_contractor_id)
      `)
      .eq('id', milestoneId)
      .single()
    
    if (fetchError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }
    
    // Check if user has access to this milestone's project
    const project = milestone.project as any
    if (project.homeowner_id !== user.id && project.assigned_contractor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const body = await request.json()
    const { title, description, due_date, status, type, amount, assigned_to, completed_date, dependencies } = body
    
    // Validate status if provided
    if (status && !isMilestoneStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid milestone status' },
        { status: 400 }
      )
    }
    
    // Validate type if provided
    if (type && !isMilestoneType(type)) {
      return NextResponse.json(
        { error: 'Invalid milestone type' },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (due_date !== undefined) updateData.due_date = due_date
    if (status !== undefined) updateData.status = status
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to
    if (completed_date !== undefined) updateData.completed_date = completed_date
    if (dependencies !== undefined) updateData.dependencies = dependencies
    
    // If marking as completed and no completed_date provided, set it to now
    if (status === 'completed' && !completed_date && !milestone.completed_date) {
      updateData.completed_date = new Date().toISOString()
    }
    
    // Update milestone
    const { data: updatedMilestone, error } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ milestone: updatedMilestone })
    
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

// DELETE /api/milestones/[id] - Delete a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const milestoneId = params.id
    
    // Get milestone with project info to check permissions
    const { data: milestone, error: fetchError } = await supabase
      .from('milestones')
      .select(`
        *,
        project:projects(homeowner_id, assigned_contractor_id)
      `)
      .eq('id', milestoneId)
      .single()
    
    if (fetchError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }
    
    // Check if user has access to this milestone's project
    const project = milestone.project as any
    if (project.homeowner_id !== user.id && project.assigned_contractor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete milestone
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}