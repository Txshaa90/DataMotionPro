-- Drop existing RLS policies for sheet_rows
DROP POLICY IF EXISTS "Users can view rows from their views" ON sheet_rows;
DROP POLICY IF EXISTS "Users can insert rows to their views" ON sheet_rows;
DROP POLICY IF EXISTS "Users can update rows in their views" ON sheet_rows;
DROP POLICY IF EXISTS "Users can delete rows from their views" ON sheet_rows;

-- Create new RLS policies that support shared access
CREATE POLICY "Users can view rows from their views or shared views"
  ON sheet_rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND (
        views.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM table_shares
          WHERE table_shares.table_id = views.table_id
          AND table_shares.shared_with_email = auth.jwt()->>'email'
        )
      )
    )
  );

CREATE POLICY "Users can insert rows to their views or shared views with edit permission"
  ON sheet_rows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND (
        views.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM table_shares
          WHERE table_shares.table_id = views.table_id
          AND table_shares.shared_with_email = auth.jwt()->>'email'
          AND table_shares.permission = 'edit'
        )
      )
    )
  );

CREATE POLICY "Users can update rows in their views or shared views with edit permission"
  ON sheet_rows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND (
        views.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM table_shares
          WHERE table_shares.table_id = views.table_id
          AND table_shares.shared_with_email = auth.jwt()->>'email'
          AND table_shares.permission = 'edit'
        )
      )
    )
  );

CREATE POLICY "Users can delete rows from their views or shared views with edit permission"
  ON sheet_rows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM views
      WHERE views.id = sheet_rows.view_id
      AND (
        views.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM table_shares
          WHERE table_shares.table_id = views.table_id
          AND table_shares.shared_with_email = auth.jwt()->>'email'
          AND table_shares.permission = 'edit'
        )
      )
    )
  );
