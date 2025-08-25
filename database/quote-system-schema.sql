-- Quote System Database Schema
-- Run this in your Supabase SQL editor to set up the quote system

-- Quotes table for tracking all quote versions
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    project_description TEXT,
    status TEXT CHECK (status IN ('draft', 'review', 'sent', 'accepted', 'rejected')) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    pdf_url TEXT,
    whatsapp_thread_id TEXT,
    consultation_audio_url TEXT,
    consultation_transcript TEXT
);

-- Quote items for line-by-line details
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    item_code TEXT,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT CHECK (unit IN ('each', 'hour', 'sqft', 'lf', 'job')) DEFAULT 'each',
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    category TEXT CHECK (category IN ('labor', 'material', 'equipment', 'fixtures', 'repairs', 'water_heaters', 'drain', 'emergency', 'inspection', 'other')) DEFAULT 'other',
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quote edits for audit trail
CREATE TABLE IF NOT EXISTS quote_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    edit_type TEXT CHECK (edit_type IN ('price_change', 'add_item', 'remove_item', 'description_change', 'quantity_change', 'bulk_change')),
    voice_transcript TEXT,
    changes_json JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES contractors(id)
);

-- Quote review sessions for WhatsApp interaction tracking
CREATE TABLE IF NOT EXISTS quote_review_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    state TEXT CHECK (state IN ('INITIAL', 'REVIEWING_QUOTE', 'CONFIRMING_CHANGES', 'FINALIZED')) DEFAULT 'INITIAL',
    current_version INTEGER DEFAULT 1,
    pending_changes JSONB,
    whatsapp_thread_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    finalized_at TIMESTAMP
);

-- Quote templates for contractor branding
CREATE TABLE IF NOT EXISTS quote_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE UNIQUE,
    business_name TEXT NOT NULL,
    business_phone TEXT NOT NULL,
    business_email TEXT,
    business_address TEXT,
    license_number TEXT,
    insurance_info TEXT,
    logo_url TEXT,
    terms_and_conditions TEXT,
    payment_terms TEXT,
    warranty_info TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quotes_contractor_id ON quotes(contractor_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_whatsapp_thread ON quotes(whatsapp_thread_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_edits_quote_id ON quote_edits(quote_id);
CREATE INDEX idx_review_sessions_quote_id ON quote_review_sessions(quote_id);
CREATE INDEX idx_review_sessions_thread_id ON quote_review_sessions(whatsapp_thread_id);

-- Function to update quote total when items change
CREATE OR REPLACE FUNCTION update_quote_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotes 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM quote_items 
        WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update quote totals
CREATE TRIGGER update_quote_total_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON quote_items
FOR EACH ROW
EXECUTE FUNCTION update_quote_total();

-- Function to increment quote version on edit
CREATE OR REPLACE FUNCTION increment_quote_version()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotes 
    SET version = version + 1,
        updated_at = NOW()
    WHERE id = NEW.quote_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment version when edits are made
CREATE TRIGGER increment_version_on_edit
AFTER INSERT ON quote_edits
FOR EACH ROW
EXECUTE FUNCTION increment_quote_version();

-- Sample quote template for testing
INSERT INTO quote_templates (
    contractor_id,
    business_name,
    business_phone,
    business_email,
    business_address,
    license_number,
    terms_and_conditions,
    payment_terms,
    warranty_info
) 
SELECT 
    id,
    business_name,
    phone,
    email,
    'Your Business Address Here',
    'LIC123456',
    'Payment due upon completion. We accept cash, check, and major credit cards. All work guaranteed for 1 year.',
    'Net 30',
    '1 Year Labor Warranty • Manufacturer Parts Warranty • 24/7 Emergency Service'
FROM contractors
WHERE email = 'test.contractor@example.com'
ON CONFLICT (contractor_id) DO NOTHING;

-- RLS Policies for security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

-- Contractors can only see their own quotes
CREATE POLICY "Contractors can view own quotes" ON quotes
    FOR ALL USING (contractor_id IN (
        SELECT id FROM contractors WHERE email = auth.email()
    ));

CREATE POLICY "Contractors can view own quote items" ON quote_items
    FOR ALL USING (quote_id IN (
        SELECT id FROM quotes WHERE contractor_id IN (
            SELECT id FROM contractors WHERE email = auth.email()
        )
    ));

CREATE POLICY "Contractors can view own quote edits" ON quote_edits
    FOR ALL USING (quote_id IN (
        SELECT id FROM quotes WHERE contractor_id IN (
            SELECT id FROM contractors WHERE email = auth.email()
        )
    ));

CREATE POLICY "Contractors can view own review sessions" ON quote_review_sessions
    FOR ALL USING (contractor_id IN (
        SELECT id FROM contractors WHERE email = auth.email()
    ));

CREATE POLICY "Contractors can view own templates" ON quote_templates
    FOR ALL USING (contractor_id IN (
        SELECT id FROM contractors WHERE email = auth.email()
    ));