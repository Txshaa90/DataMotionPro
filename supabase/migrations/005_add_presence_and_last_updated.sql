-- Add last_updated column to tables if it doesn't exist
-- (updated_at already exists, but we'll ensure it's properly updated on row changes)

-- Create presence tracking table for real-time viewers
CREATE TABLE IF NOT EXISTS dataset_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dataset_presence_table_id ON dataset_presence(table_id);
CREATE INDEX IF NOT EXISTS idx_dataset_presence_user_id ON dataset_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_dataset_presence_last_seen ON dataset_presence(last_seen);

-- Enable Row Level Security
ALTER TABLE dataset_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view presence for tables they own or have access to
CREATE POLICY "Users can view presence for accessible tables"
  ON dataset_presence
  FOR SELECT
  USING (
    -- Table owner
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = dataset_presence.table_id
      AND tables.user_id = auth.uid()
    )
    OR
    -- Shared with user
    EXISTS (
      SELECT 1 FROM table_shares
      WHERE table_shares.table_id = dataset_presence.table_id
      AND table_shares.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policy: Users can insert/update their own presence
CREATE POLICY "Users can manage their own presence"
  ON dataset_presence
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM dataset_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update table's updated_at when rows change
CREATE OR REPLACE FUNCTION update_table_timestamp_on_row_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tables
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.view_id, OLD.view_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update table timestamp when sheet_rows change
DROP TRIGGER IF EXISTS update_table_on_sheet_rows_change ON sheet_rows;
CREATE TRIGGER update_table_on_sheet_rows_change
  AFTER INSERT OR UPDATE OR DELETE ON sheet_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_table_timestamp_on_row_change();

-- Function to update table's updated_at when views change
CREATE OR REPLACE FUNCTION update_table_timestamp_on_view_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tables
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.table_id, OLD.table_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update table timestamp when views change
DROP TRIGGER IF EXISTS update_table_on_views_change ON views;
CREATE TRIGGER update_table_on_views_change
  AFTER INSERT OR UPDATE OR DELETE ON views
  FOR EACH ROW
  EXECUTE FUNCTION update_table_timestamp_on_view_change();
