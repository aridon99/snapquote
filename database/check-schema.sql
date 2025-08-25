-- Check the actual schema of punch_list_items table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'punch_list_items' 
ORDER BY ordinal_position;

-- Also check voice_messages
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'voice_messages' 
ORDER BY ordinal_position;