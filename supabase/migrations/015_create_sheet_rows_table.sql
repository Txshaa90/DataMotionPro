-- Create sheet_rows table for scalable row storage
CREATE TABLE IF NOT EXISTS sheet_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id uuid NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  row_data jsonb NOT NULL,
  row_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sheet_rows_view_id ON sheet_rows(view_id);
CREATE INDEX IF NOT EXISTS idx_sheet_rows_view_id_row_index ON sheet_rows(view_id, row_index);

-- Enable RLS
ALTER TABLE sheet_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view rows from their views"
  ON sheet_rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND views.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rows to their views"
  ON sheet_rows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND views.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in their views"
  ON sheet_rows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND views.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows from their views"
  ON sheet_rows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND views.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_sheet_rows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sheet_rows_updated_at
  BEFORE UPDATE ON sheet_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_sheet_rows_updated_at();

-- Migration: Move existing rows from views.rows to sheet_rows table
DO $$
DECLARE
  view_record RECORD;
  row_record jsonb;
  row_idx integer;
BEGIN
  FOR view_record IN SELECT id, rows FROM views WHERE rows IS NOT NULL AND jsonb_array_length(rows) > 0
  LOOP
    row_idx := 0;
    FOR row_record IN SELECT * FROM jsonb_array_elements(view_record.rows)
    LOOP
      INSERT INTO sheet_rows (view_id, row_data, row_index)
      VALUES (view_record.id, row_record, row_idx);
      row_idx := row_idx + 1;
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE sheet_rows IS 'Stores individual rows for views/sheets, enabling scalable data storage';
COMMENT ON COLUMN sheet_rows.view_id IS 'Reference to the parent view/sheet';
COMMENT ON COLUMN sheet_rows.row_data IS 'JSON data for the row';
COMMENT ON COLUMN sheet_rows.row_index IS 'Position of the row in the sheet (0-indexed)';
