-- Migration script to convert V1 to V2 multi-tenant architecture
-- Run this in your Supabase SQL editor

BEGIN;

-- Step 1: Create new V2 tables

-- Tenants table (for multi-tenant isolation)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('homeowner', 'admin')) DEFAULT 'homeowner',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions (Full audit trail)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID,
    type TEXT CHECK (type IN ('material_deposit', 'material_purchase', 'milestone', 'advisory_fee', 'refund')),
    status TEXT CHECK (status IN ('pending', 'held_escrow', 'processing', 'completed', 'failed', 'refunded')),
    amount DECIMAL(10,2) NOT NULL,
    from_party TEXT NOT NULL, -- 'homeowner'
    to_party TEXT, -- 'contractor_name' or 'vendor' or 'advisor'
    contractor_id UUID REFERENCES contractors(id),
    stripe_payment_intent_id TEXT,
    stripe_account_id TEXT,
    escrow_release_approved_by UUID REFERENCES profiles(id),
    escrow_release_approved_at TIMESTAMP,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Material purchases (Track savings)
CREATE TABLE IF NOT EXISTS material_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID,
    vendor_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    retail_price DECIMAL(10,2),
    our_price DECIMAL(10,2) NOT NULL,
    savings_amount DECIMAL(10,2) GENERATED ALWAYS AS (retail_price - our_price) STORED,
    receipt_url TEXT,
    delivery_date DATE,
    delivery_status TEXT CHECK (delivery_status IN ('pending', 'scheduled', 'delivered')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Milestone definitions
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completion_date DATE,
    payment_percentage DECIMAL(5,2),
    payment_amount DECIMAL(10,2),
    contractor_id UUID REFERENCES contractors(id),
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'paid')),
    payment_status TEXT CHECK (payment_status IN ('not_due', 'due', 'overdue', 'paid')),
    auto_approve_payment BOOLEAN DEFAULT false,
    photos TEXT[],
    completed_items TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trust indicators (Public display)
CREATE TABLE IF NOT EXISTS trust_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_type TEXT CHECK (credential_type IN ('bond', 'insurance', 'license', 'certification', 'membership')),
    credential_name TEXT NOT NULL,
    credential_number TEXT,
    issuing_body TEXT,
    issue_date DATE,
    expiry_date DATE,
    verification_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Case studies (Public marketing)
CREATE TABLE IF NOT EXISTS case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    client_type TEXT, -- 'Senior Engineer at Meta'
    location TEXT, -- 'Palo Alto'
    project_type TEXT,
    challenge TEXT,
    solution TEXT,
    timeline_weeks INTEGER,
    budget_range TEXT,
    roi_percentage DECIMAL(5,2),
    testimonial TEXT,
    testimonial_author TEXT,
    before_photos TEXT[],
    after_photos TEXT[],
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    reminder_number INTEGER,
    sent_at TIMESTAMP,
    response_received BOOLEAN DEFAULT false,
    reminder_type TEXT CHECK (reminder_type IN ('email', 'sms', 'phone', 'in_app'))
);

-- Step 2: Add tenant_id columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 3: Add new columns for V2 features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trusted_for_autopay BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS material_budget DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS material_spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advisory_fee DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS escrow_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS permit_requirements JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chatbot_context JSONB;

-- Update project status enum to include payment_pending
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('intake', 'planning', 'contractor_selection', 'in_progress', 'completed', 'on_hold', 'payment_pending'));

-- Add contractor enhancements
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS license_type TEXT CHECK (license_type IN ('licensed', 'handyman', 'specialty'));
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 100;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add sender_name to messages for advisor branding
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_milestone_update BOOLEAN DEFAULT false;

-- Step 4: Create default tenants
-- Create admin tenant
INSERT INTO tenants (id, type) 
SELECT gen_random_uuid(), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE type = 'admin');

-- Create homeowner tenants (one per existing homeowner profile)
INSERT INTO tenants (id, type)
SELECT gen_random_uuid(), 'homeowner'
FROM profiles p
WHERE p.role = 'homeowner' 
AND NOT EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = p.tenant_id
);

-- Step 5: Assign tenant_id to existing profiles
-- Update admin profiles
UPDATE profiles
SET tenant_id = (SELECT id FROM tenants WHERE type = 'admin' LIMIT 1)
WHERE role = 'admin' AND tenant_id IS NULL;

-- Assign each homeowner their own tenant
WITH homeowner_tenants AS (
    SELECT 
        p.id as profile_id,
        t.id as tenant_id,
        ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
    FROM profiles p
    CROSS JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM tenants 
        WHERE type = 'homeowner'
    ) t
    WHERE p.role = 'homeowner' 
    AND p.tenant_id IS NULL
    AND p.rn = t.rn
)
UPDATE profiles p
SET tenant_id = ht.tenant_id
FROM homeowner_tenants ht
WHERE p.id = ht.profile_id;

-- Step 6: Propagate tenant_id to related tables
UPDATE projects p
SET tenant_id = prof.tenant_id
FROM profiles prof
WHERE p.homeowner_id = prof.id
AND p.tenant_id IS NULL;

UPDATE messages m
SET tenant_id = p.tenant_id
FROM projects p
WHERE m.project_id = p.id
AND m.tenant_id IS NULL;

UPDATE budget_items bi
SET tenant_id = p.tenant_id
FROM projects p
WHERE bi.project_id = p.id
AND bi.tenant_id IS NULL;

UPDATE project_files pf
SET tenant_id = p.tenant_id
FROM projects p
WHERE pf.project_id = p.id
AND pf.tenant_id IS NULL;

-- Update payment_transactions tenant_id
UPDATE payment_transactions pt
SET tenant_id = p.tenant_id
FROM projects p
WHERE pt.project_id = p.id
AND pt.tenant_id IS NULL;

-- Update material_purchases tenant_id
UPDATE material_purchases mp
SET tenant_id = p.tenant_id
FROM projects p
WHERE mp.project_id = p.id
AND mp.tenant_id IS NULL;

-- Update project_milestones tenant_id
UPDATE project_milestones pm
SET tenant_id = p.tenant_id
FROM projects p
WHERE pm.project_id = p.id
AND pm.tenant_id IS NULL;

-- Step 7: Make tenant_id NOT NULL after population
ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE budget_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE project_files ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payment_transactions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE material_purchases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE project_milestones ALTER COLUMN tenant_id SET NOT NULL;

-- Step 8: Add foreign key constraints
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE projects 
ADD CONSTRAINT fk_projects_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add similar constraints for other tables
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE payment_transactions 
ADD CONSTRAINT fk_payments_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE material_purchases 
ADD CONSTRAINT fk_materials_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE project_milestones 
ADD CONSTRAINT fk_milestones_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_tenant ON budget_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_tenant ON material_purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_milestones_tenant ON project_milestones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_tenant ON project_files(tenant_id);

-- Step 10: Enable Row Level Security on new tables
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Step 11: Update RLS policies for tenant isolation
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Homeowners can view own projects" ON projects;
DROP POLICY IF EXISTS "Homeowners can create projects" ON projects;
DROP POLICY IF EXISTS "Project members can view messages" ON messages;
DROP POLICY IF EXISTS "Project members can send messages" ON messages;

-- Create comprehensive tenant isolation policies
CREATE POLICY "Tenant isolation for profiles"
ON profiles FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for projects"
ON projects FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for messages"
ON messages FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for budget_items"
ON budget_items FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for project_files"
ON project_files FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for payments"
ON payment_transactions FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for materials"
ON material_purchases FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Tenant isolation for milestones"
ON project_milestones FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 12: Create functions for automated processes
CREATE OR REPLACE FUNCTION update_project_spent()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM payment_transactions 
        WHERE project_id = NEW.project_id 
        AND status = 'completed'
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_material_spent()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET material_spent = (
        SELECT COALESCE(SUM(our_price), 0) 
        FROM material_purchases 
        WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_spent_on_payment ON payment_transactions;
CREATE TRIGGER update_spent_on_payment
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_project_spent();

DROP TRIGGER IF EXISTS update_material_spent_trigger ON material_purchases;
CREATE TRIGGER update_material_spent_trigger
AFTER INSERT OR UPDATE OR DELETE ON material_purchases
FOR EACH ROW EXECUTE FUNCTION update_material_spent();

-- Step 13: Insert sample trust credentials
INSERT INTO trust_credentials (credential_type, credential_name, credential_number, issuing_body, issue_date, expiry_date, is_active, display_order) VALUES
('bond', '$50,000 Performance Bond', 'BOND-2024-001', 'Surety Partners Inc', '2024-01-01', '2025-01-01', true, 1),
('insurance', '$2M General Liability', 'INS-GL-2024-001', 'State Farm Business', '2024-01-01', '2025-01-01', true, 2),
('license', 'California Contractors License', 'CA-1234567', 'California State License Board', '2020-01-01', '2026-01-01', true, 3),
('certification', 'BBB Accredited Business', 'BBB-A+', 'Better Business Bureau', '2023-01-01', null, true, 4),
('membership', 'Nextdoor Neighborhood Favorite', 'NEXTDOOR-2024', 'Nextdoor Inc', '2024-01-01', '2025-01-01', true, 5);

-- Step 14: Insert sample case studies
INSERT INTO case_studies (title, client_type, location, project_type, challenge, solution, timeline_weeks, budget_range, roi_percentage, testimonial, testimonial_author, before_photos, after_photos, featured, published) VALUES
('Modern Kitchen Transformation', 'Senior Engineer at Meta', 'Palo Alto', 'Kitchen Renovation', 'Outdated 1980s kitchen with poor workflow and storage', 'Complete redesign with modern appliances, quartz countertops, and optimized storage', 8, '$75,000 - $100,000', 25.5, 'The project was managed flawlessly. Every detail was handled professionally and we saved thousands on materials.', 'Sarah Chen', ARRAY['before1.jpg', 'before2.jpg'], ARRAY['after1.jpg', 'after2.jpg'], true, true),
('Master Bath Spa Retreat', 'VP Engineering at Google', 'Mountain View', 'Bathroom Renovation', 'Small, cramped bathroom with outdated fixtures', 'Luxurious spa-like bathroom with walk-in shower, soaking tub, and premium finishes', 6, '$50,000 - $75,000', 30.2, 'Incredible attention to detail. The project finished on time and under budget.', 'Michael Rodriguez', ARRAY['bath_before1.jpg'], ARRAY['bath_after1.jpg', 'bath_after2.jpg'], true, true);

COMMIT;

-- Verification queries
SELECT 'Migration completed successfully!';

SELECT 'Profiles without tenant_id:' as check_type, COUNT(*) as count
FROM profiles WHERE tenant_id IS NULL
UNION ALL
SELECT 'Projects without tenant_id:', COUNT(*) 
FROM projects WHERE tenant_id IS NULL
UNION ALL
SELECT 'Messages without tenant_id:', COUNT(*) 
FROM messages WHERE tenant_id IS NULL;

SELECT 'Tenant distribution:' as info;
SELECT t.type, COUNT(p.id) as profile_count
FROM tenants t
LEFT JOIN profiles p ON p.tenant_id = t.id
GROUP BY t.type;

SELECT 'Trust credentials loaded:' as info, COUNT(*) as count FROM trust_credentials;
SELECT 'Case studies loaded:' as info, COUNT(*) as count FROM case_studies;