-- Fix RLS policies for table_shares to allow proper access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view shares for their tables" ON table_shares;
DROP POLICY IF EXISTS "Users can create shares for their tables" ON table_shares;
DROP POLICY IF EXISTS "Users can delete shares they created" ON table_shares;
DROP POLICY IF EXISTS "Users can update shares they created" ON table_shares;

-- Policy: Users can view shares for tables they own OR shares where they are the recipient
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
