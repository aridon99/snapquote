-- Create test user for WhatsApp testing
-- Run this in your Supabase SQL Editor

-- First, create a test auth user (if not exists)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'john@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create profile for the test user with your phone number
INSERT INTO profiles (
  id,
  email,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'john@example.com',
  'John Huang',
  '6506425223',  -- Your phone number (without country code)
  'homeowner',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  phone = '6506425223',
  full_name = 'John Huang',
  updated_at = NOW();

-- Create an active project for testing
INSERT INTO projects (
  id,
  homeowner_id,
  title,
  address,
  status,
  created_at,
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Home Renovation Project',
  '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94102"}'::jsonb,
  'in_progress',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'in_progress',
  updated_at = NOW();

-- Verify the data was created
SELECT 
  p.full_name,
  p.phone,
  p.email,
  pr.title as project_title,
  pr.status as project_status
FROM profiles p
LEFT JOIN projects pr ON pr.homeowner_id = p.id
WHERE p.phone = '6506425223';