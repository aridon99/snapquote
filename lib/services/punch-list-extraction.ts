// F14A Punch List AI Extraction Service
// Uses GPT-4o-mini to extract structured punch list items from voice transcriptions

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Schema for punch list item extraction
const PunchListItemSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  location: z.string().optional(),
  estimated_time: z.string().optional(),
  materials_needed: z.array(z.string()).default([]),
  contractor_specialty: z.string().optional(),
  confidence_score: z.number().min(0).max(1)
});

const PunchListExtractionSchema = z.object({
  items: z.array(PunchListItemSchema),
  summary: z.string(),
  total_confidence: z.number().min(0).max(1)
});

export type PunchListItem = z.infer<typeof PunchListItemSchema>;
export type PunchListExtraction = z.infer<typeof PunchListExtractionSchema>;

/**
 * System prompt for punch list extraction
 */
const PUNCH_LIST_SYSTEM_PROMPT = `You are an expert construction project manager specializing in punch list creation from voice messages. Your job is to extract structured punch list items from voice transcriptions of homeowners describing issues they've found during their renovation projects.

CONTEXT: Homeowners send voice messages describing issues, defects, or remaining work items they've noticed in their renovation project. These become "punch list" items that need to be assigned to contractors.

YOUR TASK:
1. Extract each distinct issue/item mentioned in the transcription
2. Categorize each item by trade/specialty (electrical, plumbing, painting, flooring, etc.)
3. Determine priority level based on safety concerns and project impact
4. Extract location information when mentioned
5. Note any time estimates or material needs mentioned
6. Assign confidence scores based on clarity of the transcription

CATEGORIES TO USE:
- electrical: Electrical work, outlets, switches, lighting
- plumbing: Pipes, faucets, toilets, drainage, water issues
- painting: Paint touch-ups, color corrections, wall finishes
- flooring: Floor repairs, tile work, carpet, hardwood issues
- drywall: Wall repairs, texture, patching, holes
- trim: Baseboards, crown molding, door/window trim
- doors: Door hanging, hardware, adjustments
- windows: Window installation, sealing, hardware
- hvac: Heating, ventilation, air conditioning
- fixtures: Light fixtures, cabinet hardware, accessories  
- cleanup: Final cleaning, debris removal
- landscape: Exterior work, landscaping touches
- general: General contractor work not fitting other categories

PRIORITY GUIDELINES:
- urgent: Safety hazards, water damage, major functionality issues
- high: Noticeable defects that affect home use or appearance
- medium: Minor cosmetic issues, small touch-ups
- low: Very minor items, nice-to-have improvements

RESPONSE FORMAT: Always respond with valid JSON matching this exact schema:
{
  "items": [
    {
      "description": "Clear, specific description of the issue",
      "category": "category_name",
      "priority": "low|medium|high|urgent",
      "location": "Room or area if mentioned",
      "estimated_time": "Time estimate if mentioned",
      "materials_needed": ["material1", "material2"],
      "contractor_specialty": "Trade required for this work",
      "confidence_score": 0.95
    }
  ],
  "summary": "Brief summary of all items mentioned",
  "total_confidence": 0.92
}

IMPORTANT: 
- If the transcription is unclear or contains no actionable items, return empty items array
- Confidence score should reflect how clearly the item was described
- Don't make assumptions about work not explicitly mentioned
- Focus on specific, actionable items rather than general comments`;

/**
 * Extract punch list items from transcription text
 */
export async function extractPunchListItems(
  transcription: string,
  projectId: string,
  voiceMessageId: string
): Promise<PunchListExtraction> {
  
  try {
    // Log extraction start
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'extraction',
      status: 'started',
      details: { 
        transcription_length: transcription.length,
        timestamp: new Date().toISOString() 
      }
    });

    const startTime = Date.now();
    
    // Call OpenAI GPT-4o-mini for extraction
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: PUNCH_LIST_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Extract punch list items from this voice transcription:

TRANSCRIPTION: "${transcription}"

Remember to respond with valid JSON only.`
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const processingTime = Date.now() - startTime;

    if (!response.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    let extractionResult: PunchListExtraction;
    try {
      const rawResult = JSON.parse(response.choices[0].message.content);
      extractionResult = PunchListExtractionSchema.parse(rawResult);
    } catch (parseError) {
      console.error('Failed to parse AI extraction result:', parseError);
      throw new Error(`Invalid AI response format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    // Store extracted items in database
    for (const item of extractionResult.items) {
      const { error: insertError } = await supabase
        .from('punch_list_items')
        .insert({
          project_id: projectId,
          voice_message_id: voiceMessageId,
          description: item.description,
          category: item.category,
          priority: item.priority,
          location: item.location,
          estimated_time: item.estimated_time,
          materials_needed: item.materials_needed,
          contractor_specialty: item.contractor_specialty,
          confidence_score: item.confidence_score,
          raw_extraction: response.choices[0].message.content, // Store full AI response
          status: 'extracted'
        });

      if (insertError) {
        console.error('Failed to insert punch list item:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
    }

    // Log successful extraction
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'extraction',
      status: 'completed',
      details: { 
        items_extracted: extractionResult.items.length,
        total_confidence: extractionResult.total_confidence,
        processing_time_ms: processingTime,
        summary: extractionResult.summary
      },
      processing_time_ms: processingTime
    });

    console.log(`Extracted ${extractionResult.items.length} punch list items from voice message ${voiceMessageId}`);
    return extractionResult;

  } catch (error) {
    console.error('Punch list extraction error:', error);
    
    // Log error
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'extraction',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      details: { 
        error_type: error?.constructor?.name || 'UnknownError',
        transcription_preview: transcription.substring(0, 100) + '...'
      }
    });

    throw error;
  }
}

/**
 * Process transcribed voice messages for punch list extraction
 */
export async function processTranscribedMessages(limit: number = 5): Promise<void> {
  // Get transcribed voice messages that haven't been processed yet
  const { data: transcriptions, error } = await supabase
    .from('voice_transcriptions')
    .select(`
      *,
      voice_messages!inner(
        id,
        project_id,
        status
      )
    `)
    .eq('voice_messages.status', 'transcribed')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch transcriptions for extraction:', error);
    return;
  }

  if (!transcriptions?.length) {
    console.log('No transcribed messages ready for punch list extraction');
    return;
  }

  console.log(`Processing ${transcriptions.length} transcriptions for punch list extraction`);

  for (const transcription of transcriptions) {
    try {
      // Extract punch list items
      await extractPunchListItems(
        transcription.transcription_text,
        transcription.voice_messages.project_id,
        transcription.voice_message_id
      );

      // Update voice message status to processed
      await supabase
        .from('voice_messages')
        .update({ 
          status: 'processed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transcription.voice_message_id);

      console.log(`Successfully processed transcription for voice message ${transcription.voice_message_id}`);
      
    } catch (error) {
      console.error(`Failed to extract punch list from voice message ${transcription.voice_message_id}:`, error);
      
      // Update voice message status to failed
      await supabase
        .from('voice_messages')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Punch list extraction failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transcription.voice_message_id);
    }
  }
}

/**
 * Get punch list items for a project
 */
export async function getPunchListItems(projectId: string, status?: string) {
  let query = supabase
    .from('punch_list_items')
    .select(`
      *,
      voice_messages(
        sender_id,
        created_at
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get punch list items: ${error.message}`);
  }

  return data;
}

/**
 * Update punch list item status
 */
export async function updatePunchListItemStatus(itemId: string, status: string, notes?: string) {
  const { error } = await supabase
    .from('punch_list_items')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
      ...(notes && { notes })
    })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to update punch list item: ${error.message}`);
  }
}

/**
 * Get extraction statistics for monitoring
 */
export async function getExtractionStats(projectId?: string) {
  let query = supabase
    .from('punch_list_items')
    .select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get extraction stats: ${error.message}`);
  }

  const stats = {
    total_items: data?.length || 0,
    by_status: {} as Record<string, number>,
    by_category: {} as Record<string, number>,
    by_priority: {} as Record<string, number>,
    avg_confidence: 0
  };

  if (data?.length) {
    // Calculate statistics
    data.forEach(item => {
      stats.by_status[item.status] = (stats.by_status[item.status] || 0) + 1;
      stats.by_category[item.category || 'unknown'] = (stats.by_category[item.category || 'unknown'] || 0) + 1;
      stats.by_priority[item.priority] = (stats.by_priority[item.priority] || 0) + 1;
    });

    const totalConfidence = data.reduce((sum, item) => sum + (item.confidence_score || 0), 0);
    stats.avg_confidence = totalConfidence / data.length;
  }

  return stats;
}