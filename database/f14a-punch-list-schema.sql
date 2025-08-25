-- F14A Punch List Magic - Voice Processing Schema
-- This schema supports the voice message to contractor SMS workflow

-- Voice messages table for storing incoming WhatsApp voice recordings
CREATE TABLE voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    whatsapp_message_id TEXT UNIQUE, -- WhatsApp message ID for deduplication
    audio_url TEXT NOT NULL, -- URL to stored audio file
    file_size INTEGER,
    duration_seconds INTEGER,
    status TEXT CHECK (status IN ('received', 'transcribing', 'transcribed', 'processed', 'failed')) DEFAULT 'received',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transcriptions table for storing speech-to-text results
CREATE TABLE voice_transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_message_id UUID REFERENCES voice_messages(id) ON DELETE CASCADE,
    transcription_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    language_detected TEXT DEFAULT 'en',
    processing_time_ms INTEGER,
    transcription_service TEXT DEFAULT 'whisper', -- whisper, google, azure, etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- Punch list items extracted from voice messages
CREATE TABLE punch_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    voice_message_id UUID REFERENCES voice_messages(id),
    description TEXT NOT NULL,
    category TEXT, -- extracted category (electrical, plumbing, painting, etc)
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    location TEXT, -- room or area mentioned
    estimated_time TEXT, -- extracted time estimate if mentioned
    materials_needed TEXT[], -- extracted materials list
    contractor_specialty TEXT, -- required contractor type
    status TEXT CHECK (status IN ('extracted', 'assigned', 'notified', 'acknowledged', 'completed')) DEFAULT 'extracted',
    confidence_score DECIMAL(3,2), -- AI extraction confidence
    raw_extraction JSONB, -- full AI response for debugging
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contractor assignments for punch list items
CREATE TABLE punch_list_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punch_list_item_id UUID REFERENCES punch_list_items(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractors(id) NOT NULL,
    project_id UUID REFERENCES projects(id) NOT NULL,
    assignment_method TEXT CHECK (assignment_method IN ('auto_specialty', 'auto_availability', 'manual', 'round_robin')) DEFAULT 'auto_specialty',
    assignment_reason TEXT, -- why this contractor was chosen
    notification_sent_at TIMESTAMP,
    contractor_response TEXT CHECK (contractor_response IN ('pending', 'accepted', 'declined', 'completed')),
    contractor_response_at TIMESTAMP,
    contractor_notes TEXT,
    sms_message_id TEXT, -- Twilio message SID for tracking
    sms_status TEXT, -- delivered, failed, etc
    estimated_completion DATE,
    actual_completion_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Processing logs for debugging and monitoring
CREATE TABLE voice_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_message_id UUID REFERENCES voice_messages(id),
    stage TEXT NOT NULL, -- 'transcription', 'extraction', 'assignment', 'notification'
    status TEXT CHECK (status IN ('started', 'completed', 'failed')),
    details JSONB, -- stage-specific data
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp webhook events for audit trail
CREATE TABLE whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id TEXT UNIQUE, -- WhatsApp webhook event ID
    event_type TEXT NOT NULL, -- message, status, etc
    phone_number TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    voice_message_id UUID REFERENCES voice_messages(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_voice_messages_project ON voice_messages(project_id);
CREATE INDEX idx_voice_messages_status ON voice_messages(status);
CREATE INDEX idx_voice_messages_whatsapp_id ON voice_messages(whatsapp_message_id);
CREATE INDEX idx_voice_transcriptions_message ON voice_transcriptions(voice_message_id);
CREATE INDEX idx_punch_list_items_project ON punch_list_items(project_id);
CREATE INDEX idx_punch_list_items_status ON punch_list_items(status);
CREATE INDEX idx_punch_list_assignments_contractor ON punch_list_assignments(contractor_id);
CREATE INDEX idx_punch_list_assignments_item ON punch_list_assignments(punch_list_item_id);
CREATE INDEX idx_voice_processing_logs_message ON voice_processing_logs(voice_message_id);
CREATE INDEX idx_whatsapp_webhook_events_processed ON whatsapp_webhook_events(processed);

-- Enable Row Level Security
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_list_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Voice messages - project members can view their project's voice messages
CREATE POLICY "Project members can view voice messages"
    ON voice_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND (homeowner_id = auth.uid() OR auth.uid() IN (
            SELECT profiles.id FROM profiles 
            JOIN project_contractors ON profiles.id = project_contractors.contractor_id 
            WHERE project_contractors.project_id = projects.id
        ))
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Voice transcriptions - inherit from voice messages
CREATE POLICY "Project members can view transcriptions"
    ON voice_transcriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM voice_messages vm
        JOIN projects p ON vm.project_id = p.id
        WHERE vm.id = voice_message_id
        AND (p.homeowner_id = auth.uid() OR auth.uid() IN (
            SELECT profiles.id FROM profiles 
            JOIN project_contractors ON profiles.id = project_contractors.contractor_id 
            WHERE project_contractors.project_id = p.id
        ))
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Punch list items - project members can view
CREATE POLICY "Project members can view punch list items"
    ON punch_list_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND (homeowner_id = auth.uid() OR auth.uid() IN (
            SELECT profiles.id FROM profiles 
            JOIN project_contractors ON profiles.id = project_contractors.contractor_id 
            WHERE project_contractors.project_id = projects.id
        ))
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Punch list assignments - contractors can see their assignments
CREATE POLICY "Contractors can view their assignments"
    ON punch_list_assignments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM contractors c
        JOIN profiles p ON c.id = contractor_id
        WHERE p.id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND homeowner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Contractors can update their assignment responses
CREATE POLICY "Contractors can update their assignment responses"
    ON punch_list_assignments FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM contractors c
        JOIN profiles p ON c.id = contractor_id
        WHERE p.id = auth.uid()
    ));

-- Processing logs - admins only for debugging
CREATE POLICY "Admins can view processing logs"
    ON voice_processing_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- WhatsApp webhook events - system use only, admins for debugging
CREATE POLICY "Admins can view webhook events"
    ON whatsapp_webhook_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Allow system to insert into all tables (for API operations)
CREATE POLICY "System can insert voice messages"
    ON voice_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert transcriptions"
    ON voice_transcriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert punch list items"
    ON punch_list_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert assignments"
    ON punch_list_assignments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert processing logs"
    ON voice_processing_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert webhook events"
    ON whatsapp_webhook_events FOR INSERT
    WITH CHECK (true);

-- Allow system to update statuses
CREATE POLICY "System can update voice message status"
    ON voice_messages FOR UPDATE
    USING (true);

CREATE POLICY "System can update punch list status"
    ON punch_list_items FOR UPDATE
    USING (true);

CREATE POLICY "System can update assignment status"
    ON punch_list_assignments FOR UPDATE
    USING (true);

CREATE POLICY "System can update webhook processing"
    ON whatsapp_webhook_events FOR UPDATE
    USING (true);