// F14A Punch List Processing API
// Manual trigger and orchestration endpoint for the voice → SMS pipeline

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  processVoiceTranscription, 
  processPendingTranscriptions,
  transcriptionHealthCheck 
} from '@/lib/services/voice-transcription';
import { 
  processTranscribedMessages, 
  getExtractionStats 
} from '@/lib/services/punch-list-extraction';
import { 
  processExtractedItemsForAssignment,
  getAssignmentStats 
} from '@/lib/services/contractor-assignment';
import { 
  processAssignmentsForSMS,
  sendPunchListReminders 
} from '@/lib/services/punch-list-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { authorized: false, error: 'Invalid token' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return { authorized: false, error: 'Admin access required' };
    }

    return { authorized: true, userId: user.id };
  } catch (error) {
    return { authorized: false, error: 'Authentication error' };
  }
}

// Process the entire pipeline for a specific voice message
async function processVoiceMessagePipeline(voiceMessageId: string) {
  const results = {
    transcription: null as any,
    extraction: null as any,
    assignment: null as any,
    sms: null as any,
    errors: [] as string[]
  };

  try {
    // Step 1: Transcription
    console.log(`Step 1: Transcribing voice message ${voiceMessageId}`);
    results.transcription = await processVoiceTranscription(voiceMessageId);
    
    // Step 2: Extraction
    console.log(`Step 2: Processing transcribed message`);
    await processTranscribedMessages(1); // Process just this one
    
    // Step 3: Assignment  
    console.log(`Step 3: Assigning contractors`);
    await processExtractedItemsForAssignment(5);
    
    // Step 4: SMS Notifications
    console.log(`Step 4: Sending SMS notifications`);
    await processAssignmentsForSMS(5);
    
    console.log(`Pipeline completed successfully for voice message ${voiceMessageId}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(errorMessage);
    console.error(`Pipeline error for voice message ${voiceMessageId}:`, error);
  }

  return results;
}

// Get pipeline status and statistics
async function getPipelineStatus() {
  try {
    // Get counts by status
    const { data: voiceMessages } = await supabase
      .from('voice_messages')
      .select('status')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: punchListItems } = await supabase
      .from('punch_list_items')
      .select('status')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: assignments } = await supabase
      .from('punch_list_assignments')
      .select('contractor_response')
      .order('created_at', { ascending: false })
      .limit(100);

    // Count by status
    const voiceStats = voiceMessages?.reduce((acc, vm) => {
      acc[vm.status] = (acc[vm.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const itemStats = punchListItems?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const assignmentStats = assignments?.reduce((acc, assignment) => {
      acc[assignment.contractor_response] = (acc[assignment.contractor_response] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Health check
    const healthCheck = await transcriptionHealthCheck();

    return {
      voice_messages: voiceStats,
      punch_list_items: itemStats,
      assignments: assignmentStats,
      health_check: healthCheck,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    throw error;
  }
}

// POST - Manual pipeline processing
export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await verifyAdminAccess(request);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    const body = await request.json();
    const { action, voice_message_id, limits } = body;

    let results: any = {};

    switch (action) {
      case 'process_transcriptions':
        console.log('Processing pending transcriptions...');
        await processPendingTranscriptions(limits?.transcriptions || 5);
        results.message = 'Transcription processing completed';
        break;

      case 'process_extractions':
        console.log('Processing transcribed messages for extraction...');
        await processTranscribedMessages(limits?.extractions || 5);
        results.message = 'Extraction processing completed';
        break;

      case 'process_assignments':
        console.log('Processing extracted items for assignment...');
        await processExtractedItemsForAssignment(limits?.assignments || 5);
        results.message = 'Assignment processing completed';
        break;

      case 'process_sms':
        console.log('Processing assignments for SMS...');
        await processAssignmentsForSMS(limits?.sms || 5);
        results.message = 'SMS processing completed';
        break;

      case 'send_reminders':
        console.log('Sending punch list reminders...');
        await sendPunchListReminders();
        results.message = 'Reminders sent';
        break;

      case 'process_pipeline':
        console.log('Processing full pipeline...');
        await processPendingTranscriptions(5);
        await processTranscribedMessages(5);  
        await processExtractedItemsForAssignment(10);
        await processAssignmentsForSMS(10);
        results.message = 'Full pipeline processing completed';
        break;

      case 'process_voice_message':
        if (!voice_message_id) {
          return NextResponse.json(
            { error: 'voice_message_id required for this action' },
            { status: 400 }
          );
        }
        console.log(`Processing specific voice message: ${voice_message_id}`);
        results = await processVoiceMessagePipeline(voice_message_id);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: process_transcriptions, process_extractions, process_assignments, process_sms, send_reminders, process_pipeline, or process_voice_message' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline processing error:', error);
    return NextResponse.json(
      { 
        error: 'Pipeline processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Pipeline status and statistics
export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await verifyAdminAccess(request);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const projectId = url.searchParams.get('project_id');

    let results: any = {};

    switch (action) {
      case 'status':
        results = await getPipelineStatus();
        break;

      case 'extraction_stats':
        results = await getExtractionStats(projectId || undefined);
        break;

      case 'assignment_stats':
        results = await getAssignmentStats(undefined, projectId || undefined);
        break;

      case 'health':
        results = await transcriptionHealthCheck();
        break;

      default:
        results = await getPipelineStatus();
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get pipeline status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// HEAD - Health check
export async function HEAD() {
  try {
    const healthCheck = await transcriptionHealthCheck();
    const status = healthCheck.status === 'healthy' ? 200 : 503;
    return new NextResponse('Punch list processing API', { status });
  } catch (error) {
    return new NextResponse('Service unhealthy', { status: 503 });
  }
}