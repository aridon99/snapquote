// F14A Punch List SMS Notification Service
// Handles SMS delivery to contractors for punch list assignments

import { createClient } from '@supabase/supabase-js';
import { sendSMS, formatPhoneNumber, isValidPhoneNumber } from './sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PunchListSMSOptions {
  assignmentId: string;
  contractorPhone: string;
  contractorName: string;
  projectTitle: string;
  homeownerName: string;
  punchListDescription: string;
  priority: string;
  location?: string;
  estimatedTime?: string;
  materialsNeeded?: string[];
}

/**
 * SMS Templates for punch list notifications
 */
export const punchListSMSTemplates = {
  // Initial assignment notification
  punchListAssignment: (options: PunchListSMSOptions) => {
    const { projectTitle, homeownerName, punchListDescription, priority, location, estimatedTime } = options;
    
    let message = `🔨 NEW PUNCH LIST ITEM\n\n`;
    message += `Project: ${projectTitle}\n`;
    message += `Homeowner: ${homeownerName}\n`;
    message += `Task: ${punchListDescription}\n`;
    message += `Priority: ${priority.toUpperCase()}\n`;
    
    if (location) {
      message += `Location: ${location}\n`;
    }
    
    if (estimatedTime) {
      message += `Est. Time: ${estimatedTime}\n`;
    }
    
    message += `\nRespond:\n`;
    message += `• "ACCEPT" to take this task\n`;
    message += `• "DECLINE" to pass\n`;
    message += `• "INFO" for more details\n\n`;
    message += `Reply with questions or ETA if accepting.`;
    
    return message;
  },

  // Urgent priority assignment
  urgentPunchListAssignment: (options: PunchListSMSOptions) => {
    const { projectTitle, homeownerName, punchListDescription, location } = options;
    
    let message = `🚨 URGENT PUNCH LIST ITEM\n\n`;
    message += `IMMEDIATE ATTENTION NEEDED\n`;
    message += `Project: ${projectTitle}\n`;
    message += `Homeowner: ${homeownerName}\n`;
    message += `Issue: ${punchListDescription}\n`;
    
    if (location) {
      message += `Location: ${location}\n`;
    }
    
    message += `\nPlease respond ASAP:\n`;
    message += `• "ACCEPT" + ETA\n`;
    message += `• "DECLINE" if unavailable\n\n`;
    message += `Call ${process.env.ADMIN_PHONE} for emergency contact.`;
    
    return message;
  },

  // Reminder for no response
  punchListReminder: (options: PunchListSMSOptions) => {
    const { contractorName, punchListDescription, priority } = options;
    
    return `Hi ${contractorName}, \n\nReminder: You have an unresponded punch list item:\n\n"${punchListDescription}"\n\nPriority: ${priority.toUpperCase()}\n\nPlease respond with ACCEPT or DECLINE. This item will be reassigned if no response within 2 hours.`;
  },

  // Follow-up for accepted items
  acceptedFollowUp: (options: PunchListSMSOptions) => {
    const { contractorName, punchListDescription } = options;
    
    return `Thanks ${contractorName}! ✅\n\nYou've accepted: "${punchListDescription}"\n\nWhen starting work, please:\n1. Text "STARTED" to this number\n2. Send progress photos if needed\n3. Text "COMPLETED" when done\n\nHomeowner will be notified of your acceptance.`;
  },

  // Materials list if needed
  materialsInfo: (options: PunchListSMSOptions) => {
    const { materialsNeeded = [] } = options;
    
    if (materialsNeeded.length === 0) return 'No specific materials listed for this task.';
    
    let message = `📋 MATERIALS NEEDED:\n\n`;
    materialsNeeded.forEach((material, index) => {
      message += `${index + 1}. ${material}\n`;
    });
    message += `\nConfirm material availability when accepting task.`;
    
    return message;
  },

  // Task completion confirmation
  completionConfirmation: (options: PunchListSMSOptions) => {
    const { contractorName, punchListDescription, projectTitle } = options;
    
    return `Great work ${contractorName}! 🎉\n\nTask marked complete: "${punchListDescription}"\n\nProject: ${projectTitle}\n\nHomeowner has been notified. Payment will be processed according to your agreement.`;
  },

  // Reassignment notification
  taskReassigned: (options: PunchListSMSOptions) => {
    const { contractorName, punchListDescription } = options;
    
    return `Hi ${contractorName},\n\nThe task "${punchListDescription}" has been reassigned to another contractor due to no response.\n\nNo action needed. Thanks for your other great work on this project!`;
  }
};

/**
 * Send punch list assignment SMS to contractor
 */
export async function sendPunchListAssignmentSMS(assignmentId: string): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    // Get assignment details with related data
    const { data: assignment, error: assignmentError } = await supabase
      .from('punch_list_assignments')
      .select(`
        *,
        punch_list_items(*),
        contractors(business_name, phone),
        projects(title, homeowner_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error(`Assignment not found: ${assignmentError?.message}`);
    }

    // Get homeowner details
    const { data: homeowner, error: homeownerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', assignment.projects.homeowner_id)
      .single();

    if (homeownerError) {
      console.warn('Could not fetch homeowner details:', homeownerError);
    }

    // Prepare SMS options
    const smsOptions: PunchListSMSOptions = {
      assignmentId: assignment.id,
      contractorPhone: assignment.contractors.phone,
      contractorName: assignment.contractors.business_name,
      projectTitle: assignment.projects.title,
      homeownerName: homeowner?.full_name || 'Homeowner',
      punchListDescription: assignment.punch_list_items.description,
      priority: assignment.punch_list_items.priority,
      location: assignment.punch_list_items.location,
      estimatedTime: assignment.punch_list_items.estimated_time,
      materialsNeeded: assignment.punch_list_items.materials_needed
    };

    // Validate phone number
    const formattedPhone = formatPhoneNumber(assignment.contractors.phone);
    if (!isValidPhoneNumber(formattedPhone)) {
      throw new Error(`Invalid phone number: ${assignment.contractors.phone}`);
    }

    // Choose template based on priority
    let message: string;
    if (assignment.punch_list_items.priority === 'urgent') {
      message = punchListSMSTemplates.urgentPunchListAssignment(smsOptions);
    } else {
      message = punchListSMSTemplates.punchListAssignment(smsOptions);
    }

    // Send SMS
    const smsResult = await sendSMS({
      to: formattedPhone,
      message: message
    });

    if (!smsResult.success) {
      throw new Error(`SMS send failed: ${smsResult.error}`);
    }

    // Update assignment with SMS details
    await supabase
      .from('punch_list_assignments')
      .update({
        notification_sent_at: new Date().toISOString(),
        sms_message_id: smsResult.data?.sid,
        sms_status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    // Log successful SMS
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: assignment.punch_list_items.voice_message_id,
      stage: 'notification',
      status: 'completed',
      details: {
        sms_message_id: smsResult.data?.sid,
        contractor_phone: formattedPhone,
        contractor_name: assignment.contractors.business_name,
        message_length: message.length
      }
    });

    // Update punch list item status
    await supabase
      .from('punch_list_items')
      .update({
        status: 'notified',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.punch_list_item_id);

    return {
      success: true,
      messageId: smsResult.data?.sid
    };

  } catch (error) {
    console.error('Failed to send punch list assignment SMS:', error);

    // Log error
    try {
      const { data: assignment } = await supabase
        .from('punch_list_assignments')
        .select('punch_list_items(voice_message_id)')
        .eq('id', assignmentId)
        .single();

      if (assignment?.punch_list_items) {
        await supabase.from('voice_processing_logs').insert({
          voice_message_id: (assignment.punch_list_items as any).voice_message_id,
          stage: 'notification',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          details: { assignment_id: assignmentId }
        });
      }
    } catch (logError) {
      console.error('Failed to log SMS error:', logError);
    }

    return {
      success: false,
      error
    };
  }
}

/**
 * Process contractor SMS responses (webhook handler)
 */
export async function processContractorSMSResponse(
  fromPhone: string, 
  messageBody: string, 
  twilioMessageSid: string
): Promise<void> {
  try {
    const formattedPhone = formatPhoneNumber(fromPhone);
    
    // Find contractor by phone number
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('phone', formattedPhone)
      .single();

    if (contractorError || !contractor) {
      console.log(`SMS from unknown number: ${formattedPhone}`);
      return;
    }

    // Find most recent pending assignment for this contractor
    const { data: assignments, error: assignmentError } = await supabase
      .from('punch_list_assignments')
      .select(`
        *,
        punch_list_items(description),
        projects(title)
      `)
      .eq('contractor_id', contractor.id)
      .eq('contractor_response', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (assignmentError || !assignments?.length) {
      // Send help message if no pending assignments
      await sendSMS({
        to: formattedPhone,
        message: `Hi! You don't have any pending punch list items. If you need help, call ${process.env.ADMIN_PHONE}.`
      });
      return;
    }

    const assignment = assignments[0];
    const response = messageBody.trim().toLowerCase();

    // Process different response types
    if (response.includes('accept') || response.includes('yes') || response.includes('ok')) {
      // Contractor accepts the task
      await supabase
        .from('punch_list_assignments')
        .update({
          contractor_response: 'accepted',
          contractor_response_at: new Date().toISOString(),
          contractor_notes: messageBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      // Send confirmation
      const confirmationMessage = punchListSMSTemplates.acceptedFollowUp({
        assignmentId: assignment.id,
        contractorPhone: formattedPhone,
        contractorName: contractor.business_name,
        projectTitle: assignment.projects.title,
        homeownerName: '',
        punchListDescription: assignment.punch_list_items.description,
        priority: 'medium'
      });

      await sendSMS({
        to: formattedPhone,
        message: confirmationMessage
      });

    } else if (response.includes('decline') || response.includes('no') || response.includes('pass')) {
      // Contractor declines the task
      await supabase
        .from('punch_list_assignments')
        .update({
          contractor_response: 'declined',
          contractor_response_at: new Date().toISOString(),
          contractor_notes: messageBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      // Mark punch list item for reassignment
      await supabase
        .from('punch_list_items')
        .update({
          status: 'extracted', // Back to extracted for reassignment
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.punch_list_item_id);

      // Send acknowledgment
      await sendSMS({
        to: formattedPhone,
        message: `Thanks for letting us know. The task "${assignment.punch_list_items.description}" will be assigned to another contractor.`
      });

    } else if (response.includes('info') || response.includes('details') || response.includes('materials')) {
      // Contractor requests more information
      const smsOptions: PunchListSMSOptions = {
        assignmentId: assignment.id,
        contractorPhone: formattedPhone,
        contractorName: contractor.business_name,
        projectTitle: assignment.projects.title,
        homeownerName: '',
        punchListDescription: assignment.punch_list_items.description,
        priority: 'medium',
        materialsNeeded: assignment.punch_list_items?.materials_needed || []
      };

      const infoMessage = punchListSMSTemplates.materialsInfo(smsOptions);
      
      await sendSMS({
        to: formattedPhone,
        message: infoMessage
      });

    } else if (response.includes('started') || response.includes('begin')) {
      // Contractor started work
      await supabase
        .from('punch_list_assignments')
        .update({
          contractor_notes: (assignment.contractor_notes || '') + `\n[Started: ${new Date().toLocaleString()}] ${messageBody}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      await sendSMS({
        to: formattedPhone,
        message: `Great! Work started on "${assignment.punch_list_items.description}". Homeowner has been notified. Text "COMPLETED" when finished.`
      });

    } else if (response.includes('completed') || response.includes('done') || response.includes('finished')) {
      // Contractor completed work
      await supabase
        .from('punch_list_assignments')
        .update({
          contractor_response: 'completed',
          actual_completion_at: new Date().toISOString(),
          contractor_notes: (assignment.contractor_notes || '') + `\n[Completed: ${new Date().toLocaleString()}] ${messageBody}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      // Update punch list item status
      await supabase
        .from('punch_list_items')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.punch_list_item_id);

      // Send completion confirmation
      const completionMessage = punchListSMSTemplates.completionConfirmation({
        assignmentId: assignment.id,
        contractorPhone: formattedPhone,
        contractorName: contractor.business_name,
        projectTitle: assignment.projects.title,
        homeownerName: '',
        punchListDescription: assignment.punch_list_items.description,
        priority: 'medium'
      });

      await sendSMS({
        to: formattedPhone,
        message: completionMessage
      });

    } else {
      // Unrecognized response - provide help
      await sendSMS({
        to: formattedPhone,
        message: `I didn't understand your response. Please reply with:\n• "ACCEPT" - to take the task\n• "DECLINE" - to pass\n• "INFO" - for more details\n• "STARTED" - when beginning work\n• "COMPLETED" - when finished\n\nCurrent task: "${assignment.punch_list_items.description}"`
      });
    }

  } catch (error) {
    console.error('Error processing contractor SMS response:', error);
    
    // Send error message to contractor
    try {
      await sendSMS({
        to: fromPhone,
        message: `Sorry, there was an error processing your message. Please call ${process.env.ADMIN_PHONE} for assistance.`
      });
    } catch (smsError) {
      console.error('Failed to send error SMS:', smsError);
    }
  }
}

/**
 * Send reminders for unresponded assignments
 */
export async function sendPunchListReminders(): Promise<void> {
  try {
    // Find assignments pending for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: pendingAssignments, error } = await supabase
      .from('punch_list_assignments')
      .select(`
        *,
        punch_list_items(description, priority),
        contractors(business_name, phone)
      `)
      .eq('contractor_response', 'pending')
      .lt('created_at', oneHourAgo)
      .is('notification_sent_at', null); // Only send reminder once

    if (error) {
      console.error('Failed to fetch pending assignments for reminders:', error);
      return;
    }

    if (!pendingAssignments?.length) {
      console.log('No pending assignments need reminders');
      return;
    }

    console.log(`Sending ${pendingAssignments.length} punch list reminders`);

    for (const assignment of pendingAssignments) {
      try {
        const smsOptions: PunchListSMSOptions = {
          assignmentId: assignment.id,
          contractorPhone: assignment.contractors.phone,
          contractorName: assignment.contractors.business_name,
          projectTitle: '',
          homeownerName: '',
          punchListDescription: assignment.punch_list_items.description,
          priority: assignment.punch_list_items.priority
        };

        const reminderMessage = punchListSMSTemplates.punchListReminder(smsOptions);
        
        const smsResult = await sendSMS({
          to: formatPhoneNumber(assignment.contractors.phone),
          message: reminderMessage
        });

        if (smsResult.success) {
          // Mark reminder as sent
          await supabase
            .from('punch_list_assignments')
            .update({
              notification_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);
        }

      } catch (error) {
        console.error(`Failed to send reminder for assignment ${assignment.id}:`, error);
      }
    }

  } catch (error) {
    console.error('Error sending punch list reminders:', error);
  }
}

/**
 * Batch process assignments for SMS notifications
 */
export async function processAssignmentsForSMS(limit: number = 5): Promise<void> {
  // Get assignments that need SMS notifications
  const { data: assignments, error } = await supabase
    .from('punch_list_assignments')
    .select('id')
    .eq('contractor_response', 'pending')
    .is('notification_sent_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch assignments for SMS:', error);
    return;
  }

  if (!assignments?.length) {
    console.log('No assignments ready for SMS notification');
    return;
  }

  console.log(`Processing ${assignments.length} assignments for SMS notification`);

  for (const assignment of assignments) {
    try {
      const result = await sendPunchListAssignmentSMS(assignment.id);
      if (result.success) {
        console.log(`Successfully sent SMS for assignment ${assignment.id}`);
      } else {
        console.error(`Failed to send SMS for assignment ${assignment.id}:`, result.error);
      }
    } catch (error) {
      console.error(`Error processing SMS for assignment ${assignment.id}:`, error);
    }
  }
}