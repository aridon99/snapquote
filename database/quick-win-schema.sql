-- Quick Win Practice Quote Schema
-- Extends the contractor MVP schema with Quick Win functionality

-- Add Quick Win completion tracking to onboarding progress
ALTER TABLE contractor_onboarding_progress 
ADD COLUMN IF NOT EXISTS quick_win_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quick_win_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS quick_win_attempts INTEGER DEFAULT 0;

-- Practice quotes table
CREATE TABLE IF NOT EXISTS contractor_practice_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    voice_message_id TEXT, -- Twilio message SID
    transcription TEXT,
    quote_data JSONB NOT NULL, -- Full quote structure from GPT
    pdf_url TEXT,
    processing_status TEXT DEFAULT 'completed' 
        CHECK (processing_status IN ('processing', 'completed', 'failed')),
    confidence_score DECIMAL(3,2),
    total_amount DECIMAL(10,2),
    item_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_quotes_contractor ON contractor_practice_quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_practice_quotes_created ON contractor_practice_quotes(created_at);

-- Add RLS policies
ALTER TABLE contractor_practice_quotes ENABLE ROW LEVEL SECURITY;

-- Contractors can only see their own practice quotes
CREATE POLICY contractor_practice_quotes_select_own 
ON contractor_practice_quotes FOR SELECT 
USING (
    contractor_id IN (
        SELECT id FROM contractors WHERE auth.uid() = id
    )
);

-- Allow contractors to insert their own practice quotes
CREATE POLICY contractor_practice_quotes_insert_own 
ON contractor_practice_quotes FOR INSERT 
WITH CHECK (
    contractor_id IN (
        SELECT id FROM contractors WHERE auth.uid() = id
    )
);

-- Sample data for testing (optional)
-- INSERT INTO contractor_practice_quotes (contractor_id, transcription, quote_data, total_amount, item_count)
-- SELECT 
--     c.id,
--     'Front bathroom needs a new faucet, labor is three fifty and faucet will be two hundred. Wobbly toilet needs resetting, which is two fifty labor and fifty for a new wax ring.',
--     '{
--         "quote_items": [
--             {
--                 "description": "Kitchen Faucet Installation",
--                 "labor_cost": 350.00,
--                 "material_cost": 200.00,
--                 "total": 550.00,
--                 "notes": "Standard installation"
--             },
--             {
--                 "description": "Toilet Reset and Repair",
--                 "labor_cost": 250.00,
--                 "material_cost": 50.00,
--                 "total": 300.00,
--                 "notes": "Includes new wax ring"
--             }
--         ],
--         "total_labor": 600.00,
--         "total_materials": 250.00,
--         "grand_total": 850.00,
--         "confidence_score": 0.95
--     }',
--     850.00,
--     2
-- FROM contractors c 
-- WHERE c.trade IN ('plumber', 'both') 
-- LIMIT 3;

-- Add comments
COMMENT ON TABLE contractor_practice_quotes IS 'Stores Quick Win practice quotes generated during contractor onboarding';
COMMENT ON COLUMN contractor_practice_quotes.quote_data IS 'Full JSON structure of the quote as returned by GPT processing';
COMMENT ON COLUMN contractor_practice_quotes.confidence_score IS 'AI confidence score for the price extraction (0.0 to 1.0)';
COMMENT ON COLUMN contractor_practice_quotes.voice_message_id IS 'Twilio message SID for the voice recording';