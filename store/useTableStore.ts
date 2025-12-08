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
      tables: [
        {
          id: '1',
          name: 'Returns Report',
          folderId: 'folder-1',
          columns: [
            { id: 'c1', name: 'Order ID', type: 'text', width: 150 },
            { id: 'c2', name: 'Product', type: 'text', width: 200 },
            { id: 'c3', name: 'Return Date', type: 'date', width: 150 },
            { id: 'c4', name: 'Reason', type: 'select', width: 180, options: ['Defective', 'Wrong Item', 'Not Satisfied', 'Other'] },
            { id: 'c5', name: 'Refund Amount', type: 'number', width: 140 },
          ],
          rows: [
            { id: 'r1', c1: 'AMZ-12345', c2: 'Wireless Mouse', c3: '2024-11-10', c4: 'Defective', c5: '29.99' },
            { id: 'r2', c1: 'AMZ-12346', c2: 'USB Cable', c3: '2024-11-12', c4: 'Wrong Item', c5: '12.99' },
            { id: 'r3', c1: 'AMZ-12347', c2: 'Keyboard', c3: '2024-11-15', c4: 'Not Satisfied', c5: '79.99' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Orders Report',
          folderId: 'folder-1',
          columns: [
            { id: 'c1', name: 'Order ID', type: 'text', width: 150 },
            { id: 'c2', name: 'Customer', type: 'text', width: 180 },
            { id: 'c3', name: 'Order Date', type: 'date', width: 150 },
            { id: 'c4', name: 'Status', type: 'select', width: 150, options: ['Pending', 'Shipped', 'Delivered', 'Cancelled'] },
            { id: 'c5', name: 'Total', type: 'number', width: 120 },
          ],
          rows: [
            { id: 'r1', c1: 'AMZ-54321', c2: 'John Smith', c3: '2024-11-20', c4: 'Delivered', c5: '149.99' },
            { id: 'r2', c1: 'AMZ-54322', c2: 'Jane Doe', c3: '2024-11-21', c4: 'Shipped', c5: '89.50' },
            { id: 'r3', c1: 'AMZ-54323', c2: 'Bob Johnson', c3: '2024-11-22', c4: 'Pending', c5: '299.99' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Inventory Report',
          folderId: 'folder-1',
          columns: [
            { id: 'c1', name: 'SKU', type: 'text', width: 150 },
            { id: 'c2', name: 'Product Name', type: 'text', width: 200 },
            { id: 'c3', name: 'Stock', type: 'number', width: 120 },
            { id: 'c4', name: 'Status', type: 'select', width: 150, options: ['In Stock', 'Low Stock', 'Out of Stock'] },
            { id: 'c5', name: 'Price', type: 'number', width: 120 },
          ],
          rows: [
            { id: 'r1', c1: 'SKU-001', c2: 'Wireless Mouse', c3: '150', c4: 'In Stock', c5: '29.99' },
            { id: 'r2', c1: 'SKU-002', c2: 'USB Cable', c3: '25', c4: 'Low Stock', c5: '12.99' },
            { id: 'r3', c1: 'SKU-003', c2: 'Keyboard', c3: '0', c4: 'Out of Stock', c5: '79.99' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Client Contact List',
          folderId: 'folder-2',
          columns: [
            { id: 'c1', name: 'Company', type: 'text', width: 200 },
            { id: 'c2', name: 'Contact Person', type: 'text', width: 180 },
            { id: 'c3', name: 'Email', type: 'email', width: 220 },
            { id: 'c4', name: 'Status', type: 'select', width: 150, options: ['Active', 'Inactive', 'Prospect'] },
            { id: 'c5', name: 'Contract Value', type: 'number', width: 150 },
          ],
          rows: [
            { id: 'r1', c1: 'Acme Corp', c2: 'Alice Williams', c3: 'alice@acme.com', c4: 'Active', c5: '50000' },
            { id: 'r2', c1: 'TechStart Inc', c2: 'Bob Chen', c3: 'bob@techstart.com', c4: 'Active', c5: '75000' },
            { id: 'r3', c1: 'Global Solutions', c2: 'Carol Davis', c3: 'carol@global.com', c4: 'Prospect', c5: '100000' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Project Timeline',
          folderId: 'folder-2',
          columns: [
            { id: 'c1', name: 'Project', type: 'text', width: 200 },
            { id: 'c2', name: 'Client', type: 'text', width: 180 },
            { id: 'c3', name: 'Start Date', type: 'date', width: 150 },
            { id: 'c4', name: 'Status', type: 'select', width: 150, options: ['Planning', 'In Progress', 'Completed', 'On Hold'] },
            { id: 'c5', name: 'Completion %', type: 'number', width: 140 },
          ],
          rows: [
            { id: 'r1', c1: 'Website Redesign', c2: 'Acme Corp', c3: '2024-10-01', c4: 'In Progress', c5: '75' },
            { id: 'r2', c1: 'Mobile App', c2: 'TechStart Inc', c3: '2024-11-01', c4: 'Planning', c5: '20' },
            { id: 'r3', c1: 'CRM Integration', c2: 'Global Solutions', c3: '2024-09-15', c4: 'Completed', c5: '100' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '6',
          name: 'Standalone Dataset',
          columns: [
            { id: 'c1', name: 'Name', type: 'text', width: 200 },
            { id: 'c2', name: 'Category', type: 'select', width: 150, options: ['A', 'B', 'C'] },
            { id: 'c3', name: 'Date', type: 'date', width: 150 },
          ],
          rows: [
            { id: 'r1', c1: 'Sample Item', c2: 'A', c3: '2024-11-20' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '7',
          name: 'Website Redesign',
          folderId: 'folder-3',
          columns: [
            { id: 'c1', name: 'Task', type: 'text', width: 250 },
            { id: 'c2', name: 'Status', type: 'select', width: 150, options: ['Todo', 'In Progress', 'Done', 'Blocked'] },
            { id: 'c3', name: 'Assignee', type: 'text', width: 150 },
            { id: 'c4', name: 'Due Date', type: 'date', width: 150 },
            { id: 'c5', name: 'Priority', type: 'select', width: 120, options: ['Low', 'Medium', 'High'] },
          ],
          rows: [
            { id: 'r1', c1: 'Design mockups', c2: 'Done', c3: 'Alice', c4: '2024-11-15', c5: 'High' },
            { id: 'r2', c1: 'Develop frontend', c2: 'In Progress', c3: 'Bob', c4: '2024-12-01', c5: 'High' },
            { id: 'r3', c1: 'Backend API', c2: 'Todo', c3: 'Carol', c4: '2024-12-10', c5: 'Medium' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '8',
          name: 'Marketing Campaign',
          folderId: 'folder-3',
          columns: [
            { id: 'c1', name: 'Campaign', type: 'text', width: 200 },
            { id: 'c2', name: 'Platform', type: 'select', width: 150, options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn'] },
            { id: 'c3', name: 'Budget', type: 'number', width: 120 },
            { id: 'c4', name: 'Start Date', type: 'date', width: 150 },
            { id: 'c5', name: 'Status', type: 'select', width: 140, options: ['Planning', 'Active', 'Paused', 'Completed'] },
          ],
          rows: [
            { id: 'r1', c1: 'Q4 Launch', c2: 'Google Ads', c3: '5000', c4: '2024-10-01', c5: 'Active' },
            { id: 'r2', c1: 'Social Media Boost', c2: 'Facebook', c3: '3000', c4: '2024-11-01', c5: 'Active' },
            { id: 'r3', c1: 'Brand Awareness', c2: 'Instagram', c3: '2000', c4: '2024-11-15', c5: 'Planning' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '9',
          name: 'Product Launch',
          folderId: 'folder-3',
          columns: [
            { id: 'c1', name: 'Feature', type: 'text', width: 220 },
            { id: 'c2', name: 'Status', type: 'select', width: 150, options: ['Planned', 'In Development', 'Testing', 'Released'] },
            { id: 'c3', name: 'Owner', type: 'text', width: 150 },
            { id: 'c4', name: 'Release Date', type: 'date', width: 150 },
            { id: 'c5', name: 'Completion', type: 'number', width: 120 },
          ],
          rows: [
            { id: 'r1', c1: 'User Authentication', c2: 'Released', c3: 'Dev Team A', c4: '2024-10-15', c5: '100' },
            { id: 'r2', c1: 'Payment Integration', c2: 'Testing', c3: 'Dev Team B', c4: '2024-11-30', c5: '85' },
            { id: 'r3', c1: 'Analytics Dashboard', c2: 'In Development', c3: 'Dev Team C', c4: '2024-12-15', c5: '60' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '10',
          name: 'Client Onboarding',
          folderId: 'folder-3',
          columns: [
            { id: 'c1', name: 'Step', type: 'text', width: 220 },
            { id: 'c2', name: 'Status', type: 'select', width: 150, options: ['Not Started', 'In Progress', 'Completed', 'Skipped'] },
            { id: 'c3', name: 'Responsible', type: 'text', width: 150 },
            { id: 'c4', name: 'Due Date', type: 'date', width: 150 },
            { id: 'c5', name: 'Notes', type: 'text', width: 200 },
          ],
          rows: [
            { id: 'r1', c1: 'Initial consultation', c2: 'Completed', c3: 'Sales Team', c4: '2024-11-01', c5: 'Went well' },
            { id: 'r2', c1: 'Contract signing', c2: 'Completed', c3: 'Legal', c4: '2024-11-05', c5: 'Signed' },
            { id: 'r3', c1: 'System setup', c2: 'In Progress', c3: 'Tech Team', c4: '2024-11-20', c5: 'In progress' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      folders: [
        {
          id: 'folder-1',
          name: 'Amazon Returns',
          color: '#10b981',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'folder-2',
          name: 'Clients',
          color: '#3b82f6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'folder-3',
          name: 'Projects',
          color: '#8b5cf6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeTableId: '1',

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
