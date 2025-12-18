-- Add cell_color_rules column to views table
ALTER TABLE views ADD COLUMN IF NOT EXISTS cell_color_rules JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN views.cell_color_rules IS 'Stores conditional cell color rules for the view';
