-- Create table_shares table for sharing datasets with team members
CREATE TABLE IF NOT EXISTS table_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_id, shared_with_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_table_shares_table_id ON table_shares(table_id);
CREATE INDEX IF NOT EXISTS idx_table_shares_email ON table_shares(shared_with_email);

-- Enable Row Level Security
ALTER TABLE table_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares for tables they own
CREATE POLICY "Users can view shares for their tables"
  ON table_shares
  FOR SELECT
  USING (
    shared_by = auth.uid()
    OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can create shares for tables they own
CREATE POLICY "Users can create shares for their tables"
  ON table_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_shares.table_id
      AND tables.user_id = auth.uid()
    )
  );

-- Policy: Users can delete shares they created
CREATE POLICY "Users can delete shares they created"
  ON table_shares
  FOR DELETE
  USING (shared_by = auth.uid());

-- Policy: Users can update shares they created
CREATE POLICY "Users can update shares they created"
  ON table_shares
  FOR UPDATE
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_table_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_shares_updated_at
  BEFORE UPDATE ON table_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_table_shares_updated_at();
