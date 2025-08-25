import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { 
  sendWelcomeEmail, 
  sendProjectCreatedEmail,
  sendContractorMatchedEmail,
  sendNewMessageEmail,
  sendBudgetAlertEmail,
  sendEmail 
} from '@/lib/services/email'

export async function POST(request: NextRequest) {
  try {
    await requireAuth() // Ensure user is authenticated
    
    const { to, subject, type, data } = await request.json()

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, data.name)
        break
      case 'project_created':
        result = await sendProjectCreatedEmail(to, data.projectTitle, data.projectId)
        break
      case 'contractor_matched':
        result = await sendContractorMatchedEmail(to, data.projectTitle, data.contractorName, data.projectId)
        break
      case 'new_message':
        result = await sendNewMessageEmail(to, data.projectTitle, data.senderName, data.messagePreview, data.projectId)
        break
      case 'budget_alert':
        result = await sendBudgetAlertEmail(to, data.projectTitle, data.currentSpent, data.totalBudget, data.projectId)
        break
      case 'custom':
        if (!subject || !data.html) {
          return NextResponse.json(
            { error: 'Custom emails require subject and html' },
            { status: 400 }
          )
        }
        result = await sendEmail({ to, subject, html: data.html })
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateProjectUpdateEmail(data: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Project Update: ${data.projectTitle}</h2>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Latest Progress</h3>
        <p style="color: #6b7280;">${data.updateContent}</p>
      </div>
      <div style="margin: 20px 0;">
        <h4 style="color: #374151;">Project Status</h4>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Budget Used:</strong> $${data.spentAmount?.toLocaleString()} of $${data.totalBudget?.toLocaleString()}</p>
        <p><strong>Completion:</strong> ${data.completionPercentage}%</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        View Project Dashboard
      </a>
    </div>
  `
}

function generateContractorIntroductionEmail(data: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">New Contractor Match Found!</h2>
      <p style="color: #6b7280;">We've found a contractor that matches your project requirements:</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">${data.contractorName}</h3>
        <p><strong>Specialties:</strong> ${data.specialties?.join(', ')}</p>
        <p><strong>Rating:</strong> ${data.rating} stars (${data.completedProjects} projects)</p>
        <p><strong>Availability:</strong> ${data.availability}</p>
        <p><strong>Service Area:</strong> ${data.serviceAreas?.join(', ')}</p>
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/contractors" 
         style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        View Contractor Profile
      </a>
    </div>
  `
}

function generateBudgetAlertEmail(data: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Budget Alert: ${data.projectTitle}</h2>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #dc2626; margin-top: 0;">Budget Threshold Exceeded</h3>
        <p style="color: #7f1d1d;">Your project has exceeded ${data.thresholdPercentage}% of the allocated budget.</p>
      </div>
      <div style="margin: 20px 0;">
        <p><strong>Total Budget:</strong> $${data.totalBudget?.toLocaleString()}</p>
        <p><strong>Amount Spent:</strong> $${data.spentAmount?.toLocaleString()}</p>
        <p><strong>Remaining:</strong> $${(data.totalBudget - data.spentAmount)?.toLocaleString()}</p>
        <p><strong>Utilization:</strong> ${((data.spentAmount / data.totalBudget) * 100).toFixed(1)}%</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Review Budget
      </a>
    </div>
  `
}

function generateMessageNotificationEmail(data: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">New Message: ${data.projectTitle}</h2>
      <p style="color: #6b7280;">You have a new message from ${data.senderName}:</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #374151; margin: 0;">"${data.messageContent}"</p>
        ${data.isActionItem ? '<div style="margin-top: 10px;"><span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Action Item</span></div>' : ''}
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Reply to Message
      </a>
    </div>
  `
}