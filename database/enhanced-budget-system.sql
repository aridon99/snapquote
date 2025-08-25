-- Enhanced Budget System for Hybrid Allocated Pool Approach
-- Supports flexible budget allocation with transfer workflows

-- Project budget allocations table
CREATE TABLE IF NOT EXISTS project_budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES renovation_campaigns(id) ON DELETE SET NULL,
  
  -- Budget allocation details
  allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  initial_allocation DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  committed_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Money committed but not yet spent
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    allocated_amount >= 0 AND 
    initial_allocation >= 0 AND 
    spent_amount >= 0 AND 
    committed_amount >= 0
  )
);

-- Renovation campaigns for grouping related projects
CREATE TABLE IF NOT EXISTS renovation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  target_end_date DATE,
  status VARCHAR(50) DEFAULT 'planning',
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget transfer requests and history
CREATE TABLE IF NOT EXISTS budget_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES renovation_campaigns(id) ON DELETE CASCADE,
  
  -- Transfer details
  from_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  to_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  
  -- Approval workflow
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Impact analysis
  from_project_remaining_before DECIMAL(12,2),
  from_project_remaining_after DECIMAL(12,2),
  to_project_remaining_before DECIMAL(12,2),
  to_project_remaining_after DECIMAL(12,2),
  
  CONSTRAINT positive_transfer_amount CHECK (amount > 0)
);

-- Project milestones for progress tracking
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Budget impact
  budgeted_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  
  -- Status and tracking
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, delayed
  order_index INTEGER DEFAULT 0,
  is_critical_path BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Budget transactions for detailed tracking
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  
  -- Transaction details
  type VARCHAR(50) NOT NULL, -- expense, allocation, transfer_in, transfer_out, refund
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100), -- materials, labor, permits, etc.
  
  -- References
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  receipt_url TEXT,
  contractor_id UUID REFERENCES contractors(id),
  
  -- Approval and tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add budget allocation fields to existing projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES renovation_campaigns(id),
ADD COLUMN IF NOT EXISTS budget_allocated DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_committed DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_budget_allocations_project_id ON project_budget_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_allocations_campaign_id ON project_budget_allocations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_campaign_id ON budget_transfers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_status ON budget_transfers(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_project_id ON budget_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_status ON budget_transactions(status);

-- Triggers to update project totals when transactions change
CREATE OR REPLACE FUNCTION update_project_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the project's budget totals
  UPDATE projects SET
    budget_spent = (
      SELECT COALESCE(SUM(amount), 0)
      FROM budget_transactions 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND type IN ('expense')
        AND status = 'approved'
    ),
    budget_committed = (
      SELECT COALESCE(SUM(amount), 0)
      FROM budget_transactions 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND type IN ('expense')
        AND status = 'pending'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_budget_totals
AFTER INSERT OR UPDATE OR DELETE ON budget_transactions
FOR EACH ROW EXECUTE FUNCTION update_project_budget_totals();

-- Function to calculate project progress based on milestones
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the project's progress percentage
  UPDATE projects SET
    progress_percentage = (
      SELECT COALESCE(AVG(progress_percentage), 0)
      FROM project_milestones 
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
AFTER INSERT OR UPDATE OR DELETE ON project_milestones
FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Function to validate budget transfer availability
CREATE OR REPLACE FUNCTION validate_budget_transfer(
  p_from_project_id UUID,
  p_amount DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  available_amount DECIMAL;
BEGIN
  -- Calculate available amount in source project
  SELECT (budget_allocated - budget_spent - budget_committed) INTO available_amount
  FROM projects
  WHERE id = p_from_project_id;
  
  -- Return true if transfer amount is available
  RETURN available_amount >= p_amount;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE project_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- Homeowners can see their own data
CREATE POLICY "Homeowners can view their budget allocations" ON project_budget_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can view their campaigns" ON renovation_campaigns
  FOR SELECT USING (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can view their budget transfers" ON budget_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM renovation_campaigns rc 
      WHERE rc.id = campaign_id AND rc.homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can view their milestones" ON project_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.homeowner_id = auth.uid()
    )
  );

CREATE POLICY "Homeowners can view their transactions" ON budget_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.homeowner_id = auth.uid()
    )
  );

-- Advisors can view all data
CREATE POLICY "Advisors can view all budget allocations" ON project_budget_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Advisors can view all campaigns" ON renovation_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample data for testing
INSERT INTO renovation_campaigns (id, homeowner_id, name, description, total_budget, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'homeowner' LIMIT 1),
  'Whole House Renovation 2024',
  'Complete renovation of kitchen and two bathrooms',
  80000.00,
  'in_progress'
) ON CONFLICT DO NOTHING;

-- Sample project allocations
INSERT INTO project_budget_allocations (project_id, allocated_amount, initial_allocation)
SELECT 
  p.id,
  CASE 
    WHEN p.project_type @> ARRAY['kitchen'] THEN 45000.00
    WHEN p.project_type @> ARRAY['bathroom'] THEN 
      CASE WHEN RANDOM() > 0.5 THEN 20000.00 ELSE 15000.00 END
    ELSE 10000.00
  END,
  CASE 
    WHEN p.project_type @> ARRAY['kitchen'] THEN 45000.00
    WHEN p.project_type @> ARRAY['bathroom'] THEN 
      CASE WHEN RANDOM() > 0.5 THEN 20000.00 ELSE 15000.00 END
    ELSE 10000.00
  END
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_budget_allocations pba WHERE pba.project_id = p.id
);

-- Sample milestones for kitchen project
INSERT INTO project_milestones (project_id, name, progress_percentage, status, order_index)
SELECT 
  p.id,
  milestone_data.name,
  milestone_data.progress,
  milestone_data.status,
  milestone_data.order_idx
FROM projects p
CROSS JOIN (
  VALUES 
    ('Demolition', 100, 'completed', 1),
    ('Electrical Rough-in', 80, 'in_progress', 2),
    ('Plumbing Rough-in', 60, 'in_progress', 3),
    ('Drywall Installation', 0, 'planned', 4),
    ('Cabinet Installation', 0, 'planned', 5),
    ('Countertop Installation', 0, 'planned', 6),
    ('Final Fixtures', 0, 'planned', 7)
) AS milestone_data(name, progress, status, order_idx)
WHERE p.project_type @> ARRAY['kitchen']
AND NOT EXISTS (
  SELECT 1 FROM project_milestones pm WHERE pm.project_id = p.id
);