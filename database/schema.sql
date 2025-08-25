-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    company TEXT,
    role TEXT CHECK (role IN ('homeowner', 'contractor', 'admin')) DEFAULT 'homeowner',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contractors
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT,
    insurance_info JSONB,
    specialties TEXT[],
    service_areas TEXT[],
    price_range TEXT CHECK (price_range IN ('budget', 'mid-range', 'premium')),
    availability_status TEXT CHECK (availability_status IN ('available', 'busy_2_weeks', 'busy_month', 'unavailable')),
    rating DECIMAL(3,2),
    completed_projects INTEGER DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homeowner_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    address JSONB NOT NULL,
    project_type TEXT[],
    description TEXT,
    budget_range TEXT,
    timeline_preference TEXT,
    status TEXT CHECK (status IN ('intake', 'planning', 'contractor_selection', 'in_progress', 'completed', 'on_hold')) DEFAULT 'intake',
    brief_url TEXT,
    total_budget DECIMAL(10,2),
    spent_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project contractors (many-to-many)
CREATE TABLE project_contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractors(id),
    status TEXT CHECK (status IN ('proposed', 'accepted', 'declined', 'hired')) DEFAULT 'proposed',
    bid_amount DECIMAL(10,2),
    notes TEXT,
    introduced_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    hired_at TIMESTAMP
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    attachments JSONB,
    mentions UUID[],
    is_action_item BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Budget items
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('labor', 'materials', 'permits', 'other')),
    description TEXT NOT NULL,
    budgeted_amount DECIMAL(10,2),
    actual_amount DECIMAL(10,2),
    contractor_id UUID REFERENCES contractors(id),
    is_change_order BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project files
CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    category TEXT CHECK (category IN ('photo', 'document', 'permit', 'warranty', 'receipt', 'other')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Intake form responses
CREATE TABLE intake_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_homeowner ON projects(homeowner_id);
CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_budget_items_project ON budget_items(project_id);
CREATE INDEX idx_project_contractors_project ON project_contractors(project_id);
CREATE INDEX idx_project_files_project ON project_files(project_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Homeowners can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = homeowner_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Homeowners can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Project members can view messages"
    ON messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND (homeowner_id = auth.uid() OR auth.uid() IN (
            SELECT profiles.id FROM profiles 
            JOIN project_contractors ON profiles.id = project_contractors.contractor_id 
            WHERE project_contractors.project_id = projects.id
        ))
    ));

CREATE POLICY "Project members can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND (homeowner_id = auth.uid() OR auth.uid() IN (
            SELECT profiles.id FROM profiles 
            JOIN project_contractors ON profiles.id = project_contractors.contractor_id 
            WHERE project_contractors.project_id = projects.id
        ))
    ));

-- Chatbot conversations table
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id),
    messages JSONB DEFAULT '[]',
    lead_captured BOOLEAN DEFAULT false,
    lead_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chatbot leads table
CREATE TABLE chatbot_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chatbot_conversations(id),
    session_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    project_type TEXT,
    notes TEXT,
    status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
    source TEXT DEFAULT 'chatbot',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT,
    user_id UUID REFERENCES profiles(id),
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for chatbot and analytics tables
CREATE INDEX idx_chatbot_conversations_session ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_leads_email ON chatbot_leads(email);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Enable RLS for new tables
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot tables (allow anonymous access)
CREATE POLICY "Anyone can create chatbot conversations"
    ON chatbot_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update their chatbot conversations"
    ON chatbot_conversations FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can view their chatbot conversations"
    ON chatbot_conversations FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create chatbot leads"
    ON chatbot_leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all chatbot leads"
    ON chatbot_leads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for analytics (allow anonymous writes)
CREATE POLICY "Anyone can create analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
    ON analytics_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Insert some sample contractors
INSERT INTO contractors (business_name, contact_name, email, phone, specialties, service_areas, price_range, availability_status, rating) VALUES
('Bay Area Builders', 'Mike Rodriguez', 'mike@bayareabuilders.com', '(415) 555-0101', 
 ARRAY['kitchen', 'bathroom', 'general'], ARRAY['San Francisco', 'San Mateo'], 'mid-range', 'available', 4.8),
('Premium Home Renovations', 'Sarah Chen', 'sarah@premiumhome.com', '(415) 555-0102',
 ARRAY['kitchen', 'whole_house'], ARRAY['San Francisco', 'Palo Alto'], 'premium', 'busy_2_weeks', 4.9),
('Budget Friendly Contractors', 'Tom Wilson', 'tom@budgetfriendly.com', '(510) 555-0103',
 ARRAY['bathroom', 'flooring'], ARRAY['Oakland', 'Berkeley'], 'budget', 'available', 4.2),
('Elite Kitchen Design', 'Jennifer Kim', 'jennifer@elitekitchen.com', '(650) 555-0104',
 ARRAY['kitchen'], ARRAY['Palo Alto', 'Mountain View'], 'premium', 'busy_month', 4.7),
('Reliable Home Services', 'David Garcia', 'david@reliablehome.com', '(415) 555-0105',
 ARRAY['bathroom', 'electrical', 'plumbing'], ARRAY['San Francisco'], 'mid-range', 'available', 4.5);