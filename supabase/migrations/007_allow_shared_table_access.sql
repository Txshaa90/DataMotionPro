-- Add RLS policy to allow users to view tables that are shared with them

-- Drop existing SELECT policy on tables if it exists
DROP POLICY IF EXISTS "Users can view their own tables" ON tables;

-- Create new SELECT policy that allows viewing own tables OR shared tables
CREATE POLICY "Users can view their own tables or shared tables"
  ON tables
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT table_id 
      FROM table_shares 
      WHERE shared_with_email = auth.jwt()->>'email'
    )
  );
