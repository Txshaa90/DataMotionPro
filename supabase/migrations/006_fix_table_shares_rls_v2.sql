-- Fix RLS policy to use auth.jwt() instead of querying auth.users table

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view shares for their tables" ON table_shares;

-- Create new SELECT policy using auth.jwt() which doesn't require querying users table
CREATE POLICY "Users can view shares for their tables"
  ON table_shares
  FOR SELECT
  USING (
    shared_by = auth.uid()
    OR shared_with_email = auth.jwt()->>'email'
  );
