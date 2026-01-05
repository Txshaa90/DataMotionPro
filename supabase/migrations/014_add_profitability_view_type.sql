-- Add 'profitability' to the allowed view types for Year to Date Profitability Reports

-- Drop the existing constraint
ALTER TABLE views
DROP CONSTRAINT IF EXISTS views_type_check;

-- Add the new constraint with 'profitability' included
ALTER TABLE views
ADD CONSTRAINT views_type_check
CHECK (type IN ('grid', 'gallery', 'form', 'kanban', 'calendar', 'chart', 'returns', 'profitability', 'dashboard'));

-- Add comment
COMMENT ON COLUMN views.type IS 'View type: grid, gallery, form, kanban, calendar, chart, returns, profitability, or dashboard';
