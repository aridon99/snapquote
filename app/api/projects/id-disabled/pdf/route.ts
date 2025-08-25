import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateProjectBriefPDF, ProjectBriefData } from '@/lib/services/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = id
    
    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('homeowner_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Get intake form data if exists
    const { data: intakeForm } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('project_id', projectId)
      .single()
    
    // Prepare data for PDF generation
    const briefData: ProjectBriefData = {
      project,
      intakeForm: intakeForm || undefined,
      generatedAt: new Date().toISOString()
    }
    
    // Generate PDF
    const pdfBuffer = await generateProjectBriefPDF(briefData)
    
    // Set headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="project-brief-${project.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`)
    headers.set('Content-Length', pdfBuffer.length.toString())
    
    return new NextResponse(pdfBuffer, { headers })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}