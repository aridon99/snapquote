-- Row Level Security Policies for Renovation Advisor Platform

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- CONTRACTORS TABLE POLICIES
-- All authenticated users can view active contractors
CREATE POLICY "Users can view active contractors" ON contractors
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins can manage contractors
CREATE POLICY "Admins can manage contractors" ON contractors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROJECTS TABLE POLICIES
-- Homeowners can view their own projects
CREATE POLICY "Homeowners can view own projects" ON projects
    FOR SELECT USING (homeowner_id = auth.uid());

-- Homeowners can create projects
CREATE POLICY "Homeowners can create projects" ON projects
    FOR INSERT WITH CHECK (homeowner_id = auth.uid());

-- Homeowners can update their own projects
CREATE POLICY "Homeowners can update own projects" ON projects
    FOR UPDATE USING (homeowner_id = auth.uid());

-- Contractors can view projects they're assigned to
CREATE POLICY "Contractors can view assigned projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_contractors pc
            JOIN contractors c ON pc.contractor_id = c.id
            JOIN profiles p ON p.email = c.email
            WHERE pc.project_id = projects.id 
            AND p.id = auth.uid()
            AND pc.status IN ('accepted', 'hired')
        )
    );

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROJECT_CONTRACTORS TABLE POLICIES
-- Homeowners can view contractors for their projects
CREATE POLICY "Homeowners can view project contractors" ON project_contractors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_contractors.project_id 
            AND homeowner_id = auth.uid()
        )
    );

-- Contractors can view their own assignments
CREATE POLICY "Contractors can view own assignments" ON project_contractors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contractors c
            JOIN profiles p ON p.email = c.email
            WHERE c.id = project_contractors.contractor_id 
            AND p.id = auth.uid()
        )
    );

-- Admins can manage project contractors
CREATE POLICY "Admins can manage project contractors" ON project_contractors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- MESSAGES TABLE POLICIES
-- Users can view messages for their projects
CREATE POLICY "Users can view project messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = messages.project_id 
            AND (
                homeowner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_contractors pc
                    JOIN contractors c ON pc.contractor_id = c.id
                    JOIN profiles p ON p.email = c.email
                    WHERE pc.project_id = projects.id 
                    AND p.id = auth.uid()
                    AND pc.status IN ('accepted', 'hired')
                )
            )
        )
    );

-- Users can send messages to their projects
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_id 
            AND (
                homeowner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_contractors pc
                    JOIN contractors c ON pc.contractor_id = c.id
                    JOIN profiles p ON p.email = c.email
                    WHERE pc.project_id = projects.id 
                    AND p.id = auth.uid()
                    AND pc.status IN ('accepted', 'hired')
                )
            )
        )
    );

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- BUDGET_ITEMS TABLE POLICIES
-- Homeowners can view budget items for their projects
CREATE POLICY "Homeowners can view budget items" ON budget_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = budget_items.project_id 
            AND homeowner_id = auth.uid()
        )
    );

-- Homeowners can manage budget items for their projects
CREATE POLICY "Homeowners can manage budget items" ON budget_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = budget_items.project_id 
            AND homeowner_id = auth.uid()
        )
    );

-- Contractors can view budget items for their assigned projects
CREATE POLICY "Contractors can view assigned project budgets" ON budget_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_contractors pc
            JOIN contractors c ON pc.contractor_id = c.id
            JOIN profiles p ON p.email = c.email
            WHERE pc.project_id = budget_items.project_id 
            AND p.id = auth.uid()
            AND pc.status = 'hired'
        )
    );

-- Admins can manage all budget items
CREATE POLICY "Admins can manage all budget items" ON budget_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROJECT_FILES TABLE POLICIES
-- Users can view files for their projects
CREATE POLICY "Users can view project files" ON project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_files.project_id 
            AND (
                homeowner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_contractors pc
                    JOIN contractors c ON pc.contractor_id = c.id
                    JOIN profiles p ON p.email = c.email
                    WHERE pc.project_id = projects.id 
                    AND p.id = auth.uid()
                    AND pc.status IN ('accepted', 'hired')
                )
            )
        )
    );

-- Users can upload files to their projects
CREATE POLICY "Users can upload project files" ON project_files
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_id 
            AND (
                homeowner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_contractors pc
                    JOIN contractors c ON pc.contractor_id = c.id
                    JOIN profiles p ON p.email = c.email
                    WHERE pc.project_id = projects.id 
                    AND p.id = auth.uid()
                    AND pc.status IN ('accepted', 'hired')
                )
            )
        )
    );

-- NOTIFICATIONS TABLE POLICIES
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_projects_homeowner ON projects(homeowner_id);
CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_budget_items_project ON budget_items(project_id);
CREATE INDEX idx_project_contractors_project ON project_contractors(project_id);
CREATE INDEX idx_project_contractors_contractor ON project_contractors(contractor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_contractors_email ON contractors(email);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();