-- Completely rebuild RLS policies for tables and folders

-- ============================================
-- TABLES POLICIES
-- ============================================

-- Drop all existing policies on tables
DROP POLICY IF EXISTS "Users can view their own tables" ON tables;
DROP POLICY IF EXISTS "Users can view their own tables or shared tables" ON tables;
DROP POLICY IF EXISTS "Users can insert their own tables" ON tables;
DROP POLICY IF EXISTS "Users can update their own tables" ON tables;
DROP POLICY IF EXISTS "Users can update their own tables or shared tables with edit permission" ON tables;
DROP POLICY IF EXISTS "Users can delete their own tables" ON tables;

-- SELECT: View own tables OR tables shared with you
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

-- INSERT: Only insert your own tables
CREATE POLICY "Users can insert their own tables"
  ON tables
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Update own tables OR shared tables with edit permission
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

-- DELETE: Only delete your own tables
CREATE POLICY "Users can delete their own tables"
  ON tables
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- FOLDERS POLICIES
-- ============================================

-- Drop all existing policies on folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

-- SELECT: View own folders
CREATE POLICY "Users can view their own folders"
  ON folders
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Only insert your own folders
CREATE POLICY "Users can insert their own folders"
  ON folders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Only update your own folders
CREATE POLICY "Users can update their own folders"
  ON folders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only delete your own folders
CREATE POLICY "Users can delete their own folders"
  ON folders
  FOR DELETE
  USING (user_id = auth.uid());
