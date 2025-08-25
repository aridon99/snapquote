import notificationapi from 'notificationapi-node-server-sdk'

// Initialize NotificationAPI with credentials
notificationapi.init(
  process.env.NOTIFICATIONAPI_CLIENT_ID!,
  process.env.NOTIFICATIONAPI_CLIENT_SECRET!
)

export interface NotificationData {
  name?: string
  phone?: string
  email?: string
  projectType?: string
  notes?: string
  timestamp?: string
  comment?: string
  [key: string]: any // Allow additional parameters
}

export interface EmailNotificationParams {
  to: string
  templateType: 'inquary_email' | 'project_update' | 'reminder' | 'welcome'
  parameters: NotificationData
}

export interface SMSNotificationParams {
  to: string
  templateType: 'inquary_txt' | 'project_alert' | 'reminder' | 'confirmation'
  parameters: NotificationData
}

/**
 * Send email notification using NotificationAPI
 */
export async function sendEmailNotification(params: EmailNotificationParams) {
  try {
    const result = await notificationapi.send({
      type: params.templateType,
      to: {
        email: params.to
      },
      parameters: params.parameters
    })
    
    console.log(`Email notification sent (${params.templateType}):`, result.data)
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Failed to send email notification:', error)
    throw error
  }
}

/**
 * Send SMS notification using NotificationAPI
 */
export async function sendSMSNotification(params: SMSNotificationParams) {
  try {
    const result = await notificationapi.send({
      type: params.templateType,
      to: {
        number: params.to
      },
      parameters: params.parameters
    })
    
    console.log(`SMS notification sent (${params.templateType}):`, result.data)
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Failed to send SMS notification:', error)
    throw error
  }
}

/**
 * Send both email and SMS notifications for leads
 */
export async function sendLeadNotifications(leadData: {
  name: string
  phone: string
  email: string
  projectType?: string
  notes?: string
}) {
  const adminPhone = process.env.ADMIN_PHONE || '+14155551234'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@renovationadvisor.com'
  
  try {
    // Send combined email and SMS notification using individual fields format
    const result = await notificationapi.send({
      type: 'landing_page_inquary',
      to: {
        id: adminEmail,  // Use email as ID
        email: adminEmail,
        number: adminPhone
      },
      parameters: {
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        project_type: leadData.projectType || 'renovation',
        comment: leadData.notes || 'Natural conversation lead capture via Emma chatbot'
      }
    })
    
    console.log('Lead notification sent successfully:', result.data)
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('Failed to send lead notification:', error)
    
    // Fallback: Try to send just SMS if combined fails
    try {
      const fallbackResult = await notificationapi.send({
        type: 'landing_page_inquary',
        to: {
          number: adminPhone
        },
        parameters: {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          project_type: leadData.projectType || 'renovation',
          comment: leadData.notes || 'Natural conversation lead capture via Emma chatbot'
        }
      })
      
      console.log('Fallback SMS sent:', fallbackResult.data)
      return {
        success: true,
        data: fallbackResult.data,
        fallback: true
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

/**
 * Send project update notifications
 */
export async function sendProjectUpdateNotification(data: {
  customerEmail: string
  projectName: string
  updateMessage: string
  contractorName?: string
}) {
  try {
    const result = await sendEmailNotification({
      to: data.customerEmail,
      templateType: 'project_update',
      parameters: {
        name: data.projectName,
        comment: data.updateMessage,
        contractorName: data.contractorName || 'Your contractor',
        timestamp: new Date().toLocaleString()
      }
    })
    
    return result
  } catch (error) {
    console.error('Failed to send project update notification:', error)
    throw error
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeNotification(data: {
  email: string
  name: string
}) {
  try {
    const result = await sendEmailNotification({
      to: data.email,
      templateType: 'welcome',
      parameters: {
        name: data.name,
        timestamp: new Date().toLocaleString()
      }
    })
    
    return result
  } catch (error) {
    console.error('Failed to send welcome notification:', error)
    throw error
  }
}

/**
 * Send reminder notifications
 */
export async function sendReminderNotification(data: {
  type: 'email' | 'sms'
  to: string
  reminderType: string
  message: string
  name?: string
}) {
  try {
    if (data.type === 'email') {
      return await sendEmailNotification({
        to: data.to,
        templateType: 'reminder',
        parameters: {
          name: data.name || 'Valued Customer',
          comment: data.message,
          reminderType: data.reminderType,
          timestamp: new Date().toLocaleString()
        }
      })
    } else {
      return await sendSMSNotification({
        to: data.to,
        templateType: 'reminder',
        parameters: {
          comment: data.message
        }
      })
    }
  } catch (error) {
    console.error('Failed to send reminder notification:', error)
    throw error
  }
}

export default {
  sendEmailNotification,
  sendSMSNotification,
  sendLeadNotifications,
  sendProjectUpdateNotification,
  sendWelcomeNotification,
  sendReminderNotification
}