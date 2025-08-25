-- Test contractor data for demonstrating visual enhancements
-- This creates a test contractor account you can use to see the enhanced dashboard

-- Insert test profile (assuming auth user exists - you'll need to replace with actual user ID)
-- For testing purposes, using a placeholder UUID that you can update
INSERT INTO profiles (id, email, role, full_name, phone, created_at) VALUES 
('test-contractor-id', 'test.contractor@example.com', 'contractor', 'Test Contractor', '+1234567890', NOW())
ON CONFLICT (id) DO UPDATE SET 
role = 'contractor',
full_name = 'Test Contractor',
phone = '+1234567890';

-- Insert corresponding contractor record
INSERT INTO contractors (
    id, 
    email, 
    business_name, 
    contact_name, 
    phone, 
    trade, 
    whatsapp_verified, 
    onboarding_status,
    created_at
) VALUES (
    uuid_generate_v4(),
    'test.contractor@example.com',
    'Test Plumbing & Electric Co',
    'Test Contractor',
    '+1234567890',
    'both',
    true,
    'phone_verified',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
business_name = 'Test Plumbing & Electric Co',
contact_name = 'Test Contractor',
trade = 'both',
whatsapp_verified = true,
onboarding_status = 'phone_verified';

-- Insert some mock onboarding progress to show visual indicators
INSERT INTO contractor_onboarding_progress (
    contractor_id,
    phone_verified,
    phone_verified_at,
    invoices_uploaded,
    items_extracted,
    items_manually_added,
    interview_questions_total,
    interview_questions_answered,
    google_sheet_connected,
    profile_complete,
    created_at,
    updated_at
) SELECT 
    c.id,
    true,
    NOW(),
    3,
    12,
    5,
    15,
    8,
    false,
    false,
    NOW(),
    NOW()
FROM contractors c 
WHERE c.email = 'test.contractor@example.com'
ON CONFLICT (contractor_id) DO UPDATE SET
phone_verified = true,
phone_verified_at = NOW(),
invoices_uploaded = 3,
items_extracted = 12,
items_manually_added = 5,
interview_questions_total = 15,
interview_questions_answered = 8,
google_sheet_connected = false,
profile_complete = false,
updated_at = NOW();

-- Add some sample price items to show progress bars
INSERT INTO contractor_price_items (
    contractor_id,
    standard_item_id,
    total_price,
    labor_cost,
    material_cost,
    time_estimate_hours,
    source,
    is_active,
    created_at
) SELECT 
    c.id,
    s.id,
    CASE s.item_code 
        WHEN 'PLUMB_TOILET_INSTALL' THEN 350.00
        WHEN 'PLUMB_FAUCET_REPLACE' THEN 125.00
        WHEN 'ELEC_OUTLET_REPLACE' THEN 85.00
        WHEN 'ELEC_SWITCH_REPLACE' THEN 65.00
        ELSE 100.00
    END,
    CASE s.item_code 
        WHEN 'PLUMB_TOILET_INSTALL' THEN 200.00
        WHEN 'PLUMB_FAUCET_REPLACE' THEN 75.00
        WHEN 'ELEC_OUTLET_REPLACE' THEN 45.00
        WHEN 'ELEC_SWITCH_REPLACE' THEN 35.00
        ELSE 60.00
    END,
    CASE s.item_code 
        WHEN 'PLUMB_TOILET_INSTALL' THEN 150.00
        WHEN 'PLUMB_FAUCET_REPLACE' THEN 50.00
        WHEN 'ELEC_OUTLET_REPLACE' THEN 40.00
        WHEN 'ELEC_SWITCH_REPLACE' THEN 30.00
        ELSE 40.00
    END,
    s.typical_time_hours,
    'manual',
    true,
    NOW()
FROM contractors c
CROSS JOIN standard_work_items s
WHERE c.email = 'test.contractor@example.com'
  AND s.item_code IN ('PLUMB_TOILET_INSTALL', 'PLUMB_FAUCET_REPLACE', 'ELEC_OUTLET_REPLACE', 'ELEC_SWITCH_REPLACE', 'PLUMB_SINK_INSTALL', 'ELEC_CEILING_FAN_INSTALL')
ON CONFLICT (contractor_id, standard_item_id) DO NOTHING;

-- Instructions for testing:
-- 1. Apply the main contractor-mvp-schema.sql first if you haven't
-- 2. Run this test data SQL 
-- 3. Sign up with email: test.contractor@example.com or modify an existing account's role to 'contractor'
-- 4. Navigate to /contractor/dashboard to see the visual enhancements