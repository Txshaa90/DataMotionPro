'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  Plus,
  MoreVertical,
  Table as TableIcon,
  Settings,
  Download,
  Upload,
  Trash2,
  Edit,
  Filter,
  Search,
  ChevronDown,
  Grid3x3,
  FileJson,
  FileSpreadsheet,
  SortAsc,
  SortDesc,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useTableStore, ColumnType } from '@/store/useTableStore'
import { exportTableToCSV, downloadCSV, exportTableToJSON, downloadJSON, importCSVToTable } from '@/lib/csv-utils'
import { ThemeToggle } from '@/components/theme-toggle'

export default function WorkspacePageEnhanced() {
  const {
    tables,
    activeTableId,
    addTable,
    deleteTable,
    setActiveTable,
    addColumn,
    addRow,
    updateCell,
    deleteRow,
    getActiveTable,
  } = useTableStore()

  const [newTableName, setNewTableName] = useState('')
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnType, setNewColumnType] = useState<ColumnType>('text')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentTable = getActiveTable()

  const handleAddTable = () => {
    if (!newTableName.trim()) return
    addTable(newTableName)
    setNewTableName('')
  }

  const handleAddColumn = () => {
    if (!newColumnName.trim() || !currentTable) return
    addColumn(currentTable.id, {
      name: newColumnName,
      type: newColumnType,
      width: 200,
    })
    setNewColumnName('')
  }

  const handleExportCSV = () => {
    if (!currentTable) return
    const csv = exportTableToCSV(currentTable)
    downloadCSV(csv, `${currentTable.name}.csv`)
  }

  const handleExportJSON = () => {
    if (!currentTable) return
    const json = exportTableToJSON(currentTable)
    downloadJSON(json, `${currentTable.name}.json`)
  }

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentTable) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { newRows, errors } = importCSVToTable(currentTable, content)
      
      if (errors.length > 0) {
        alert(`Import errors:\n${errors.join('\n')}`)
      }
      
      if (newRows.length > 0) {
        newRows.forEach((row) => {
          const { id, ...data } = row
          addRow(currentTable.id)
          // Update the newly added row with imported data
          const lastRowId = useTableStore.getState().tables
            .find(t => t.id === currentTable.id)?.rows.slice(-1)[0]?.id
          if (lastRowId) {
            Object.entries(data).forEach(([key, value]) => {
              updateCell(currentTable.id, lastRowId, key, value)
            })
          }
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  // Filter and sort rows
  const getFilteredAndSortedRows = () => {
    if (!currentTable) return []
    
    let rows = [...currentTable.rows]

    // Apply search filter
    if (searchQuery) {
      rows = rows.filter((row) =>
        currentTable.columns.some((col) => {
          const value = String(row[col.id] || '').toLowerCase()
          return value.includes(searchQuery.toLowerCase())
        })
      )
    }

    // Apply sorting
    if (sortColumn) {
      rows.sort((a, b) => {
        const aVal = String(a[sortColumn] || '')
        const bVal = String(b[sortColumn] || '')
        
        const comparison = aVal.localeCompare(bVal, undefined, { numeric: true })
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return rows
  }

  const filteredRows = getFilteredAndSortedRows()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <Link href="/" className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">DataMotionPro</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Workspace</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Table</DialogTitle>
                  <DialogDescription>
                    Add a new table to your workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Table name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTable()}
                  />
                  <Button onClick={handleAddTable} className="w-full">Create Table</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    activeTableId === table.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTable(table.id)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <TableIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{table.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportJSON}>
                        <FileJson className="h-4 w-4 mr-2" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteTable(table.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t dark:border-gray-700 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-800">
          {currentTable ? (
            <>
              {/* Table Header */}
              <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{currentTable.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {filteredRows.length} rows • {currentTable.columns.length} columns
                    {searchQuery && ` • Filtered from ${currentTable.rows.length} total`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Column
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Column</DialogTitle>
                        <DialogDescription>
                          Create a new column in {currentTable.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input
                          placeholder="Column name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                        />
                        <Select value={newColumnType} onValueChange={(v) => setNewColumnType(v as ColumnType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddColumn} className="w-full">Add Column</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={() => addRow(currentTable.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        #
                      </th>
                      {currentTable.columns.map((column) => (
                        <th
                          key={column.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-l dark:border-gray-600 min-w-[200px]"
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{column.name}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400 ml-2">({column.type})</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleSort(column.id)}
                              >
                                {sortColumn === column.id ? (
                                  sortDirection === 'asc' ? (
                                    <SortAsc className="h-3 w-3" />
                                  ) : (
                                    <SortDesc className="h-3 w-3" />
                                  )
                                ) : (
                                  <SortAsc className="h-3 w-3 opacity-30" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="w-12 px-4 py-3 border-l dark:border-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rowIndex) => (
                      <tr key={row.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {rowIndex + 1}
                        </td>
                        {currentTable.columns.map((column) => (
                          <td key={column.id} className="px-4 py-2 border-l dark:border-gray-700">
                            <Input
                              value={row[column.id] || ''}
                              onChange={(e) => updateCell(currentTable.id, row.id, column.id, e.target.value)}
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-2 bg-transparent"
                              placeholder={`Enter ${column.name.toLowerCase()}`}
                              type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 border-l dark:border-gray-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => deleteRow(currentTable.id, row.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredRows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Grid3x3 className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      {searchQuery ? 'No matching rows found' : 'No data yet'}
                    </p>
                    <p className="text-sm mt-1">
                      {searchQuery ? 'Try a different search query' : 'Click "Add Row" to start adding data'}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No table selected</p>
                <p className="text-sm mt-1">Create or select a table to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
