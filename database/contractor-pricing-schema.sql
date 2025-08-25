-- Contractor Pricing Schema for Voice-to-Takeoff Feature
-- This schema supports material and labor pricing for accurate estimates

-- Enhanced contractors table with pricing
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 75.00;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Material pricing catalog
CREATE TABLE IF NOT EXISTS material_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- tile, paint, flooring, plumbing, electrical
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL, -- sq_ft, linear_ft, gallon, each
    base_price DECIMAL(10,2) NOT NULL,
    waste_factor DECIMAL(5,2) DEFAULT 10.00, -- percentage for waste/overage
    brand TEXT,
    quality_tier TEXT CHECK (quality_tier IN ('budget', 'standard', 'premium')) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contractor-specific pricing overrides
CREATE TABLE IF NOT EXISTS contractor_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    material_id UUID REFERENCES material_catalog(id),
    custom_price DECIMAL(10,2), -- contractor's specific price if different
    labor_hours_per_unit DECIMAL(5,2), -- hours needed per unit
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Labor task estimates
CREATE TABLE IF NOT EXISTS labor_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type TEXT NOT NULL, -- install_tile, paint_room, fix_leak, etc.
    trade TEXT NOT NULL, -- plumber, electrician, tile, painter
    base_hours DECIMAL(5,2) NOT NULL, -- typical hours for task
    complexity_factor TEXT CHECK (complexity_factor IN ('simple', 'standard', 'complex')) DEFAULT 'standard',
    price_per_hour DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced punch list items with estimates
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS material_cost DECIMAL(10,2);
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2);
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS total_estimate DECIMAL(10,2);
ALTER TABLE punch_list_items ADD COLUMN IF NOT EXISTS measurements JSONB;

-- Insert mock contractors with pricing
INSERT INTO contractors (id, business_name, contact_name, email, phone, specialties, hourly_rate, markup_percentage, price_range, availability_status) VALUES
('c1111111-1111-1111-1111-111111111111', 'Premium Plumbing Co', 'Bob Smith', 'bob@premiumplumbing.com', '4155551234', ARRAY['plumber'], 125.00, 25.00, 'premium', 'available'),
('c2222222-2222-2222-2222-222222222222', 'Electric Solutions', 'Mike Johnson', 'mike@electricsolutions.com', '4155555678', ARRAY['electrician'], 110.00, 20.00, 'mid-range', 'available'),
('c3333333-3333-3333-3333-333333333333', 'Tile Masters', 'Sarah Davis', 'sarah@tilemasters.com', '4155559012', ARRAY['tile', 'flooring'], 85.00, 15.00, 'mid-range', 'available'),
('c4444444-4444-4444-4444-444444444444', 'Pro Painters', 'Tom Wilson', 'tom@propainters.com', '4155553456', ARRAY['painter', 'drywall'], 75.00, 20.00, 'budget', 'busy_2_weeks'),
('c5555555-5555-5555-5555-555555555555', 'General Fix-It', 'Joe Martinez', 'joe@generalfixit.com', '4155557890', ARRAY['general', 'carpenter'], 65.00, 15.00, 'budget', 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert material catalog with common items
INSERT INTO material_catalog (category, item_name, unit, base_price, waste_factor, quality_tier) VALUES
-- Tile
('tile', 'Ceramic Tile - Basic', 'sq_ft', 3.50, 10.00, 'budget'),
('tile', 'Porcelain Tile - Standard', 'sq_ft', 5.50, 10.00, 'standard'),
('tile', 'Natural Stone Tile', 'sq_ft', 12.00, 15.00, 'premium'),
('tile', 'Tile Adhesive', 'bag', 15.00, 5.00, 'standard'),
('tile', 'Grout', 'bag', 12.00, 10.00, 'standard'),

-- Plumbing
('plumbing', 'Standard Toilet', 'each', 250.00, 0.00, 'standard'),
('plumbing', 'Premium Toilet', 'each', 450.00, 0.00, 'premium'),
('plumbing', 'Kitchen Faucet', 'each', 175.00, 0.00, 'standard'),
('plumbing', 'Bathroom Faucet', 'each', 125.00, 0.00, 'standard'),
('plumbing', 'P-Trap', 'each', 25.00, 0.00, 'standard'),
('plumbing', 'Supply Line', 'each', 15.00, 0.00, 'standard'),

-- Paint
('paint', 'Interior Paint', 'gallon', 35.00, 10.00, 'standard'),
('paint', 'Primer', 'gallon', 25.00, 10.00, 'standard'),
('paint', 'Ceiling Paint', 'gallon', 30.00, 10.00, 'standard'),

-- Flooring
('flooring', 'Laminate Flooring', 'sq_ft', 2.50, 10.00, 'budget'),
('flooring', 'Hardwood Flooring', 'sq_ft', 8.00, 10.00, 'premium'),
('flooring', 'Vinyl Plank', 'sq_ft', 3.50, 10.00, 'standard'),

-- Electrical
('electrical', 'Outlet', 'each', 3.50, 5.00, 'standard'),
('electrical', 'Switch', 'each', 4.00, 5.00, 'standard'),
('electrical', 'Circuit Breaker', 'each', 45.00, 0.00, 'standard'),
('electrical', 'Ceiling Fan', 'each', 150.00, 0.00, 'standard');

-- Insert labor estimates
INSERT INTO labor_estimates (task_type, trade, base_hours, complexity_factor, price_per_hour) VALUES
-- Tile work
('install_tile_floor', 'tile', 1.5, 'standard', 85.00), -- per 10 sq ft
('install_tile_wall', 'tile', 2.0, 'standard', 85.00), -- per 10 sq ft
('repair_grout', 'tile', 0.5, 'simple', 75.00), -- per 10 linear ft

-- Plumbing
('install_toilet', 'plumber', 2.0, 'standard', 125.00),
('fix_leak', 'plumber', 1.5, 'standard', 125.00),
('install_faucet', 'plumber', 1.0, 'standard', 125.00),
('unclog_drain', 'plumber', 1.0, 'simple', 125.00),

-- Electrical
('install_outlet', 'electrician', 0.5, 'standard', 110.00),
('install_ceiling_fan', 'electrician', 2.0, 'standard', 110.00),
('install_switch', 'electrician', 0.5, 'standard', 110.00),

-- Painting
('paint_room', 'painter', 4.0, 'standard', 75.00), -- per 200 sq ft
('paint_ceiling', 'painter', 2.0, 'standard', 75.00), -- per 200 sq ft

-- General
('hang_door', 'carpenter', 2.0, 'standard', 65.00),
('install_cabinet', 'carpenter', 1.5, 'standard', 65.00),
('drywall_patch', 'general', 1.0, 'simple', 65.00);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_catalog_category ON material_catalog(category);
CREATE INDEX IF NOT EXISTS idx_labor_estimates_trade ON labor_estimates(trade);
CREATE INDEX IF NOT EXISTS idx_contractor_pricing_contractor ON contractor_pricing(contractor_id);