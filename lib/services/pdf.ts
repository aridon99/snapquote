import { Project, IntakeForm } from '@/types/database'

export interface ProjectBriefData {
  project: Project
  intakeForm?: IntakeForm
  generatedAt: string
}

export async function generateProjectBriefHTML(data: ProjectBriefData): Promise<string> {
  const { project, intakeForm } = data
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Brief - ${project.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #c1414f;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #c1414f;
          margin-bottom: 10px;
        }
        h1 {
          color: #c1414f;
          margin-bottom: 10px;
        }
        h2 {
          color: #333;
          border-bottom: 2px solid #f5e9e8;
          padding-bottom: 10px;
          margin-top: 30px;
        }
        .project-info {
          background: #f5e9e8;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .label {
          font-weight: bold;
          color: #666;
          margin-bottom: 5px;
        }
        .value {
          color: #333;
        }
        .project-types {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .project-type {
          background: #c1414f;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 14px;
        }
        .description-box {
          background: #fff;
          padding: 20px;
          border-left: 4px solid #c1414f;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: capitalize;
        }
        .status-intake { background: #dbeafe; color: #1e40af; }
        .status-planning { background: #fef3c7; color: #92400e; }
        .status-in_progress { background: #d1fae5; color: #065f46; }
        .status-completed { background: #f3f4f6; color: #374151; }
        @media print {
          body { margin: 0; padding: 20px; }
          .header { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">RENOVATION ADVISOR</div>
        <h1>Project Brief</h1>
        <p>Generated on ${new Date(data.generatedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div class="project-info">
        <h1>${project.title}</h1>
        <div class="status-badge status-${project.status}">${project.status.replace('_', ' ')}</div>
      </div>

      <h2>Project Overview</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Project Address</div>
          <div class="value">
            ${project.address?.street}<br>
            ${project.address?.city}, ${project.address?.state} ${project.address?.zip}
          </div>
        </div>
        <div class="info-item">
          <div class="label">Project Created</div>
          <div class="value">${new Date(project.created_at).toLocaleDateString()}</div>
        </div>
        <div class="info-item">
          <div class="label">Budget Range</div>
          <div class="value">${project.budget_range || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="label">Timeline Preference</div>
          <div class="value">${project.timeline_preference || 'Flexible'}</div>
        </div>
      </div>

      ${project.project_type && project.project_type.length > 0 ? `
        <div class="info-item">
          <div class="label">Project Types</div>
          <div class="project-types">
            ${project.project_type.map(type => `<span class="project-type">${type}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${project.description ? `
        <h2>Project Description</h2>
        <div class="description-box">
          <div class="value">${project.description.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      ${intakeForm?.form_data?.additionalRequirements ? `
        <h2>Additional Requirements</h2>
        <div class="description-box">
          <div class="value">${intakeForm.form_data.additionalRequirements.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      <h2>Project Timeline</h2>
      <div class="info-grid">
        ${project.start_date ? `
          <div class="info-item">
            <div class="label">Start Date</div>
            <div class="value">${new Date(project.start_date).toLocaleDateString()}</div>
          </div>
        ` : ''}
        ${project.target_end_date ? `
          <div class="info-item">
            <div class="label">Target Completion</div>
            <div class="value">${new Date(project.target_end_date).toLocaleDateString()}</div>
          </div>
        ` : ''}
        ${project.actual_end_date ? `
          <div class="info-item">
            <div class="label">Actual Completion</div>
            <div class="value">${new Date(project.actual_end_date).toLocaleDateString()}</div>
          </div>
        ` : ''}
      </div>

      <h2>Budget Information</h2>
      <div class="info-grid">
        ${project.total_budget ? `
          <div class="info-item">
            <div class="label">Total Budget</div>
            <div class="value">$${project.total_budget.toLocaleString()}</div>
          </div>
        ` : ''}
        <div class="info-item">
          <div class="label">Amount Spent</div>
          <div class="value">$${(project.spent_amount || 0).toLocaleString()}</div>
        </div>
        ${project.total_budget ? `
          <div class="info-item">
            <div class="label">Remaining Budget</div>
            <div class="value">$${(project.total_budget - (project.spent_amount || 0)).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="label">Budget Utilization</div>
            <div class="value">${((project.spent_amount || 0) / project.total_budget * 100).toFixed(1)}%</div>
          </div>
        ` : ''}
      </div>

      <h2>Next Steps</h2>
      <div class="description-box">
        ${project.status === 'intake' ? 
          '<p>✓ Project intake completed<br>• Contractor matching in progress<br>• Initial consultation scheduling</p>' :
          project.status === 'planning' ?
          '<p>✓ Project planning phase<br>• Detailed scope development<br>• Timeline refinement<br>• Budget finalization</p>' :
          project.status === 'contractor_selection' ?
          '<p>✓ Contractor matching completed<br>• Review contractor profiles<br>• Schedule consultations<br>• Select preferred contractor</p>' :
          project.status === 'in_progress' ?
          '<p>✓ Project in progress<br>• Regular progress updates<br>• Milestone tracking<br>• Quality oversight</p>' :
          '<p>Project status: ' + project.status + '</p>'
        }
      </div>

      <div class="footer">
        <p>This project brief was generated by Renovation Advisor Platform</p>
        <p>For questions or support, contact us at support@renovationadvisor.com</p>
        <p>© ${new Date().getFullYear()} Renovation Advisor. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export async function generateProjectBriefPDF(data: ProjectBriefData): Promise<Buffer> {
  const html = await generateProjectBriefHTML(data)
  
  try {
    const puppeteer = await import('puppeteer')
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true
    })
    
    await browser.close()
    
    return Buffer.from(pdf)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}