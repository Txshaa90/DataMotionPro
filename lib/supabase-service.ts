import { supabase, isSupabaseConfigured } from './supabase'
import { Folder, Table } from '@/store/useTableStore'
import { View } from '@/store/useViewStore'

// ============================================
// FOLDER OPERATIONS
// ============================================

export async function fetchFolders(userId: string): Promise<Folder[]> {
  if (!isSupabaseConfigured()) return []
  
  const { data, error } = await (supabase as any)
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching folders:', error)
    return []
  }

  return data.map((folder: any) => ({
    id: folder.id,
    name: folder.name,
    color: folder.color || '#10b981',
    createdAt: folder.created_at,
    updatedAt: folder.updated_at,
  }))
}

export async function createFolder(
  userId: string,
  name: string,
  color?: string
): Promise<Folder | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await (supabase as any)
    .from('folders')
    .insert({
      user_id: userId,
      name,
      color: color || '#10b981',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating folder:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color || '#10b981',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Folder>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any)
    .from('folders')
    .update({
      name: updates.name,
      color: updates.color,
    })
    .eq('id', folderId)

  if (error) {
    console.error('Error updating folder:', error)
    return false
  }

  return true
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any).from('folders').delete().eq('id', folderId)

  if (error) {
    console.error('Error deleting folder:', error)
    return false
  }

  return true
}

// ============================================
// TABLE OPERATIONS
// ============================================

export async function fetchTables(userId: string): Promise<Table[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await (supabase as any)
    .from('tables')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tables:', error)
    return []
  }

  return data.map((table: any) => ({
    id: table.id,
    name: table.name,
    folderId: table.folder_id,
    columns: (table.columns as any) || [],
    rows: (table.rows as any) || [],
    createdAt: table.created_at,
    updatedAt: table.updated_at,
  }))
}

export async function createTable(
  userId: string,
  name: string,
  folderId?: string
): Promise<Table | null> {
  if (!isSupabaseConfigured()) return null

  const defaultColumns = [{ id: 'c1', name: 'Name', type: 'text', width: 200 }]

  const { data, error } = await (supabase as any)
    .from('tables')
    .insert({
      user_id: userId,
      name,
      folder_id: folderId || null,
      columns: defaultColumns,
      rows: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating table:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    folderId: data.folder_id,
    columns: (data.columns as any) || [],
    rows: (data.rows as any) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateTable(
  tableId: string,
  updates: Partial<Table>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any)
    .from('tables')
    .update({
      name: updates.name,
      folder_id: updates.folderId,
      columns: updates.columns,
      rows: updates.rows,
    })
    .eq('id', tableId)

  if (error) {
    console.error('Error updating table:', error)
    return false
  }

  return true
}

export async function deleteTable(tableId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any).from('tables').delete().eq('id', tableId)

  if (error) {
    console.error('Error deleting table:', error)
    return false
  }

  return true
}

// ============================================
// VIEW OPERATIONS
// ============================================

export async function fetchViews(userId: string): Promise<View[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await (supabase as any)
    .from('views')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching views:', error)
    return []
  }

  return data.map((view: any) => ({
    id: view.id,
    tableId: view.table_id,
    name: view.name,
    type: view.type as any,
    filters: (view.filters as any) || [],
    sorts: (view.sorts as any) || [],
    colorRules: (view.color_rules as any) || [],
    visibleColumns: (view.visible_columns as any) || [],
    createdAt: view.created_at,
    updatedAt: view.updated_at,
  }))
}

export async function createView(
  userId: string,
  tableId: string,
  view: Omit<View, 'id'>
): Promise<View | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await (supabase as any)
    .from('views')
    .insert({
      user_id: userId,
      table_id: tableId,
      name: view.name,
      type: view.type,
      filters: view.filters,
      sorts: view.sorts,
      color_rules: view.colorRules,
      visible_columns: view.visibleColumns,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating view:', error)
    return null
  }

  return {
    id: data.id,
    tableId: data.table_id,
    name: data.name,
    type: data.type as any,
    filters: (data.filters as any) || [],
    sorts: (data.sorts as any) || [],
    colorRules: (data.color_rules as any) || [],
    visibleColumns: (data.visible_columns as any) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateView(
  viewId: string,
  updates: Partial<View>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any)
    .from('views')
    .update({
      name: updates.name,
      type: updates.type,
      filters: updates.filters,
      sorts: updates.sorts,
      color_rules: updates.colorRules,
      visible_columns: updates.visibleColumns,
    })
    .eq('id', viewId)

  if (error) {
    console.error('Error updating view:', error)
    return false
  }

  return true
}

export async function deleteView(viewId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await (supabase as any).from('views').delete().eq('id', viewId)

  if (error) {
    console.error('Error deleting view:', error)
    return false
  }

  return true
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToFolders(
  userId: string,
  callback: (folders: Folder[]) => void
) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('folders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'folders',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchFolders(userId).then(callback)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToTables(
  userId: string,
  callback: (tables: Table[]) => void
) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('tables-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchTables(userId).then(callback)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToViews(
  userId: string,
  callback: (views: View[]) => void
) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('views-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'views',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchViews(userId).then(callback)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
