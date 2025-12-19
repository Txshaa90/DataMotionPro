-- Add column_highlights field to views table to store column highlight colors
ALTER TABLE views ADD COLUMN IF NOT EXISTS column_highlights JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the field
COMMENT ON COLUMN views.column_highlights IS 'Stores column highlight colors as a JSON object with column IDs as keys and color hex codes as values';
