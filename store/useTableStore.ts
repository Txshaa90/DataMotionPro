import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColumnType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'url'

export interface Column {
  id: string
  name: string
  type: ColumnType
  width?: number
  options?: string[] // For select type
}

export interface Row {
  id: string
  [key: string]: any
}

export interface Table {
  id: string
  name: string
  folderId?: string | null
  columns: Column[]
  rows: Row[]
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  color?: string
  createdAt: string
  updatedAt: string
}

interface TableStore {
  tables: Table[]
  folders: Folder[]
  activeTableId: string | null
  
  // Folder operations
  addFolder: (name: string, color?: string) => void
  deleteFolder: (id: string) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  getFolderTables: (folderId: string) => Table[]
  
  // Table operations
  addTable: (name: string, folderId?: string) => void
  deleteTable: (id: string) => void
  updateTable: (id: string, updates: Partial<Table>) => void
  setActiveTable: (id: string) => void
  moveTableToFolder: (tableId: string, folderId: string | null) => void
  
  // Column operations
  addColumn: (tableId: string, column: Omit<Column, 'id'>) => void
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void
  deleteColumn: (tableId: string, columnId: string) => void
  
  // Row operations
  addRow: (tableId: string) => void
  updateRow: (tableId: string, rowId: string, data: Partial<Row>) => void
  deleteRow: (tableId: string, rowId: string) => void
  updateCell: (tableId: string, rowId: string, columnId: string, value: any) => void
  
  // Utility
  getActiveTable: () => Table | undefined
  exportTableToCSV: (tableId: string) => string
  importFromCSV: (tableId: string, csvData: string) => void
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      tables: [],
      folders: [],
      activeTableId: null,

      // Folder operations
      addFolder: (name, color) => {
        const newFolder: Folder = {
          id: `f${Date.now()}`,
          name,
          color: color || '#10b981',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          folders: [...state.folders, newFolder],
        }))
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          // Remove folder reference from tables
          tables: state.tables.map((t) =>
            t.folderId === id ? { ...t, folderId: null } : t
          ),
        }))
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        }))
      },

      getFolderTables: (folderId) => {
        return get().tables.filter((t) => t.folderId === folderId)
      },

      // Table operations
      addTable: (name, folderId) => {
        const newTable: Table = {
          id: Date.now().toString(),
          name,
          folderId: folderId || null,
          columns: [{ id: 'c1', name: 'Name', type: 'text', width: 200 }],
          rows: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          tables: [...state.tables, newTable],
          activeTableId: newTable.id,
        }))
      },

      moveTableToFolder: (tableId, folderId) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, folderId, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },

      deleteTable: (id) => {
        set((state) => {
          const newTables = state.tables.filter((t) => t.id !== id)
          const newActiveId = state.activeTableId === id 
            ? (newTables[0]?.id || null)
            : state.activeTableId
          return { tables: newTables, activeTableId: newActiveId }
        })
      },

      updateTable: (id, updates) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },

      setActiveTable: (id) => {
        set({ activeTableId: id })
      },

      addColumn: (tableId, column) => {
        const newColumn: Column = {
          ...column,
          id: `c${Date.now()}`,
          width: column.width || 200,
        }
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, columns: [...t.columns, newColumn], updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      updateColumn: (tableId, columnId, updates) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  columns: t.columns.map((c) =>
                    c.id === columnId ? { ...c, ...updates } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },

      deleteColumn: (tableId, columnId) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  columns: t.columns.filter((c) => c.id !== columnId),
                  rows: t.rows.map((r) => {
                    const { [columnId]: _, ...rest } = r
                    return rest as Row
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },

      addRow: (tableId) => {
        const table = get().tables.find((t) => t.id === tableId)
        if (!table) return

        const newRow: Row = {
          id: `r${Date.now()}`,
          ...Object.fromEntries(table.columns.map((c) => [c.id, ''])),
        }

        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, rows: [...t.rows, newRow], updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      updateRow: (tableId, rowId, data) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  rows: t.rows.map((r) =>
                    r.id === rowId ? { ...r, ...data } : r
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },

      deleteRow: (tableId, rowId) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, rows: t.rows.filter((r) => r.id !== rowId), updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      updateCell: (tableId, rowId, columnId, value) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  rows: t.rows.map((r) =>
                    r.id === rowId ? { ...r, [columnId]: value } : r
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },

      getActiveTable: () => {
        const state = get()
        return state.tables.find((t) => t.id === state.activeTableId)
      },

      exportTableToCSV: (tableId) => {
        const table = get().tables.find((t) => t.id === tableId)
        if (!table) return ''

        const headers = table.columns.map((c) => c.name).join(',')
        const rows = table.rows.map((row) =>
          table.columns.map((col) => {
            const value = row[col.id] || ''
            return `"${String(value).replace(/"/g, '""')}"`
          }).join(',')
        )

        return [headers, ...rows].join('\n')
      },

      importFromCSV: (tableId, csvData) => {
        const lines = csvData.split('\n').filter(line => line.trim())
        if (lines.length < 2) return

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const table = get().tables.find((t) => t.id === tableId)
        if (!table) return

        const newRows: Row[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const row: Row = { id: `r${Date.now()}_${index}` }
          
          table.columns.forEach((col, i) => {
            row[col.id] = values[i] || ''
          })
          
          return row
        })

        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, rows: [...t.rows, ...newRows], updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },
    }),
    {
      name: 'zerostack-storage',
    }
  )
)
