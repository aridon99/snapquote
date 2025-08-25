import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from = 'Renovation Advisor <noreply@renovationadvisor.com>' }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}

// Email Templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Renovation Advisor!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Renovation Advisor, ${name}!</h2>
        <p>Thank you for joining our platform. We're excited to help you with your renovation journey.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your project intake form</li>
          <li>Get matched with vetted contractors</li>
          <li>Manage your project budget and timeline</li>
          <li>Communicate with your team in real-time</li>
        </ul>
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The Renovation Advisor Team</p>
      </div>
    `
  }),

  projectCreated: (projectTitle: string, projectId: string) => ({
    subject: `Your project "${projectTitle}" has been created`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Created Successfully!</h2>
        <p>Your renovation project "<strong>${projectTitle}</strong>" has been created and we're now matching you with qualified contractors.</p>
        <p>What happens next:</p>
        <ol>
          <li>We'll review your project requirements</li>
          <li>Match you with 3-5 vetted contractors in your area</li>
          <li>Schedule initial consultations</li>
          <li>Help you select the best contractor for your needs</li>
        </ol>
        <p>You can track your project progress in your dashboard.</p>
        <p style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            View Project
          </a>
        </p>
        <p>Best regards,<br>The Renovation Advisor Team</p>
      </div>
    `
  }),

  contractorMatched: (projectTitle: string, contractorName: string, projectId: string) => ({
    subject: `New contractor matched for "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Great News! We Found a Contractor Match</h2>
        <p>We've matched you with <strong>${contractorName}</strong> for your project "${projectTitle}".</p>
        <p>This contractor has been carefully vetted and matches your project requirements, budget, and timeline.</p>
        <p>Next steps:</p>
        <ul>
          <li>Review the contractor's profile and portfolio</li>
          <li>Schedule an initial consultation</li>
          <li>Discuss project details and get a detailed quote</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            View Contractor Details
          </a>
        </p>
        <p>Best regards,<br>The Renovation Advisor Team</p>
      </div>
    `
  }),

  newMessage: (projectTitle: string, senderName: string, messagePreview: string, projectId: string) => ({
    subject: `New message in "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Message in Your Project</h2>
        <p><strong>${senderName}</strong> sent a new message in your project "${projectTitle}":</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${messagePreview}"</p>
        </div>
        <p style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/messages" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            View Full Message
          </a>
        </p>
        <p>Best regards,<br>The Renovation Advisor Team</p>
      </div>
    `
  }),

  budgetAlert: (projectTitle: string, currentSpent: number, totalBudget: number, projectId: string) => ({
    subject: `Budget Alert: "${projectTitle}" approaching budget limit`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Budget Alert</h2>
        <p>Your project "${projectTitle}" is approaching its budget limit.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Current Spending:</strong> $${currentSpent.toLocaleString()}</p>
          <p><strong>Total Budget:</strong> $${totalBudget.toLocaleString()}</p>
          <p><strong>Percentage Used:</strong> ${((currentSpent / totalBudget) * 100).toFixed(1)}%</p>
        </div>
        <p>We recommend reviewing your budget and discussing any necessary adjustments with your contractor.</p>
        <p style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/budget" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Review Budget
          </a>
        </p>
        <p>Best regards,<br>The Renovation Advisor Team</p>
      </div>
    `
  })
}

// Helper functions for specific email types
export async function sendWelcomeEmail(email: string, name: string) {
  const template = emailTemplates.welcome(name)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendProjectCreatedEmail(email: string, projectTitle: string, projectId: string) {
  const template = emailTemplates.projectCreated(projectTitle, projectId)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendContractorMatchedEmail(email: string, projectTitle: string, contractorName: string, projectId: string) {
  const template = emailTemplates.contractorMatched(projectTitle, contractorName, projectId)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendNewMessageEmail(email: string, projectTitle: string, senderName: string, messagePreview: string, projectId: string) {
  const template = emailTemplates.newMessage(projectTitle, senderName, messagePreview, projectId)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendBudgetAlertEmail(email: string, projectTitle: string, currentSpent: number, totalBudget: number, projectId: string) {
  const template = emailTemplates.budgetAlert(projectTitle, currentSpent, totalBudget, projectId)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}