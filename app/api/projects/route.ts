import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { intakeFormSchema } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('homeowner_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    // Validate the intake form data
    const validationResult = intakeFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }
    
    const { title, projectType, description, address, budgetRange, timeline, additionalRequirements } = validationResult.data
    
    const supabase = await createClient()
    
    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        homeowner_id: user.id,
        title,
        project_type: projectType,
        description,
        address,
        budget_range: budgetRange,
        timeline_preference: timeline,
        status: 'intake'
      })
      .select()
      .single()
    
    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }
    
    // Store intake form data
    const { error: intakeError } = await supabase
      .from('intake_forms')
      .insert({
        project_id: project.id,
        form_data: {
          title,
          projectType,
          description,
          address,
          budgetRange,
          timeline,
          additionalRequirements
        }
      })
    
    if (intakeError) {
      console.error('Failed to store intake form:', intakeError)
    }
    
    // TODO: Handle photo uploads if provided
    // TODO: Trigger contractor matching process
    // TODO: Send confirmation email
    
    return NextResponse.json({ 
      message: 'Project created successfully',
      project
    })
    
  } catch (error: any) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}