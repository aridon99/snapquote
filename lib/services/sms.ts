import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface SMSOptions {
  to: string
  message: string
  from?: string
}

export async function sendSMS({ to, message, from = process.env.TWILIO_PHONE_NUMBER }: SMSOptions) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !from) {
      console.error('Twilio configuration missing')
      return { success: false, error: 'SMS service not configured' }
    }

    const result = await client.messages.create({
      body: message,
      from,
      to
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error }
  }
}

// SMS Templates
export const smsTemplates = {
  welcome: (name: string) => 
    `Welcome to Renovation Advisor, ${name}! Your account has been created. Start your first project at ${process.env.NEXT_PUBLIC_APP_URL}`,

  projectCreated: (projectTitle: string) =>
    `Your project "${projectTitle}" has been created! We're now matching you with contractors. Check your dashboard for updates.`,

  contractorMatched: (projectTitle: string, contractorName: string) =>
    `Great news! ${contractorName} has been matched with your project "${projectTitle}". Log in to review their profile and schedule a consultation.`,

  newMessage: (projectTitle: string, senderName: string) =>
    `New message from ${senderName} in your project "${projectTitle}". View: ${process.env.NEXT_PUBLIC_APP_URL}/projects`,

  budgetAlert: (projectTitle: string, percentage: number) =>
    `Budget Alert: Your project "${projectTitle}" has used ${percentage}% of the budget. Review your spending in the dashboard.`,

  appointmentReminder: (projectTitle: string, time: string) =>
    `Reminder: You have a consultation for "${projectTitle}" scheduled at ${time}. Contact support if you need to reschedule.`,

  milestoneCompleted: (projectTitle: string, milestone: string) =>
    `Milestone completed! "${milestone}" for your project "${projectTitle}" has been marked as done. Check your dashboard for details.`,

  paymentDue: (projectTitle: string, amount: number) =>
    `Payment due: $${amount.toLocaleString()} for project "${projectTitle}". Complete payment in your dashboard to keep your project on track.`
}

// Helper functions for specific SMS types
export async function sendWelcomeSMS(phone: string, name: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.welcome(name)
  })
}

export async function sendProjectCreatedSMS(phone: string, projectTitle: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.projectCreated(projectTitle)
  })
}

export async function sendContractorMatchedSMS(phone: string, projectTitle: string, contractorName: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.contractorMatched(projectTitle, contractorName)
  })
}

export async function sendNewMessageSMS(phone: string, projectTitle: string, senderName: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.newMessage(projectTitle, senderName)
  })
}

export async function sendBudgetAlertSMS(phone: string, projectTitle: string, percentage: number) {
  return sendSMS({
    to: phone,
    message: smsTemplates.budgetAlert(projectTitle, percentage)
  })
}

export async function sendAppointmentReminderSMS(phone: string, projectTitle: string, time: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.appointmentReminder(projectTitle, time)
  })
}

export async function sendMilestoneCompletedSMS(phone: string, projectTitle: string, milestone: string) {
  return sendSMS({
    to: phone,
    message: smsTemplates.milestoneCompleted(projectTitle, milestone)
  })
}

export async function sendPaymentDueSMS(phone: string, projectTitle: string, amount: number) {
  return sendSMS({
    to: phone,
    message: smsTemplates.paymentDue(projectTitle, amount)
  })
}

// Utility function to format phone number
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Add +1 if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // Add + if missing for international numbers
  if (cleaned.length > 10 && !phone.startsWith('+')) {
    return `+${cleaned}`
  }
  
  return phone
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}