-- Twilio webhook events table for F14A
-- Tracks SMS delivery status and responses from contractors

CREATE TABLE twilio_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_sid TEXT UNIQUE, -- Twilio message SID
    event_type TEXT NOT NULL, -- delivered, failed, received, etc
    from_phone TEXT,
    to_phone TEXT,
    message_body TEXT,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_twilio_webhook_events_message_sid ON twilio_webhook_events(message_sid);
CREATE INDEX idx_twilio_webhook_events_processed ON twilio_webhook_events(processed);
CREATE INDEX idx_twilio_webhook_events_event_type ON twilio_webhook_events(event_type);
CREATE INDEX idx_twilio_webhook_events_from_phone ON twilio_webhook_events(from_phone);

-- Enable Row Level Security
ALTER TABLE twilio_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - admins only for debugging
CREATE POLICY "Admins can view Twilio webhook events"
    ON twilio_webhook_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Allow system to insert webhook events
CREATE POLICY "System can insert Twilio webhook events"
    ON twilio_webhook_events FOR INSERT
    WITH CHECK (true);