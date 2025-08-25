-- Create milestones table for project timeline management
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'overdue')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('planning', 'permits', 'construction', 'inspection', 'payment')),
  amount DECIMAL(10,2), -- For payment milestones
  assigned_to VARCHAR(255), -- Person or team responsible
  completed_date TIMESTAMP WITH TIME ZONE,
  dependencies TEXT[], -- Array of milestone IDs that must be completed first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(type);

-- Enable RLS (Row Level Security)
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Homeowners can read and modify milestones for their projects
CREATE POLICY "Homeowners can view milestones for their projects" ON milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can create milestones for their projects" ON milestones
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can update milestones for their projects" ON milestones
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can delete milestones for their projects" ON milestones
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE homeowner_id = auth.uid()
    )
  );

-- Contractors can read and update milestones for projects they're assigned to
CREATE POLICY "Contractors can view milestones for their projects" ON milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE assigned_contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update milestone status for their projects" ON milestones
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE assigned_contractor_id = auth.uid()
    )
  );

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestones_updated_at();

-- Create function to automatically update overdue status
CREATE OR REPLACE FUNCTION check_overdue_milestones()
RETURNS void AS $$
BEGIN
  UPDATE milestones 
  SET status = 'overdue'
  WHERE status = 'upcoming' 
    AND due_date < CURRENT_DATE
    AND status != 'completed';
END;
$$ language 'plpgsql';

-- Create a sample trigger/function that could be called periodically to update overdue milestones
-- Note: In production, this might be better handled by a cron job or scheduled function