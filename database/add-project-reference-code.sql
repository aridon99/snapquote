-- Add reference_code column to projects table for unified dashboard navigation
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50) UNIQUE;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_projects_reference_code ON projects(reference_code);

-- Add last_viewed_by column for activity tracking
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS last_viewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create project_sessions table for tracking active viewers
CREATE TABLE IF NOT EXISTS project_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL, -- 'owner', 'advisor', 'contractor'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_id, user_id)
);

-- Index for active sessions
CREATE INDEX IF NOT EXISTS idx_project_sessions_active 
ON project_sessions(project_id, is_active) 
WHERE is_active = true;

-- Function to generate reference code
CREATE OR REPLACE FUNCTION generate_project_reference_code(
  p_project_type TEXT,
  p_owner_name TEXT,
  p_created_at TIMESTAMP
) RETURNS TEXT AS $$
DECLARE
  type_code TEXT;
  owner_initials TEXT;
  year_code TEXT;
  sequence_num INTEGER;
  reference_code TEXT;
BEGIN
  -- Extract type code (first 3 letters)
  type_code := UPPER(LEFT(COALESCE(p_project_type, 'GEN'), 3));
  
  -- Extract owner initials (first letter of each word, max 3)
  owner_initials := UPPER(
    SUBSTRING(
      STRING_AGG(LEFT(word, 1), '' ORDER BY word_num),
      1, 3
    )
  ) FROM (
    SELECT word, ROW_NUMBER() OVER () as word_num
    FROM unnest(string_to_array(p_owner_name, ' ')) as word
  ) as words;
  
  -- Extract year
  year_code := TO_CHAR(p_created_at, 'YY');
  
  -- Get sequence number for this year and type
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM projects
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM p_created_at)
    AND project_type && ARRAY[p_project_type];
  
  -- Construct reference code
  reference_code := type_code || '-' || year_code || '-' || owner_initials || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN reference_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference code on insert
CREATE OR REPLACE FUNCTION set_project_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := generate_project_reference_code(
      NEW.project_type[1],
      (SELECT full_name FROM profiles WHERE id = NEW.homeowner_id),
      NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_project_reference_code
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_project_reference_code();

-- Update existing projects with reference codes
UPDATE projects p
SET reference_code = generate_project_reference_code(
  p.project_type[1],
  prof.full_name,
  p.created_at
)
FROM profiles prof
WHERE p.homeowner_id = prof.id
  AND p.reference_code IS NULL;

-- Add RLS policies for project_sessions
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON project_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON project_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON project_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Advisors can view all project sessions" ON project_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );