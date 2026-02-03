-- Fix RLS policy for dataset_presence to allow upserts
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own presence" ON dataset_presence;

-- Create new policy that allows INSERT and UPDATE for authenticated users
CREATE POLICY "Users can insert their own presence"
  ON dataset_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence"
  ON dataset_presence
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own presence (for cleanup)
CREATE POLICY "Users can delete their own presence"
  ON dataset_presence
  FOR DELETE
  USING (user_id = auth.uid());
