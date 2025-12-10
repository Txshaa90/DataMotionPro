-- Add UPDATE policies for tables and folders

-- Drop existing UPDATE policies if they exist
DROP POLICY IF EXISTS "Users can update their own tables" ON tables;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;

-- Allow users to update their own tables OR tables shared with edit permission
CREATE POLICY "Users can update their own tables or shared tables with edit permission"
  ON tables
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT table_id 
      FROM table_shares 
      WHERE shared_with_email = auth.jwt()->>'email'
      AND permission = 'edit'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR id IN (
      SELECT table_id 
      FROM table_shares 
      WHERE shared_with_email = auth.jwt()->>'email'
      AND permission = 'edit'
    )
  );

-- Allow users to update their own folders
CREATE POLICY "Users can update their own folders"
  ON folders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
