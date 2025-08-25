// F14A Voice Transcription Service
// Handles speech-to-text conversion using Whisper for voice messages

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export interface TranscriptionResult {
  transcription: string;
  confidence: number;
  language: string;
  duration: number;
  processingTime: number;
}

export interface VoiceMessage {
  id: string;
  project_id: string;
  sender_id: string;
  audio_url: string;
  file_size?: number;
  duration_seconds?: number;
  whatsapp_message_id?: string;
}

/**
 * Downloads audio file from URL and saves temporarily
 */
async function downloadAudioFile(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  const tempDir = path.join(process.cwd(), 'tmp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `audio_${Date.now()}.ogg`);
  fs.writeFileSync(tempFilePath, buffer);
  
  return tempFilePath;
}

/**
 * Transcribes audio file using OpenAI Whisper
 */
async function transcribeWithWhisper(audioFilePath: string): Promise<TranscriptionResult> {
  const startTime = Date.now();
  
  try {
    const audioFile = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Can be auto-detected by omitting this
      response_format: "verbose_json",
      timestamp_granularities: ["word"]
    });

    const processingTime = Date.now() - startTime;

    return {
      transcription: transcription.text,
      confidence: 0.95, // Whisper doesn't provide confidence, so we use a default high value
      language: transcription.language || 'en',
      duration: transcription.duration || 0,
      processingTime
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative: Self-hosted Whisper transcription (for cost optimization)
 * This would use the node-whisper package for local processing
 */
async function transcribeWithLocalWhisper(audioFilePath: string): Promise<TranscriptionResult> {
  const startTime = Date.now();
  
  try {
    // Note: This requires Whisper to be installed locally
    // npm install node-whisper requires additional setup
    const whisperModule = await import('node-whisper');
    // Type assertion for the dynamic import
    const whisper = (whisperModule as any).createWhisper();
    
    const result = await whisper.transcribe(audioFilePath);
    const processingTime = Date.now() - startTime;

    return {
      transcription: result.text || '',
      confidence: result.confidence || 0.8,
      language: result.language || 'en',
      duration: result.duration || 0,
      processingTime
    };
  } catch (error) {
    console.error('Local Whisper transcription error:', error);
    // Fallback to OpenAI Whisper if local fails
    return transcribeWithWhisper(audioFilePath);
  }
}

/**
 * Main transcription function - processes voice message and stores result
 */
export async function processVoiceTranscription(voiceMessageId: string): Promise<TranscriptionResult> {
  try {
    // Log processing start
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'transcription',
      status: 'started',
      details: { timestamp: new Date().toISOString() }
    });

    // Update voice message status
    await supabase
      .from('voice_messages')
      .update({ 
        status: 'transcribing',
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    // Get voice message details
    const { data: voiceMessage, error: fetchError } = await supabase
      .from('voice_messages')
      .select('*')
      .eq('id', voiceMessageId)
      .single();

    if (fetchError || !voiceMessage) {
      throw new Error(`Voice message not found: ${fetchError?.message}`);
    }

    // Download audio file
    const audioFilePath = await downloadAudioFile(voiceMessage.audio_url);
    
    let transcriptionResult: TranscriptionResult;
    
    // Choose transcription method based on environment variable
    if (process.env.USE_LOCAL_WHISPER === 'true') {
      transcriptionResult = await transcribeWithLocalWhisper(audioFilePath);
    } else {
      transcriptionResult = await transcribeWithWhisper(audioFilePath);
    }

    // Clean up temporary file
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    // Store transcription result
    const { error: insertError } = await supabase
      .from('voice_transcriptions')
      .insert({
        voice_message_id: voiceMessageId,
        transcription_text: transcriptionResult.transcription,
        confidence_score: transcriptionResult.confidence,
        language_detected: transcriptionResult.language,
        processing_time_ms: transcriptionResult.processingTime,
        transcription_service: process.env.USE_LOCAL_WHISPER === 'true' ? 'whisper-local' : 'whisper-openai'
      });

    if (insertError) {
      throw new Error(`Failed to store transcription: ${insertError.message}`);
    }

    // Update voice message status
    await supabase
      .from('voice_messages')
      .update({ 
        status: 'transcribed',
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    // Log successful completion
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'transcription',
      status: 'completed',
      details: { 
        transcription_length: transcriptionResult.transcription.length,
        confidence: transcriptionResult.confidence,
        processing_time_ms: transcriptionResult.processingTime
      },
      processing_time_ms: transcriptionResult.processingTime
    });

    return transcriptionResult;

  } catch (error) {
    console.error('Voice transcription processing error:', error);
    
    // Log error
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: voiceMessageId,
      stage: 'transcription',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      details: { error_type: error?.constructor?.name || 'UnknownError' }
    });

    // Update voice message status to failed
    await supabase
      .from('voice_messages')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Transcription failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    throw error;
  }
}

/**
 * Batch process multiple voice messages
 */
export async function processPendingTranscriptions(limit: number = 5): Promise<void> {
  const { data: pendingMessages, error } = await supabase
    .from('voice_messages')
    .select('id')
    .eq('status', 'received')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch pending transcriptions:', error);
    return;
  }

  if (!pendingMessages?.length) {
    console.log('No pending voice messages to transcribe');
    return;
  }

  console.log(`Processing ${pendingMessages.length} voice messages for transcription`);

  // Process them sequentially to avoid overwhelming the system
  for (const message of pendingMessages) {
    try {
      await processVoiceTranscription(message.id);
      console.log(`Successfully transcribed voice message ${message.id}`);
    } catch (error) {
      console.error(`Failed to transcribe voice message ${message.id}:`, error);
      // Continue with next message
    }
  }
}

/**
 * Get transcription for a voice message
 */
export async function getTranscription(voiceMessageId: string) {
  const { data, error } = await supabase
    .from('voice_transcriptions')
    .select('*')
    .eq('voice_message_id', voiceMessageId)
    .single();

  if (error) {
    throw new Error(`Failed to get transcription: ${error.message}`);
  }

  return data;
}

/**
 * Health check for transcription service
 */
export async function transcriptionHealthCheck() {
  try {
    // Test OpenAI connection
    const openaiTest = await openai.models.list();
    
    // Test Supabase connection
    const { data, error } = await supabase
      .from('voice_messages')
      .select('count(*)')
      .limit(1);

    if (error) throw error;

    return {
      status: 'healthy',
      openai_connected: !!openaiTest,
      supabase_connected: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}