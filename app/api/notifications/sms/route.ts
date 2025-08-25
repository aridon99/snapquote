import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { 
  sendWelcomeSMS,
  sendProjectCreatedSMS,
  sendContractorMatchedSMS,
  sendNewMessageSMS,
  sendBudgetAlertSMS,
  sendAppointmentReminderSMS,
  sendMilestoneCompletedSMS,
  sendPaymentDueSMS,
  sendSMS,
  formatPhoneNumber,
  isValidPhoneNumber
} from '@/lib/services/sms'

export async function POST(request: NextRequest) {
  try {
    await requireAuth() // Ensure user is authenticated
    
    const { to, type, data, message } = await request.json()

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type' },
        { status: 400 }
      )
    }

    // Validate and format phone number
    if (!isValidPhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(to)
    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeSMS(formattedPhone, data.name)
        break
      case 'project_created':
        result = await sendProjectCreatedSMS(formattedPhone, data.projectTitle)
        break
      case 'contractor_matched':
        result = await sendContractorMatchedSMS(formattedPhone, data.projectTitle, data.contractorName)
        break
      case 'new_message':
        result = await sendNewMessageSMS(formattedPhone, data.projectTitle, data.senderName)
        break
      case 'budget_alert':
        result = await sendBudgetAlertSMS(formattedPhone, data.projectTitle, data.percentage)
        break
      case 'appointment_reminder':
        result = await sendAppointmentReminderSMS(formattedPhone, data.projectTitle, data.time)
        break
      case 'milestone_completed':
        result = await sendMilestoneCompletedSMS(formattedPhone, data.projectTitle, data.milestone)
        break
      case 'payment_due':
        result = await sendPaymentDueSMS(formattedPhone, data.projectTitle, data.amount)
        break
      case 'custom':
        if (!message) {
          return NextResponse.json(
            { error: 'Custom SMS requires message field' },
            { status: 400 }
          )
        }
        result = await sendSMS({ to: formattedPhone, message })
        break
      default:
        return NextResponse.json(
          { error: 'Invalid SMS type' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send SMS', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'SMS sent successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}