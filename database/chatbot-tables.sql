-- Chatbot and lead tracking tables

-- Leads table for storing lead information from chatbot and other sources
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'evening')) DEFAULT 'afternoon',
    project_type TEXT,
    project_details TEXT,
    budget_range TEXT,
    timeline TEXT,
    address TEXT,
    source TEXT DEFAULT 'chatbot', -- chatbot, website_form, referral, etc.
    status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
    lead_quality TEXT CHECK (lead_quality IN ('hot', 'warm', 'cold')) DEFAULT 'cold',
    notes TEXT,
    assigned_to UUID REFERENCES profiles(id), -- admin who handles this lead
    contacted_at TIMESTAMP,
    converted_at TIMESTAMP,
    converted_to_project_id UUID REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events for tracking user interactions and chatbot performance
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- lead_captured, conversation_started, message_sent, etc.
    event_data JSONB, -- flexible data storage for event details
    session_id TEXT, -- browser session or conversation identifier
    user_agent TEXT,
    ip_address TEXT,
    user_id UUID REFERENCES profiles(id), -- if user is authenticated
    lead_id UUID REFERENCES leads(id), -- if event relates to a lead
    project_id UUID REFERENCES projects(id), -- if event relates to a project
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chatbot conversations for logging chat interactions
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id), -- if user is authenticated
    lead_id UUID REFERENCES leads(id), -- if conversation results in lead
    conversation_data JSONB NOT NULL, -- full conversation history
    conversation_summary TEXT,
    lead_captured BOOLEAN DEFAULT false,
    conversation_rating INTEGER CHECK (conversation_rating BETWEEN 1 AND 5),
    exit_point TEXT, -- lead_captured, user_left, satisfied, frustrated
    total_messages INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_chatbot_conversations_session ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_started_at ON chatbot_conversations(started_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Admins can view all leads"
    ON leads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can insert leads"
    ON leads FOR INSERT
    WITH CHECK (true); -- Allow anonymous inserts for chatbot

CREATE POLICY "Admins can update leads"
    ON leads FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for analytics events
CREATE POLICY "Admins can view analytics"
    ON analytics_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Anyone can insert analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (true); -- Allow anonymous inserts for tracking

-- RLS Policies for chatbot conversations
CREATE POLICY "Admins can view conversations"
    ON chatbot_conversations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Anyone can insert conversations"
    ON chatbot_conversations FOR INSERT
    WITH CHECK (true); -- Allow anonymous inserts for chatbot

CREATE POLICY "Users can view own conversations"
    ON chatbot_conversations FOR SELECT
    USING (user_id = auth.uid());