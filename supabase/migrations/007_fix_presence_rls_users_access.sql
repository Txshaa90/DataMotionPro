-- Fix RLS policies to avoid accessing auth.users table directly
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view presence for accessible tables" ON dataset_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON dataset_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON dataset_presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON dataset_presence;

-- Policy: Users can view presence for tables they own or have access to
-- Fixed to use auth.email() instead of querying auth.users
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
      AND table_shares.shared_with_email = auth.email()
    )
  );

-- Policy: Users can insert their own presence
CREATE POLICY "Users can insert their own presence"
  ON dataset_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own presence
CREATE POLICY "Users can update their own presence"
  ON dataset_presence
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own presence
CREATE POLICY "Users can delete their own presence"
  ON dataset_presence
  FOR DELETE
  USING (user_id = auth.uid());
