'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTableStore } from '@/store/useTableStore'
import { useViewStore } from '@/store/useViewStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import {
  Database,
  Plus,
  ArrowLeft,
  Grid3x3,
  LayoutGrid,
  FileText,
  Columns,
  Settings,
  Menu as MenuIcon,
  Trash2,
  Upload,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkspaceToolbar } from '@/components/workspace-toolbar'
import { SheetSidebar } from '@/components/sheet-sidebar'
import { ImportDataDialog } from '@/components/import-data-dialog'
import ChartView from '@/components/chart-view'
import ReturnsAnalysis from '@/components/returns-analysis'

export default function DatasetWorkspacePage() {
  const params = useParams<{ datasetId: string }>()
  const datasetId = params.datasetId
  
  const { tables } = useTableStore()
  const { getViewsByTable, setActiveView } = useViewStore()
  
  const [mounted, setMounted] = useState(false)
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [supabaseDataset, setSupabaseDataset] = useState<any>(null)
  const [supabaseViews, setSupabaseViews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const [localVisibleColumns, setLocalVisibleColumns] = useState<string[]>([])
  const [localGroupBy, setLocalGroupBy] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<any[]>([])
  const [localSorts, setLocalSorts] = useState<any[]>([])
  const [localColorRules, setLocalColorRules] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [showAllRows, setShowAllRows] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [rowHeight, setRowHeight] = useState<'compact' | 'comfortable'>('comfortable')
  
  const baseDataset = supabaseDataset || tables.find(t => t.id === datasetId)
  const currentDataset = baseDataset ? {
    ...baseDataset,
    columns: baseDataset.columns || [],
    rows: baseDataset.rows || []
  } : null
  
  const datasetSheets = supabaseViews.length > 0 ? supabaseViews : getViewsByTable(datasetId)
  const currentSheet = datasetSheets.find(s => s.id === activeSheetId) || datasetSheets[0]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (!datasetId) return
      try {
        const { data: datasetData, error: datasetError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', datasetId)
          .single()
        if (datasetError) throw datasetError

        const { data: viewsData, error: viewsError } = await supabase
          .from('views')
          .select('*')
          .eq('table_id', datasetId)
        if (viewsError) throw viewsError

        setSupabaseDataset(datasetData)
        setSupabaseViews(viewsData || [])
        
        if (viewsData && viewsData.length > 0 && !activeSheetId) {
          setActiveSheetId(viewsData[0].id)
          setActiveView(viewsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching dataset:', error)
      } finally {
        setLoading(false)
      }
    }
    if (mounted) fetchData()
  }, [mounted, datasetId])

  useEffect(() => {
    if (datasetSheets.length > 0 && !activeSheetId) {
      setActiveSheetId(datasetSheets[0].id)
      setActiveView(datasetSheets[0].id)
    }
  }, [datasetSheets])

  useEffect(() => {
    if (activeSheetId) setActiveView(activeSheetId)
  }, [activeSheetId])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Database className="h-16 w-16 opacity-20 animate-pulse" />
      </div>
    )
  }

  if (!currentDataset) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold mb-2">Dataset not found</h1>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const userId = '0aebc03e-defa-465d-ac65-b6c15806fd26'

  const handleAddRow = async () => {
    if (!currentDataset || !currentSheet) return
    const newRow: any = { id: crypto.randomUUID() }
    currentDataset.columns.forEach((col: any) => { newRow[col.id] = '' })
    const updatedRows = [...(currentSheet.rows || []), newRow]
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error adding row:', error)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!currentSheet) return
    const updatedRows = (currentSheet.rows || []).filter((r: any) => r.id !== rowId)
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const handleUpdateCell = async (rowId: string, columnId: string, value: any) => {
    if (!currentSheet) return
    const updatedRows = (currentSheet.rows || []).map((r: any) => r.id === rowId ? { ...r, [columnId]: value } : r)
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error updating cell:', error)
    }
  }

  const handleAddSheet = async (viewType: 'grid' | 'gallery' | 'form' | 'kanban' | 'calendar' | 'chart' | 'returns' = 'grid') => {
    if (!currentDataset) return
    const newSheet = {
      user_id: userId,
      table_id: currentDataset.id,
      name: viewType === 'chart' ? `Chart ${datasetSheets.filter(s => s.type === 'chart').length + 1}` : viewType === 'returns' ? 'Returns Analysis' : `Sheet ${datasetSheets.length + 1}`,
      type: viewType,
      visible_columns: currentDataset.columns.map((c: any) => c.id),
      filters: [], sorts: [], color_rules: [], group_by: null, rows: [],
      chart_config: viewType === 'chart' ? { chartType: 'bar', xAxisField: '', yAxisField: '', aggregation: 'count' } : null
    }
    try {
      const { data } = await supabase.from('views').insert([newSheet]).select().single()
      if (data) {
        setSupabaseViews([...supabaseViews, data])
        setActiveSheetId(data.id)
      }
    } catch (error) {
      console.error('Error adding sheet:', error)
    }
  }

  const handleRenameSheet = async (sheetId: string, newName: string) => {
    try {
      await supabase.from('views').update({ name: newName }).eq('id', sheetId)
      setSupabaseViews(supabaseViews.map(v => v.id === sheetId ? { ...v, name: newName } : v))
    } catch (error) {
      console.error('Error renaming sheet:', error)
    }
  }

  const handleDeleteSheet = async (sheetId: string) => {
    if (datasetSheets.length <= 1) return alert('Cannot delete the last sheet')
    try {
      await supabase.from('views').delete().eq('id', sheetId)
      const remainingSheets = supabaseViews.filter(v => v.id !== sheetId)
      setSupabaseViews(remainingSheets)
      if (activeSheetId === sheetId) setActiveSheetId(remainingSheets[0].id)
    } catch (error) {
      console.error('Error deleting sheet:', error)
    }
  }

  const handleDuplicateSheet = async (sheetId: string) => {
    const sheetToDuplicate = datasetSheets.find(s => s.id === sheetId)
    if (!sheetToDuplicate) return
    const duplicatedSheet = {
      user_id: userId, table_id: currentDataset.id,
      name: `${sheetToDuplicate.name} (Copy)`, type: sheetToDuplicate.type,
      visible_columns: sheetToDuplicate.visible_columns || [],
      filters: sheetToDuplicate.filters || [], sorts: sheetToDuplicate.sorts || [],
      color_rules: sheetToDuplicate.color_rules || [], group_by: sheetToDuplicate.group_by || null,
      rows: sheetToDuplicate.rows || [], chart_config: sheetToDuplicate.chart_config || null
    }
    try {
      const { data } = await supabase.from('views').insert([duplicatedSheet]).select().single()
      if (data) {
        setSupabaseViews([...supabaseViews, data])
        setActiveSheetId(data.id)
      }
    } catch (error) {
      console.error('Error duplicating sheet:', error)
    }
  }

  const updateView = async (updates: any) => {
    if (!currentSheet) return
    try {
      await supabase.from('views').update(updates).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, ...updates } : v))
    } catch (error) {
      console.error('Error updating view:', error)
    }
  }

  const handleVisibleColumnsChange = async (columns: string[]) => {
    setLocalVisibleColumns(columns)
    await updateView({ visible_columns: columns })
  }

  const handleGroupByChange = async (columnId: string | null) => {
    setLocalGroupBy(columnId)
    await updateView({ group_by: columnId })
  }

  const handleFiltersChange = async (filters: any[]) => {
    setLocalFilters(filters)
    await updateView({ filters })
  }

  const handleSortsChange = async (sorts: any[]) => {
    setLocalSorts(sorts)
    await updateView({ sorts })
  }

  const handleColorRulesChange = async (colorRules: any[]) => {
    setLocalColorRules(colorRules)
    await updateView({ color_rules: colorRules })
  }

  const activeVisibleColumns = localVisibleColumns.length > 0 ? localVisibleColumns : (currentSheet?.visible_columns || currentDataset.columns.map((c: any) => c.id))
  const activeGroupBy = localGroupBy || currentSheet?.group_by || null
  const activeFilters = localFilters.length > 0 ? localFilters : (currentSheet?.filters || [])
  const activeSorts = localSorts.length > 0 ? localSorts : (currentSheet?.sorts || [])
  const activeColorRules = localColorRules.length > 0 ? localColorRules : (currentSheet?.color_rules || [])

  const visibleColumns = currentDataset.columns.filter((col: any) => activeVisibleColumns.includes(col.id))

  const baseRows = (() => {
    if (currentSheet?.type === 'chart') {
      const firstGridView = datasetSheets.find(s => s.type === 'grid')
      return firstGridView?.rows || currentDataset.rows || []
    }
    return currentSheet?.rows || currentDataset.rows || []
  })()

  const getFilteredRows = () => {
    let rows = [...baseRows]
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase()
      rows = rows.filter((row: any) => currentDataset.columns.some((col: any) => String(row[col.id] || '').toLowerCase().includes(searchLower)))
    }
    
    console.log('🔍 Active Filters:', activeFilters)
    
    for (const filter of activeFilters) {
      const beforeCount = rows.length
      rows = rows.filter((row: any) => {
        const cellValue = String(row[filter.columnId] || '').toLowerCase()
        const filterValue = String(filter.value).toLowerCase()
        
        console.log(`Filter check: "${cellValue}" ${filter.operator} "${filterValue}"`)
        
        switch (filter.operator) {
          case 'is':
          case 'equals': return cellValue === filterValue
          case 'contains': return cellValue.includes(filterValue)
          case 'startsWith': return cellValue.startsWith(filterValue)
          case 'endsWith': return cellValue.endsWith(filterValue)
          case 'isEmpty': return !cellValue
          case 'isNotEmpty': return !!cellValue
          default: return true
        }
      })
      console.log(`Filter applied: ${beforeCount} → ${rows.length} rows`)
    }
    return rows
  }

  const filteredRows = getFilteredRows()
  const sortedRows = [...filteredRows].sort((a: any, b: any) => {
    for (const sort of activeSorts) {
      const aVal = a[sort.columnId] || ''
      const bVal = b[sort.columnId] || ''
      let comparison = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal))
      if (comparison !== 0) return sort.direction === 'asc' ? comparison : -comparison
    }
    return 0
  })

  const groupedRows = activeGroupBy
    ? sortedRows.reduce((acc, row) => {
        const key = String(row[activeGroupBy] || 'Ungrouped')
        if (!acc[key]) acc[key] = []
        acc[key].push(row)
        return acc
      }, {} as Record<string, typeof sortedRows>)
    : { 'All Rows': sortedRows }

  const rowsWithColor = Object.fromEntries(
    Object.entries(groupedRows).map(([group, rows]) => [
      group,
      rows.map(row => {
        let rowColor = 'transparent'
        if (row.manualColor) {
          rowColor = row.manualColor
        } else if (activeColorRules.length > 0) {
          const matchingRule = activeColorRules.find(rule => String(row[rule.columnId] || '').toLowerCase() === String(rule.value).toLowerCase())
          if (matchingRule) rowColor = matchingRule.color
        }
        return { ...row, rowColor }
      })
    ])
  )

  const displayRowsWithColor = Object.fromEntries(
    Object.entries(rowsWithColor).map(([group, rows]) => {
      if (showAllRows) return [group, { rows, total: rows.length }]
      const startIndex = (currentPage - 1) * rowsPerPage
      const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage)
      return [group, { rows: paginatedRows, total: rows.length }]
    })
  )

  const totalRows = Object.values(rowsWithColor).reduce((sum, rows) => sum + rows.length, 0)
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const rowPaddingClass = rowHeight === 'compact' ? 'py-1 text-xs' : 'py-3 text-sm'
  const cellPaddingClass = rowHeight === 'compact' ? 'py-1' : 'py-3'
  const inputHeightClass = rowHeight === 'compact' ? 'h-7' : 'h-8'

  const getSheetIcon = (type: string) => {
    if (type === 'chart') return <BarChart3 className="h-4 w-4" />
    if (type === 'gallery') return <LayoutGrid className="h-4 w-4" />
    if (type === 'form') return <FileText className="h-4 w-4" />
    if (type === 'kanban') return <Columns className="h-4 w-4" />
    return <Grid3x3 className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="h-9 w-9">
            <MenuIcon className="h-5 w-5" />
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-9">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <Database className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">{currentDataset.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && currentSheet && (
          <SheetSidebar
            sheets={datasetSheets}
            activeSheetId={activeSheetId}
            onSheetSelect={(sheetId) => {
              setActiveSheetId(sheetId)
              setActiveView(sheetId)
              setCurrentPage(1)
            }}
            onAddSheet={handleAddSheet}
            onRenameSheet={handleRenameSheet}
            onDeleteSheet={handleDeleteSheet}
            onDuplicateSheet={handleDuplicateSheet}
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {datasetSheets.map(sheet => (
                  <button
                    key={sheet.id}
                    onClick={() => { setActiveSheetId(sheet.id); setCurrentPage(1) }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      sheet.id === activeSheetId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getSheetIcon(sheet.type)}
                    <span className="text-sm">{sheet.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button size="sm" onClick={handleAddRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>
            </div>
          </div>

          {currentSheet?.type !== 'chart' && currentSheet?.type !== 'returns' && (
            <WorkspaceToolbar
              columns={currentDataset.columns || []}
              visibleColumns={activeVisibleColumns}
              groupBy={activeGroupBy}
              filters={activeFilters}
              sorts={activeSorts}
              colorRules={activeColorRules}
              onVisibleColumnsChange={handleVisibleColumnsChange}
              onGroupByChange={handleGroupByChange}
              onFiltersChange={handleFiltersChange}
              onSortsChange={handleSortsChange}
              onColorRulesChange={handleColorRulesChange}
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              rowHeight={rowHeight}
              onRowHeightChange={setRowHeight}
              onViewRename={currentSheet ? () => {
                const name = window.prompt('Rename view', currentSheet.name)
                if (name && name !== currentSheet.name) handleRenameSheet(currentSheet.id, name)
              } : undefined}
              onViewDuplicate={currentSheet ? () => handleDuplicateSheet(currentSheet.id) : undefined}
              onViewDelete={currentSheet ? () => handleDeleteSheet(currentSheet.id) : undefined}
            />
          )}

          {currentSheet?.type === 'chart' ? (
            <div className="flex-1 overflow-auto">
              <ChartView
                columns={currentDataset.columns || []}
                rows={sortedRows || []}
                sheets={datasetSheets}
                chartConfig={currentSheet.chart_config || { chartType: 'bar', xAxisField: '', yAxisField: '', aggregation: 'count' }}
                onConfigChange={async (config) => {
                  try {
                    await supabase.from('views').update({ chart_config: config }).eq('id', currentSheet.id)
                    setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, chart_config: config } : v))
                  } catch (error) {
                    console.error('Error updating chart config:', error)
                  }
                }}
              />
            </div>
          ) : currentSheet?.type === 'returns' ? (
            <div className="flex-1 overflow-auto">
              <ReturnsAnalysis
                columns={currentDataset.columns || []}
                rows={baseRows || []}
                sheets={datasetSheets}
              />
            </div>
          ) : (
            <div className="flex-1 p-4 flex flex-col">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                <div 
                  className="flex-1 overflow-auto"
                >
                  <table className="w-full border-separate border-spacing-0" style={{ width: 'max-content', minWidth: '100%' }}>
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-20 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: '60px', minWidth: '60px' }}>#</th>
                        {visibleColumns.map((column: any) => (
                          <th key={column.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap" style={{ minWidth: '200px', maxWidth: '300px' }}>
                            {column.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: '100px', minWidth: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(displayRowsWithColor).map(([group, { rows }]) =>
                        rows.map((row: any, index: number) => (
                          <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${rowPaddingClass}`}>
                            <td className={`px-4 ${cellPaddingClass} text-center text-sm text-gray-500 dark:text-gray-400 font-medium`} style={{ width: '60px', minWidth: '60px' }}>
                              {index + 1}
                            </td>
                            {visibleColumns.map((column: any) => (
                              <td key={column.id} className={`px-4 ${cellPaddingClass}`} style={{ minWidth: '200px', maxWidth: '300px' }}>
                                <Input
                                  type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                                  value={row[column.id] || ''}
                                  onChange={(e) => handleUpdateCell(row.id, column.id, e.target.value)}
                                  className={`border-0 focus:ring-1 focus:ring-primary bg-transparent w-full px-2 ${inputHeightClass} text-sm`}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center" style={{ width: '100px', minWidth: '100px' }}>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(row.id)} className="text-gray-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Total row count - Google Sheets style */}
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                  {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'} total
                </div>
              </div>

              {!showAllRows && totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input type="checkbox" checked={showAllRows} onChange={(e) => { setShowAllRows(e.target.checked); if (!e.target.checked) setCurrentPage(1) }} className="rounded" />
                        Show all rows
                      </label>
                      <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }} className="border rounded px-2 py-1 text-sm">
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={200}>200 per page</option>
                        <option value={500}>500 per page</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages} ({totalRows} rows)
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        Previous
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </main>
      </div>

      <ImportDataDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        datasetId={datasetId}
        sheetId={currentSheet?.id || ''}
        onImportComplete={async () => {
          const { data: viewsData } = await supabase.from('views').select('*').eq('table_id', datasetId)
          if (viewsData) setSupabaseViews(viewsData)
        }}
      />
    </div>
  )
}
