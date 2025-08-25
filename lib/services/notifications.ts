interface NotificationConfig {
  resendApiKey?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
  adminEmail?: string
  adminPhone?: string
}

interface EmailData {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface SMSData {
  to: string
  body: string
}

class NotificationService {
  private config: NotificationConfig
  
  constructor() {
    this.config = {
      resendApiKey: process.env.RESEND_API_KEY,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
      adminEmail: process.env.ADMIN_EMAIL || 'leads@renovationadvisor.com',
      adminPhone: process.env.ADMIN_PHONE || '+15551234567'
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.config.resendApiKey) {
      console.warn('Resend API key not configured, skipping email')
      return false
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: data.from || 'RenovationAdvisor <noreply@renovationadvisor.com>',
          to: Array.isArray(data.to) ? data.to : [data.to],
          subject: data.subject,
          html: data.html
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send email:', error)
        return false
      }

      console.log('Email sent successfully')
      return true
    } catch (error) {
      console.error('Email sending error:', error)
      return false
    }
  }

  async sendSMS(data: SMSData): Promise<boolean> {
    if (!this.config.twilioAccountSid || !this.config.twilioAuthToken || !this.config.twilioPhoneNumber) {
      console.warn('Twilio not configured, skipping SMS')
      return false
    }

    try {
      const auth = Buffer.from(`${this.config.twilioAccountSid}:${this.config.twilioAuthToken}`).toString('base64')
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.config.twilioPhoneNumber!,
          To: data.to,
          Body: data.body
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send SMS:', error)
        return false
      }

      console.log('SMS sent successfully')
      return true
    } catch (error) {
      console.error('SMS sending error:', error)
      return false
    }
  }

  async notifyNewLead(leadData: any, leadId: string): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send email to admin
    promises.push(this.sendEmail({
      to: this.config.adminEmail!,
      subject: `🏠 New Lead: ${leadData.name} - ${leadData.project_type || 'Renovation Project'}`,
      html: this.generateLeadNotificationEmail(leadData, leadId)
    }))

    // Send confirmation email to lead
    promises.push(this.sendEmail({
      to: leadData.email,
      subject: 'Thanks for your interest in RenovationAdvisor!',
      html: this.generateLeadConfirmationEmail(leadData),
      from: 'RenovationAdvisor <hello@renovationadvisor.com>'
    }))

    // Send SMS to admin for high-priority leads
    if (leadData.lead_quality === 'hot' || leadData.timeline === 'immediate') {
      promises.push(this.sendSMS({
        to: this.config.adminPhone!,
        body: `🔥 HOT LEAD: ${leadData.name} (${leadData.project_type || 'renovation'}) - ${leadData.phone}. Contact ASAP!`
      }))
    }

    // Wait for all notifications to complete
    const results = await Promise.allSettled(promises)
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notification ${index} failed:`, result.reason)
      }
    })
  }

  async notifyLeadStatusChange(leadData: any, oldStatus: string, newStatus: string): Promise<void> {
    if (newStatus === 'converted') {
      await this.sendEmail({
        to: leadData.email,
        subject: 'Welcome to RenovationAdvisor - Your project is starting!',
        html: this.generateProjectStartEmail(leadData)
      })
    }
  }

  private generateLeadNotificationEmail(leadData: any, leadId: string): string {
    const urgencyEmoji = leadData.urgency === 'immediate' ? '🔥' : 
                        leadData.urgency === 'planning' ? '⏰' : '📋'
    
    const qualityBadge = leadData.lead_quality === 'hot' ? '🔥 HOT' :
                        leadData.lead_quality === 'warm' ? '🌡️ WARM' : '❄️ COLD'

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e94560;">🏠 New Lead Captured via ${leadData.source || 'Chatbot'}</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Lead Quality:</strong> <span style="background: ${leadData.lead_quality === 'hot' ? '#e74c3c' : leadData.lead_quality === 'warm' ? '#f39c12' : '#3498db'}; color: white; padding: 4px 8px; border-radius: 4px;">${qualityBadge}</span></p>
          <p><strong>Urgency:</strong> ${urgencyEmoji} ${leadData.urgency || 'Not specified'}</p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
        </div>

        <h3>Contact Information</h3>
        <ul>
          <li><strong>Name:</strong> ${leadData.name}</li>
          <li><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></li>
          <li><strong>Phone:</strong> <a href="tel:${leadData.phone}">${leadData.phone}</a></li>
          <li><strong>Preferred Call Time:</strong> ${leadData.preferred_time || 'Not specified'}</li>
        </ul>

        <h3>Project Details</h3>
        <ul>
          <li><strong>Project Type:</strong> ${leadData.project_type || 'Not specified'}</li>
          <li><strong>Budget Range:</strong> ${leadData.budget_range || 'Not specified'}</li>
          <li><strong>Timeline:</strong> ${leadData.timeline || 'Not specified'}</li>
          <li><strong>Address:</strong> ${leadData.address || 'Not provided'}</li>
        </ul>

        ${leadData.project_details ? `
          <h3>Project Details</h3>
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #e94560; margin: 10px 0;">
            <p>${leadData.project_details}</p>
          </div>
        ` : ''}

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Captured:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Source:</strong> ${leadData.source || 'chatbot'}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${leadId}" 
             style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Lead Details
          </a>
        </div>
      </div>
    `
  }

  private generateLeadConfirmationEmail(leadData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e94560;">Thank you for your interest, ${leadData.name}!</h2>
        
        <p>We've received your information and one of our renovation advisors will reach out within 24 hours to discuss your ${leadData.project_type || 'renovation'} project.</p>
        
        <h3 style="color: #2c3e50;">What's Next?</h3>
        <ol style="line-height: 1.6;">
          <li>Our team will review your project details</li>
          <li>We'll call you during your preferred time (<strong>${leadData.preferred_time || 'afternoon'}</strong>)</li>
          <li>We'll match you with 3-5 pre-vetted contractors</li>
          <li>You'll receive detailed proposals within 48-72 hours</li>
        </ol>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #e94560;">Quick Summary of Your Project:</h4>
          <ul>
            <li><strong>Project Type:</strong> ${leadData.project_type || 'General renovation'}</li>
            <li><strong>Budget Range:</strong> ${leadData.budget_range || 'To be discussed'}</li>
            <li><strong>Timeline:</strong> ${leadData.timeline || 'Flexible'}</li>
          </ul>
        </div>
        
        <p>In the meantime, feel free to:</p>
        <ul>
          <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/faq" style="color: #e94560;">Browse our FAQ</a></li>
          <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/how-it-works" style="color: #e94560;">Learn more about our process</a></li>
          <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/gallery" style="color: #e94560;">View our project gallery</a></li>
        </ul>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
          <p><strong>RenovationAdvisor Team</strong></p>
          <p>
            <a href="mailto:hello@renovationadvisor.com" style="color: #e94560;">hello@renovationadvisor.com</a> | 
            <a href="tel:+15551234567" style="color: #e94560;">(555) 123-4567</a>
          </p>
          <p style="font-size: 12px; color: #999;">
            Making home renovation simple, transparent, and stress-free.
          </p>
        </div>
      </div>
    `
  }

  private generateProjectStartEmail(leadData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e94560;">🎉 Welcome to RenovationAdvisor, ${leadData.name}!</h2>
        
        <p>Great news! Your renovation project is officially starting. We've matched you with vetted contractors and your project manager will be in touch within 24 hours.</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What Happens Next:</h3>
          <ol>
            <li>Your dedicated project manager will contact you</li>
            <li>We'll schedule contractor consultations</li>
            <li>You'll receive detailed proposals and timelines</li>
            <li>We'll help you select the best contractor</li>
            <li>Project kicks off with full oversight and support</li>
          </ol>
        </div>
        
        <p>Thank you for choosing RenovationAdvisor. We're excited to help transform your space!</p>
      </div>
    `
  }
}

export const notificationService = new NotificationService()
export default notificationService