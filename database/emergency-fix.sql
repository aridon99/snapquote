-- Emergency fix for punch list dashboard
-- Run this in Supabase SQL Editor

-- 1. Add transcription column to voice_messages
ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS transcription TEXT;

-- 2. Check if punch_list_items table has the right columns
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE punch_list_items SET description = item_text WHERE description IS NULL;

-- 3. Check current data
SELECT 'voice_messages' as table_name, COUNT(*) as count FROM voice_messages
UNION ALL
SELECT 'punch_list_items' as table_name, COUNT(*) as count FROM punch_list_items
UNION ALL  
SELECT 'projects' as table_name, COUNT(*) as count FROM projects;

-- 4. Show recent voice messages
SELECT id, transcription, status, created_at 
FROM voice_messages 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Show punch list items if any
SELECT id, item_text, room, trade, status, created_at 
FROM punch_list_items 
ORDER BY created_at DESC 
LIMIT 5;