import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  const { id } = await params) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = id
    
    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    if (project.homeowner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get contractors associated with this project
    const { data: projectContractors, error } = await supabase
      .from('project_contractors')
      .select(`
        *,
        contractor:contractors(*)
      `)
      .eq('project_id', projectId)
      .order('introduced_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ contractors: projectContractors })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project contractors' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  const { id } = await params) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { contractorId, notes } = body
    const projectId = id
    
    const supabase = await createClient()
    
    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    if (project.homeowner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Check if contractor is already associated with project
    const { data: existing } = await supabase
      .from('project_contractors')
      .select('id')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { error: 'Contractor already associated with this project' },
        { status: 400 }
      )
    }
    
    // Add contractor to project
    const { data: projectContractor, error } = await supabase
      .from('project_contractors')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        status: 'proposed',
        notes
      })
      .select(`
        *,
        contractor:contractors(*)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // TODO: Send notification to contractor
    // TODO: Create initial message in project thread
    
    return NextResponse.json({
      message: 'Contractor added to project',
      projectContractor
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add contractor to project' },
      { status: 500 }
    )
  }
}