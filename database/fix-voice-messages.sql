-- Fix the voice_messages table to include transcription
-- Run this in your Supabase SQL Editor

-- Add transcription column if it doesn't exist
ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Check current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'voice_messages' 
ORDER BY ordinal_position;

-- Check current data
SELECT id, project_id, audio_url, transcription, status, created_at 
FROM voice_messages 
ORDER BY created_at DESC 
LIMIT 10;