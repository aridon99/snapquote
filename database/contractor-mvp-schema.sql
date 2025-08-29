-- Contractor MVP Schema
-- Complete schema for contractor onboarding and pricing system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard work items for plumbers and electricians
CREATE TABLE IF NOT EXISTS standard_work_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade TEXT NOT NULL CHECK (trade IN ('plumber', 'electrician', 'both')),
    category TEXT NOT NULL, -- 'fixtures', 'repairs', 'installation', etc
    item_code TEXT UNIQUE NOT NULL, -- 'PLUMB_TOILET_INSTALL', 'ELEC_OUTLET_REPLACE'
    item_name TEXT NOT NULL,
    description TEXT,
    typical_time_hours DECIMAL(5,2),
    complexity TEXT CHECK (complexity IN ('simple', 'standard', 'complex')) DEFAULT 'standard',
    requires_permit BOOLEAN DEFAULT false,
    is_emergency BOOLEAN DEFAULT false,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contractor WhatsApp verification and onboarding status
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS trade TEXT CHECK (trade IN ('plumber', 'electrician', 'both'));
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS whatsapp_opt_in_date TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' 
    CHECK (onboarding_status IN ('pending', 'phone_verified', 'prices_importing', 'interview_active', 'completed'));
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS google_sheet_id TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;

-- Contractor price items (their specific pricing)
CREATE TABLE IF NOT EXISTS contractor_price_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    standard_item_id UUID REFERENCES standard_work_items(id),
    custom_description TEXT, -- For non-standard items
    labor_cost DECIMAL(10,2),
    material_cost DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    minimum_charge DECIMAL(10,2),
    time_estimate_hours DECIMAL(5,2),
    price_valid_until DATE,
    notes TEXT,
    confidence_score DECIMAL(3,2), -- How confident GPT was in extraction (0-1)
    source TEXT CHECK (source IN ('manual', 'invoice', 'csv', 'whatsapp', 'interview', 'google_sheet')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contractor_id, standard_item_id)
);

-- Uploaded contractor invoices
CREATE TABLE IF NOT EXISTS contractor_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    upload_source TEXT CHECK (upload_source IN ('whatsapp', 'web', 'email')),
    whatsapp_message_id TEXT,
    processing_status TEXT DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_data JSONB, -- Raw GPT extraction
    extracted_items_count INTEGER,
    processing_error TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp conversation sessions
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    whatsapp_number TEXT NOT NULL,
    session_type TEXT CHECK (session_type IN ('verification', 'invoice_upload', 'interview', 'price_update', 'general')),
    current_question_id UUID, -- For interview flow
    context JSONB, -- Conversation state and data
    last_message_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interview questions for missing items
CREATE TABLE IF NOT EXISTS contractor_interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    standard_item_id UUID REFERENCES standard_work_items(id),
    question_text TEXT NOT NULL,
    question_order INTEGER,
    response_received BOOLEAN DEFAULT false,
    response_text TEXT,
    response_price DECIMAL(10,2),
    asked_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Track onboarding progress
CREATE TABLE IF NOT EXISTS contractor_onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMP,
    invoices_uploaded INTEGER DEFAULT 0,
    first_invoice_at TIMESTAMP,
    items_extracted INTEGER DEFAULT 0,
    items_manually_added INTEGER DEFAULT 0,
    interview_questions_total INTEGER DEFAULT 0,
    interview_questions_answered INTEGER DEFAULT 0,
    google_sheet_connected BOOLEAN DEFAULT false,
    google_sheet_connected_at TIMESTAMP,
    profile_complete BOOLEAN DEFAULT false,
    profile_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert standard plumber tasks
INSERT INTO standard_work_items (trade, category, item_code, item_name, description, typical_time_hours, complexity) VALUES
-- Fixtures
('plumber', 'fixtures', 'PLUMB_TOILET_INSTALL', 'Install/Replace Toilet', 'Remove old and install new toilet', 2.0, 'standard'),
('plumber', 'fixtures', 'PLUMB_FAUCET_KITCHEN', 'Install Kitchen Faucet', 'Install new kitchen faucet', 1.5, 'standard'),
('plumber', 'fixtures', 'PLUMB_FAUCET_BATH', 'Install Bathroom Faucet', 'Install new bathroom faucet', 1.0, 'standard'),
('plumber', 'fixtures', 'PLUMB_SINK_KITCHEN', 'Install Kitchen Sink', 'Install new kitchen sink', 2.5, 'standard'),
('plumber', 'fixtures', 'PLUMB_SINK_BATH', 'Install Bathroom Sink', 'Install new bathroom sink', 2.0, 'standard'),
('plumber', 'fixtures', 'PLUMB_DISPOSAL', 'Install Garbage Disposal', 'Install new garbage disposal unit', 1.5, 'standard'),
('plumber', 'fixtures', 'PLUMB_SHOWER_HEAD', 'Replace Shower Head', 'Install new shower head', 0.5, 'simple'),
('plumber', 'fixtures', 'PLUMB_TUB_SPOUT', 'Replace Tub Spout', 'Install new tub spout', 0.5, 'simple'),

-- Repairs
('plumber', 'repairs', 'PLUMB_LEAK_MINOR', 'Fix Minor Leak', 'Repair minor leak under sink', 1.0, 'simple'),
('plumber', 'repairs', 'PLUMB_LEAK_MAJOR', 'Fix Major Leak', 'Repair major leak in wall/ceiling', 3.0, 'complex'),
('plumber', 'repairs', 'PLUMB_DRAIN_UNCLOG', 'Unclog Drain', 'Clear clogged sink or tub drain', 1.0, 'simple'),
('plumber', 'repairs', 'PLUMB_TOILET_UNCLOG', 'Unclog Toilet', 'Clear clogged toilet', 1.0, 'simple'),
('plumber', 'repairs', 'PLUMB_MAIN_SNAKE', 'Snake Main Line', 'Clear main sewer line', 2.5, 'standard'),

-- Valves & Pipes
('plumber', 'valves', 'PLUMB_SHUTOFF_VALVE', 'Install Shut-off Valve', 'Install new shut-off valve', 1.0, 'standard'),
('plumber', 'valves', 'PLUMB_PTRAP', 'Replace P-Trap', 'Replace P-trap under sink', 1.0, 'simple'),
('plumber', 'valves', 'PLUMB_SUPPLY_LINE', 'Replace Supply Line', 'Replace water supply line', 0.5, 'simple'),
('plumber', 'valves', 'PLUMB_PRESSURE_REG', 'Replace Pressure Regulator', 'Install new pressure regulator', 2.0, 'standard'),

-- Water Heaters
('plumber', 'water_heater', 'PLUMB_WH_40GAL', 'Install 40-Gal Water Heater', 'Remove old and install new 40-gal tank', 3.0, 'standard'),
('plumber', 'water_heater', 'PLUMB_WH_50GAL', 'Install 50-Gal Water Heater', 'Remove old and install new 50-gal tank', 3.5, 'standard'),
('plumber', 'water_heater', 'PLUMB_WH_TANKLESS', 'Install Tankless Water Heater', 'Install new tankless water heater', 4.0, 'complex'),

-- Bathroom Specific
('plumber', 'bathroom', 'PLUMB_SHOWER_VALVE', 'Replace Shower Valve', 'Replace shower mixing valve', 2.5, 'standard'),
('plumber', 'bathroom', 'PLUMB_BIDET', 'Install Bidet Attachment', 'Install bidet attachment to toilet', 1.0, 'simple'),
('plumber', 'bathroom', 'PLUMB_WAX_RING', 'Replace Wax Ring', 'Replace toilet wax ring seal', 1.5, 'standard'),

-- Insert standard electrician tasks
-- Basic Electrical
('electrician', 'outlets', 'ELEC_OUTLET_REPLACE', 'Replace Standard Outlet', 'Replace existing outlet', 0.5, 'simple'),
('electrician', 'outlets', 'ELEC_OUTLET_NEW', 'Install New Outlet', 'Install new outlet with wiring', 1.5, 'standard'),
('electrician', 'outlets', 'ELEC_GFCI_REPLACE', 'Replace GFCI Outlet', 'Replace existing GFCI outlet', 0.75, 'standard'),
('electrician', 'outlets', 'ELEC_GFCI_NEW', 'Install GFCI Outlet', 'Install new GFCI outlet', 1.5, 'standard'),
('electrician', 'outlets', 'ELEC_USB_OUTLET', 'Install USB Outlet', 'Install outlet with USB ports', 0.75, 'simple'),
('electrician', 'outlets', 'ELEC_240V', 'Install 240V Outlet', 'Install 240V outlet for dryer/range', 2.0, 'standard'),

-- Switches
('electrician', 'switches', 'ELEC_SWITCH_REPLACE', 'Replace Standard Switch', 'Replace existing light switch', 0.5, 'simple'),
('electrician', 'switches', 'ELEC_DIMMER', 'Install Dimmer Switch', 'Replace switch with dimmer', 0.75, 'simple'),
('electrician', 'switches', 'ELEC_3WAY', 'Install 3-Way Switch', 'Install 3-way switch setup', 1.5, 'standard'),
('electrician', 'switches', 'ELEC_SMART_SWITCH', 'Install Smart Switch', 'Install WiFi smart switch', 1.0, 'standard'),

-- Lighting
('electrician', 'lighting', 'ELEC_CEILING_LIGHT', 'Install Ceiling Light', 'Install ceiling light fixture', 1.0, 'standard'),
('electrician', 'lighting', 'ELEC_CEILING_FAN', 'Install Ceiling Fan', 'Install ceiling fan (existing wiring)', 1.5, 'standard'),
('electrician', 'lighting', 'ELEC_CEILING_FAN_NEW', 'Install Ceiling Fan (New Wire)', 'Install ceiling fan with new wiring', 3.0, 'complex'),
('electrician', 'lighting', 'ELEC_RECESSED', 'Install Recessed Light', 'Install single recessed light', 1.0, 'standard'),
('electrician', 'lighting', 'ELEC_UNDER_CABINET', 'Install Under-Cabinet Lighting', 'Install under-cabinet LED strips', 2.0, 'standard'),
('electrician', 'lighting', 'ELEC_PENDANT', 'Install Pendant Light', 'Install pendant light fixture', 1.0, 'standard'),
('electrician', 'lighting', 'ELEC_VANITY', 'Replace Bathroom Vanity Light', 'Replace bathroom vanity fixture', 1.0, 'standard'),

-- Circuit Breakers
('electrician', 'breakers', 'ELEC_BREAKER_15', 'Replace 15-Amp Breaker', 'Replace 15-amp circuit breaker', 0.5, 'simple'),
('electrician', 'breakers', 'ELEC_BREAKER_20', 'Replace 20-Amp Breaker', 'Replace 20-amp circuit breaker', 0.5, 'simple'),
('electrician', 'breakers', 'ELEC_CIRCUIT_NEW', 'Run New 20-Amp Circuit', 'Install new 20-amp circuit', 3.0, 'complex'),
('electrician', 'breakers', 'ELEC_DEDICATED', 'Install Dedicated Circuit', 'Dedicated circuit for appliance', 2.5, 'standard'),

-- Safety
('electrician', 'safety', 'ELEC_SMOKE', 'Install Smoke Detector', 'Install hardwired smoke detector', 1.0, 'standard'),
('electrician', 'safety', 'ELEC_CO', 'Install CO Detector', 'Install carbon monoxide detector', 1.0, 'standard'),
('electrician', 'safety', 'ELEC_SURGE', 'Install Surge Protector', 'Whole-house surge protector', 2.0, 'standard'),

-- Smart Home
('electrician', 'smart', 'ELEC_DOORBELL', 'Install Smart Doorbell', 'Install wired smart doorbell', 1.5, 'standard'),
('electrician', 'smart', 'ELEC_OUTDOOR_OUTLET', 'Install Outdoor Outlet', 'Install weatherproof outdoor outlet', 2.0, 'standard')
ON CONFLICT (item_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_price_items_contractor ON contractor_price_items(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_price_items_standard ON contractor_price_items(standard_item_id);
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_contractor ON contractor_invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_contractor ON whatsapp_sessions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_number ON whatsapp_sessions(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_interview_questions_contractor ON contractor_interview_questions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_standard_items_trade ON standard_work_items(trade);

-- Enable RLS
ALTER TABLE contractor_price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Contractors can view and edit their own price items
CREATE POLICY "Contractors can view own prices"
    ON contractor_price_items FOR SELECT
    USING (contractor_id IN (
        SELECT contractors.id FROM contractors WHERE contractors.id = (
            SELECT c.id FROM contractors c 
            JOIN profiles p ON c.email = p.email 
            WHERE p.id = auth.uid()
        )
    ));

CREATE POLICY "Contractors can update own prices"
    ON contractor_price_items FOR UPDATE
    USING (contractor_id IN (
        SELECT contractors.id FROM contractors WHERE contractors.id = (
            SELECT c.id FROM contractors c 
            JOIN profiles p ON c.email = p.email 
            WHERE p.id = auth.uid()
        )
    ));

-- Similar policies for other tables
CREATE POLICY "Contractors can view own invoices"
    ON contractor_invoices FOR SELECT
    USING (contractor_id IN (
        SELECT contractors.id FROM contractors WHERE contractors.id = (
            SELECT c.id FROM contractors c 
            JOIN profiles p ON c.email = p.email 
            WHERE p.id = auth.uid()
        )
    ));