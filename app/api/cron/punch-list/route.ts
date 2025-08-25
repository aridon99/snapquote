// F14A Punch List Cron Job
// Automated processing of the voice → SMS pipeline

import { NextRequest, NextResponse } from 'next/server';
import { 
  processPendingTranscriptions
} from '@/lib/services/voice-transcription';
import { 
  processTranscribedMessages 
} from '@/lib/services/punch-list-extraction';
import { 
  processExtractedItemsForAssignment
} from '@/lib/services/contractor-assignment';
import { 
  processAssignmentsForSMS,
  sendPunchListReminders 
} from '@/lib/services/punch-list-sms';

// Verify cron authentication
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET_KEY;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET_KEY not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// Main pipeline processing function
async function runPipelineProcessing() {
  const results = {
    transcriptions: { processed: 0, errors: 0 },
    extractions: { processed: 0, errors: 0 },
    assignments: { processed: 0, errors: 0 },
    sms: { processed: 0, errors: 0 },
    reminders: { processed: 0, errors: 0 },
    total_duration_ms: 0
  };

  const startTime = Date.now();

  try {
    console.log('Starting automated punch list processing...');

    // Step 1: Process pending transcriptions
    console.log('Step 1: Processing voice transcriptions...');
    try {
      await processPendingTranscriptions(10); // Process up to 10 at a time
      results.transcriptions.processed = 10;
    } catch (error) {
      console.error('Transcription processing error:', error);
      results.transcriptions.errors = 1;
    }

    // Step 2: Extract punch list items from transcriptions
    console.log('Step 2: Extracting punch list items...');
    try {
      await processTranscribedMessages(10);
      results.extractions.processed = 10;
    } catch (error) {
      console.error('Extraction processing error:', error);
      results.extractions.errors = 1;
    }

    // Step 3: Assign contractors to extracted items
    console.log('Step 3: Assigning contractors...');
    try {
      await processExtractedItemsForAssignment(20); // More assignments per run
      results.assignments.processed = 20;
    } catch (error) {
      console.error('Assignment processing error:', error);
      results.assignments.errors = 1;
    }

    // Step 4: Send SMS notifications
    console.log('Step 4: Sending SMS notifications...');
    try {
      await processAssignmentsForSMS(20);
      results.sms.processed = 20;
    } catch (error) {
      console.error('SMS processing error:', error);
      results.sms.errors = 1;
    }

    // Step 5: Send reminders for unresponded assignments
    console.log('Step 5: Sending reminders...');
    try {
      await sendPunchListReminders();
      results.reminders.processed = 1; // Just marking that it ran
    } catch (error) {
      console.error('Reminder processing error:', error);
      results.reminders.errors = 1;
    }

    results.total_duration_ms = Date.now() - startTime;
    
    console.log(`Completed automated processing in ${results.total_duration_ms}ms`);
    console.log('Results:', JSON.stringify(results, null, 2));

    return results;

  } catch (error) {
    console.error('Pipeline processing error:', error);
    results.total_duration_ms = Date.now() - startTime;
    throw error;
  }
}

// POST endpoint for manual triggers and webhooks
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action = 'process_pipeline' } = body;

    let results;

    switch (action) {
      case 'process_pipeline':
        results = await runPipelineProcessing();
        break;

      case 'transcriptions_only':
        await processPendingTranscriptions(10);
        results = { action: 'transcriptions_only', completed: true };
        break;

      case 'extractions_only':
        await processTranscribedMessages(10);
        results = { action: 'extractions_only', completed: true };
        break;

      case 'assignments_only':
        await processExtractedItemsForAssignment(20);
        results = { action: 'assignments_only', completed: true };
        break;

      case 'sms_only':
        await processAssignmentsForSMS(20);
        results = { action: 'sms_only', completed: true };
        break;

      case 'reminders_only':
        await sendPunchListReminders();
        results = { action: 'reminders_only', completed: true };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Cron job error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for health checks
export async function GET(request: NextRequest) {
  try {
    // Basic health check - don't require auth for monitoring
    const url = new URL(request.url);
    const check = url.searchParams.get('check');

    if (check === 'health') {
      return NextResponse.json({
        status: 'healthy',
        service: 'punch-list-cron',
        timestamp: new Date().toISOString()
      });
    }

    // For other requests, require auth
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      service: 'F14A Punch List Processing Cron',
      available_actions: [
        'process_pipeline',
        'transcriptions_only', 
        'extractions_only',
        'assignments_only',
        'sms_only',
        'reminders_only'
      ],
      usage: 'POST with { "action": "process_pipeline" }',
      authentication: 'Bearer token required',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// HEAD endpoint for uptime monitoring
export async function HEAD() {
  return new NextResponse('Punch list cron endpoint healthy', { status: 200 });
}