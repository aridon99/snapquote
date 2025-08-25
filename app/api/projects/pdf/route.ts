import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        profile:profiles(*),
        budget_items(*),
        contractors:project_contractors(
          contractor:contractors(*)
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateProjectPDF(project)
    
    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="project-brief-${projectId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

async function generateProjectPDF(project: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'LETTER'
    })
    
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Project Brief', { align: 'center' })
    
    doc.moveDown()
    
    // Project Title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(project.title || 'Untitled Project')
    
    doc.moveDown(0.5)
    
    // Project Details Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Project Overview')
       .moveDown(0.3)
    
    doc.fontSize(11)
       .font('Helvetica')
    
    // Basic Information
    doc.text(`Status: ${formatStatus(project.status)}`)
    doc.text(`Created: ${new Date(project.created_at).toLocaleDateString()}`)
    
    if (project.address) {
      doc.text(`Location: ${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zip}`)
    }
    
    doc.moveDown()
    
    // Description
    if (project.description) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Project Description')
         .moveDown(0.3)
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(project.description, { align: 'justify' })
      
      doc.moveDown()
    }
    
    // Budget Overview
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Budget Overview')
       .moveDown(0.3)
    
    doc.fontSize(11)
       .font('Helvetica')
    
    const totalBudget = project.total_budget || 0
    const spentAmount = project.spent_amount || 0
    const remaining = totalBudget - spentAmount
    
    doc.text(`Total Budget: $${totalBudget.toLocaleString()}`)
    doc.text(`Spent to Date: $${spentAmount.toLocaleString()}`)
    doc.text(`Remaining: $${remaining.toLocaleString()}`)
    doc.text(`Utilization: ${totalBudget > 0 ? ((spentAmount / totalBudget) * 100).toFixed(1) : 0}%`)
    
    doc.moveDown()
    
    // Budget Items
    if (project.budget_items && project.budget_items.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Budget Line Items')
         .moveDown(0.3)
      
      // Table header
      doc.fontSize(10)
         .font('Helvetica-Bold')
      
      const tableTop = doc.y
      doc.text('Category', 50, tableTop)
      doc.text('Description', 150, tableTop)
      doc.text('Budgeted', 350, tableTop)
      doc.text('Actual', 430, tableTop)
      
      doc.moveTo(50, doc.y + 5)
         .lineTo(500, doc.y + 5)
         .stroke()
      
      doc.moveDown(0.5)
      
      // Table rows
      doc.fontSize(10)
         .font('Helvetica')
      
      project.budget_items.forEach((item: any) => {
        const y = doc.y
        doc.text(item.category, 50, y)
        doc.text(item.description.substring(0, 30), 150, y)
        doc.text(`$${(item.budgeted_amount || 0).toLocaleString()}`, 350, y)
        doc.text(`$${(item.actual_amount || 0).toLocaleString()}`, 430, y)
        doc.moveDown(0.8)
      })
      
      doc.moveDown()
    }
    
    // Timeline
    if (project.start_date || project.target_end_date) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Timeline')
         .moveDown(0.3)
      
      doc.fontSize(11)
         .font('Helvetica')
      
      if (project.start_date) {
        doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString()}`)
      }
      if (project.target_end_date) {
        doc.text(`Target Completion: ${new Date(project.target_end_date).toLocaleDateString()}`)
      }
      
      doc.moveDown()
    }
    
    // Requirements
    if (project.additional_requirements) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Additional Requirements')
         .moveDown(0.3)
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(project.additional_requirements, { align: 'justify' })
      
      doc.moveDown()
    }
    
    // Footer
    doc.fontSize(9)
       .font('Helvetica')
       .text(
         `Generated on ${new Date().toLocaleDateString()} | Renovation Advisor Platform`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       )
    
    doc.end()
  })
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'intake': 'Initial Intake',
    'planning': 'Planning Phase',
    'contractor_selection': 'Selecting Contractors',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold'
  }
  return statusMap[status] || status
}