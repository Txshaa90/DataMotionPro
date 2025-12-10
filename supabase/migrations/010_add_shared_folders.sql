-- Create table for organizing shared datasets into personal folders
-- This allows users to organize datasets shared with them without affecting the original

CREATE TABLE IF NOT EXISTS shared_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table to track which shared datasets are in which personal folders
CREATE TABLE IF NOT EXISTS shared_folder_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES shared_folders(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_folders_user_id ON shared_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_folder_items_folder_id ON shared_folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_shared_folder_items_table_id ON shared_folder_items(table_id);
CREATE INDEX IF NOT EXISTS idx_shared_folder_items_user_id ON shared_folder_items(user_id);

-- Enable RLS
ALTER TABLE shared_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_folder_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_folders
CREATE POLICY "Users can view their own shared folders"
  ON shared_folders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own shared folders"
  ON shared_folders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shared folders"
  ON shared_folders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own shared folders"
  ON shared_folders
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for shared_folder_items
CREATE POLICY "Users can view their own shared folder items"
  ON shared_folder_items
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own shared folder items"
  ON shared_folder_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own shared folder items"
  ON shared_folder_items
  FOR DELETE
  USING (user_id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_folders_updated_at
  BEFORE UPDATE ON shared_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_folders_updated_at();
