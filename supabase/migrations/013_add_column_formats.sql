-- Add column_formats field to views table to store column formatting settings
ALTER TABLE views ADD COLUMN IF NOT EXISTS column_formats JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the field
COMMENT ON COLUMN views.column_formats IS 'Stores column formatting settings (number, currency, percentage, date formats and font styling) as a JSON object with column IDs as keys';
