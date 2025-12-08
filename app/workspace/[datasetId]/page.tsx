'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  LayoutDashboard,
  FileText,
  Columns,
  Settings,
  Menu as MenuIcon,
  Trash2,
  Upload,
  BarChart3,
  X
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkspaceToolbar } from '@/components/workspace-toolbar'
import { SheetSidebar } from '@/components/sheet-sidebar'
import { IconSidebar } from '@/components/icon-sidebar'
import { ImportDataDialog } from '@/components/import-data-dialog'
import { ShareDialog } from '@/components/share-dialog'
import ChartView from '@/components/chart-view'
import ReturnsAnalysis from '@/components/returns-analysis'
import DashboardView from '@/components/dashboard-view'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DatasetWorkspacePage() {
  const params = useParams<{ datasetId: string }>()
  const datasetId = params.datasetId
  
  const { tables } = useTableStore()
  const { getViewsByTable, setActiveView } = useViewStore()
  
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [supabaseDataset, setSupabaseDataset] = useState<any>(null)
  const [supabaseViews, setSupabaseViews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

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
  const [cellColors, setCellColors] = useState<Record<string, string>>({}) // { "rowId-columnId": "color" }
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: string; columnId: string } | null>(null)
  
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  
  const baseDataset = supabaseDataset || tables.find(t => t.id === datasetId)
  const currentDataset = baseDataset ? {
    ...baseDataset,
    columns: baseDataset.columns || [],
    rows: baseDataset.rows || []
  } : null
  
  const datasetSheets = supabaseViews.length > 0 ? supabaseViews : getViewsByTable(datasetId)
  const currentSheet = datasetSheets.find(s => s.id === activeSheetId) || datasetSheets[0]

  useEffect(() => {
    async function fetchData() {
      if (!datasetId) return
      setLoading(true)
      try {
        const { data: datasetData, error: datasetError } = await (supabase as any)
          .from('tables')
          .select('*')
          .eq('id', datasetId)
          .single()
        if (datasetError) throw datasetError

        const { data: viewsData, error: viewsError } = await (supabase as any)
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
    fetchData()
  }, [datasetId])

  // Removed redundant effect - activeSheetId is now set in fetchData

  useEffect(() => {
    if (activeSheetId) setActiveView(activeSheetId)
  }, [activeSheetId])

  // Sync horizontal scroll between bottom scrollbar and table
  useEffect(() => {
    const topScroll = topScrollRef.current
    const tableContainer = tableContainerRef.current
    
    if (!topScroll || !tableContainer) return
    
    const updateScrollbarWidth = () => {
      const scrollWidth = tableContainer.scrollWidth
      const clientWidth = tableContainer.clientWidth
      
      // Only show scrollbar if content is wider than container
      if (scrollWidth > clientWidth) {
        topScroll.innerHTML = `<div style="width:${scrollWidth}px; height:1px;"></div>`
      } else {
        topScroll.innerHTML = `<div style="width:100%; height:1px;"></div>`
      }
    }
    
    // Update on mount and when content changes
    const timeoutId = setTimeout(updateScrollbarWidth, 100)
    
    const handleTopScroll = () => {
      tableContainer.scrollLeft = topScroll.scrollLeft
    }
    
    const handleTableScroll = () => {
      topScroll.scrollLeft = tableContainer.scrollLeft
    }
    
    topScroll.addEventListener('scroll', handleTopScroll)
    tableContainer.addEventListener('scroll', handleTableScroll)
    window.addEventListener('resize', updateScrollbarWidth)
    
    return () => {
      clearTimeout(timeoutId)
      topScroll.removeEventListener('scroll', handleTopScroll)
      tableContainer.removeEventListener('scroll', handleTableScroll)
      window.removeEventListener('resize', updateScrollbarWidth)
    }
  })


  if (loading) {
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

  // Helper function to update Supabase views
  const updateSupabaseView = (viewId: string, updates: any) => {
    setSupabaseViews(views => views.map(v => v.id === viewId ? { ...v, ...updates } : v))
  }

  // Sheet icon mapping
  const sheetIconMap: Record<string, any> = {
    chart: BarChart3,
    gallery: LayoutGrid,
    form: FileText,
    kanban: Columns,
    default: Grid3x3
  }

  const getSheetIcon = (type: string) => {
    const Icon = sheetIconMap[type] || sheetIconMap.default
    return <Icon className="h-4 w-4" />
  }

  const handleAddRow = async () => {
    if (!currentDataset || !currentSheet) return
    const newRow: any = { id: crypto.randomUUID() }
    currentDataset.columns.forEach((col: any) => { newRow[col.id] = '' })
    const updatedRows = [...(currentSheet.rows || []), newRow]
    try {
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      updateSupabaseView(currentSheet.id, { rows: updatedRows })
    } catch (error) {
      console.error('Error adding row:', error)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!currentSheet) return
    const updatedRows = (currentSheet.rows || []).filter((r: any) => r.id !== rowId)
    try {
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!currentDataset) return
    
    // Remove column from dataset
    const updatedColumns = currentDataset.columns.filter((c: any) => c.id !== columnId)
    
    // Remove column data from all rows in all views
    const updatedRows = currentDataset.rows.map((row: any) => {
      const { [columnId]: _, ...rest } = row
      return rest
    })
    
    try {
      // Update the table
      await (supabase as any).from('tables').update({ 
        columns: updatedColumns,
        rows: updatedRows 
      }).eq('id', datasetId)
      
      // Update all views to remove the column from visible_columns
      const viewUpdates = supabaseViews.map(async (view) => {
        const updatedVisibleColumns = (view.visible_columns || []).filter((id: string) => id !== columnId)
        const updatedViewRows = (view.rows || []).map((row: any) => {
          const { [columnId]: _, ...rest } = row
          return rest
        })
        
        await (supabase as any).from('views').update({
          visible_columns: updatedVisibleColumns,
          rows: updatedViewRows
        }).eq('id', view.id)
      })
      
      await Promise.all(viewUpdates)
      
      // Refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting column:', error)
    }
  }

  const handleUpdateCell = async (rowId: string, columnId: string, value: any) => {
    if (!currentSheet) return
    const updatedRows = (currentSheet.rows || []).map((r: any) => r.id === rowId ? { ...r, [columnId]: value } : r)
    try {
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      updateSupabaseView(currentSheet.id, { rows: updatedRows })
    } catch (error) {
      console.error('Error updating cell:', error)
    }
  }

  const handleAddSheet = async (viewType: 'grid' | 'gallery' | 'form' | 'kanban' | 'calendar' | 'chart' | 'returns' | 'dashboard' = 'grid') => {
    if (!currentDataset) return
    const newSheet = {
      user_id: userId,
      table_id: currentDataset.id,
      name: viewType === 'chart' ? `Chart ${datasetSheets.filter(s => s.type === 'chart').length + 1}` : 
            viewType === 'returns' ? 'Returns Analysis' : 
            viewType === 'dashboard' ? `Dashboard ${datasetSheets.filter(s => s.type === 'dashboard').length + 1}` :
            `Sheet ${datasetSheets.length + 1}`,
      type: viewType,
      visible_columns: currentDataset.columns.map((c: any) => c.id),
      filters: [], sorts: [], color_rules: [], group_by: null, rows: [],
      chart_config: viewType === 'chart' ? { chartType: 'bar', xAxisField: '', yAxisField: '', aggregation: 'count' } : null
    }
    try {
      const { data } = await (supabase as any).from('views').insert([newSheet]).select().single()
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
      await (supabase as any).from('views').update({ name: newName }).eq('id', sheetId)
      setSupabaseViews(supabaseViews.map(v => v.id === sheetId ? { ...v, name: newName } : v))
    } catch (error) {
      console.error('Error renaming sheet:', error)
    }
  }

  const handleDeleteSheet = async (sheetId: string) => {
    if (datasetSheets.length <= 1) return alert('Cannot delete the last sheet')
    try {
      await (supabase as any).from('views').delete().eq('id', sheetId)
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
      const { data } = await (supabase as any).from('views').insert([duplicatedSheet]).select().single()
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
      await (supabase as any).from('views').update(updates).eq('id', currentSheet.id)
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
  
  // Debug logging
  console.log('🔍 Dataset Columns:', currentDataset.columns)
  console.log('🔍 Active Visible Columns:', activeVisibleColumns)
  console.log('🔍 Filtered Visible Columns:', visibleColumns)
  console.log('🔍 Current Sheet:', currentSheet)
  console.log('🔍 Current Sheet Rows:', currentSheet?.rows?.length || 0)
  
  // Fallback: If no columns are visible, show all columns
  const finalVisibleColumns = visibleColumns.length > 0 ? visibleColumns : currentDataset.columns
  console.log('🔍 Final Visible Columns:', finalVisibleColumns)

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
        const rawValue = row[filter.columnId] || ''
        const cellValue = String(rawValue).toLowerCase()
        const filterValue = String(filter.value).toLowerCase()
        
        console.log(`Filter check: "${cellValue}" ${filter.operator} "${filterValue}"`)
        
        switch (filter.operator) {
          case 'is':
          case 'equals': 
            return cellValue === filterValue
          case 'is_not':
            return cellValue !== filterValue
          case 'contains': 
            return cellValue.includes(filterValue)
          case 'does_not_contain':
            return !cellValue.includes(filterValue)
          case 'startsWith': 
            return cellValue.startsWith(filterValue)
          case 'endsWith': 
            return cellValue.endsWith(filterValue)
          case 'greater_than': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter
          }
          case 'less_than': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue < numFilter
          }
          case 'greater_than_or_equal': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue >= numFilter
          }
          case 'less_than_or_equal': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue <= numFilter
          }
          case 'is_empty':
          case 'isEmpty': 
            return !cellValue
          case 'is_not_empty':
          case 'isNotEmpty': 
            return !!cellValue
          default: 
            return true
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
      (rows as any[]).map((row: any) => {
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
      const rowsArray = rows as any[]
      if (showAllRows) return [group, { rows: rowsArray, total: rowsArray.length }]
      const startIndex = (currentPage - 1) * rowsPerPage
      const paginatedRows = rowsArray.slice(startIndex, startIndex + rowsPerPage)
      return [group, { rows: paginatedRows, total: rowsArray.length }]
    })
  )

  const totalRows = Object.values(rowsWithColor).reduce((sum, rows) => sum + (rows as any[]).length, 0)
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const rowPaddingClass = rowHeight === 'compact' ? 'py-1 text-xs' : 'py-3 text-sm'
  const cellPaddingClass = rowHeight === 'compact' ? 'py-1' : 'py-3'
  const inputHeightClass = rowHeight === 'compact' ? 'h-7' : 'h-8'

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar 
          isExpanded={!sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          datasetName={currentDataset.name}
          onAddSheet={handleAddSheet}
          onShare={() => setShareDialogOpen(true)}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-14" style={{ maxWidth: '100%' }}>
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between">
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
                    await (supabase as any).from('views').update({ chart_config: config }).eq('id', currentSheet.id)
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
          ) : currentSheet?.type === 'dashboard' ? (
            <div className="flex-1 overflow-hidden">
              <DashboardView
                widgets={currentSheet.dashboard_widgets || []}
                onWidgetsChange={async (widgets) => {
                  try {
                    await (supabase as any).from('views').update({ dashboard_widgets: widgets }).eq('id', currentSheet.id)
                    setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, dashboard_widgets: widgets } : v))
                  } catch (error) {
                    console.error('Error updating dashboard widgets:', error)
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Table container with scroll - visible vertical scrollbar, hidden horizontal */}
              <div 
                ref={tableContainerRef} 
                className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-md dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500" 
                style={{ scrollbarWidth: 'thin' }}
              >
                <table className="border-separate border-spacing-0 w-full border-2 border-gray-300 dark:border-gray-600" style={{ minWidth: '100%' }}>
                    <thead className="bg-white dark:bg-gray-800">
                      <tr className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b-2 border-gray-300 dark:border-gray-600">
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky left-0 z-30 bg-white dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-600" style={{ width: '60px', minWidth: '60px' }}>#</th>
                        {finalVisibleColumns.map((column: any) => (
                          <th key={column.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap bg-white dark:bg-gray-800 group border-r-2 border-gray-300 dark:border-gray-600" style={{ minWidth: '250px' }}>
                            <div className="flex items-center justify-between gap-2">
                              <span>{column.name}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteColumn(column.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase bg-white dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-600" style={{ width: '100px', minWidth: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-300 dark:divide-gray-600">
                      {Object.entries(displayRowsWithColor).map(([group, { rows }]) =>
                        rows.map((row: any, index: number) => (
                          <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${rowPaddingClass}`} style={{ backgroundColor: row.rowColor }}>
                            <td className={`px-4 ${cellPaddingClass} text-center text-sm text-gray-500 dark:text-gray-400 font-medium sticky left-0 z-10 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-gray-300 dark:border-gray-600`} style={{ width: '60px', minWidth: '60px' }}>
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </td>
                            {finalVisibleColumns.map((column: any) => (
                              <td key={column.id} className={`px-4 ${cellPaddingClass} border-r-2 border-b-2 border-gray-300 dark:border-gray-600`} style={{ minWidth: '250px' }}>
                                <Input
                                  type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                                  value={row[column.id] || ''}
                                  onChange={(e) => handleUpdateCell(row.id, column.id, e.target.value)}
                                  className={`border-0 focus:ring-1 focus:ring-primary bg-transparent w-full px-2 ${inputHeightClass} text-sm`}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center border-r-2 border-b-2 border-gray-300 dark:border-gray-600" style={{ width: '100px', minWidth: '100px' }}>
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
            </div>
          )}
          
          {/* Fixed bottom bar with row count */}
          {currentSheet?.type !== 'chart' && currentSheet?.type !== 'returns' && (
            <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'} total
              </div>
              <div className="flex items-center gap-2">
                {!showAllRows && totalPages > 1 && (
                  <div className="flex items-center gap-4">
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
            </div>
          )}
        </main>
      </div>

      {/* Fixed bottom bars - Google Sheets style */}
      <div 
        className="fixed bottom-0 right-0 z-30 flex flex-col"
        style={{ left: sidebarCollapsed ? '64px' : '256px' }}
      >
        {/* Horizontal scrollbar for table - ABOVE sheet tabs */}
        <div 
          ref={topScrollRef}
          className="w-full overflow-x-auto overflow-y-hidden bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600"
          style={{ height: '16px' }}
        />
        
        {/* Sheet tabs bar - BELOW scrollbar */}
        <div className="w-full bg-white dark:bg-gray-800 border-t dark:border-gray-700 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1 px-4 py-2">
            {datasetSheets.map(sheet => (
              <div
                key={sheet.id}
                className={`group inline-flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors relative ${
                  sheet.id === activeSheetId 
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary font-medium border-t-2 border-primary' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                }`}
              >
                <button
                  onClick={() => { setActiveSheetId(sheet.id); setCurrentPage(1) }}
                  className="inline-flex items-center gap-2"
                >
                  {getSheetIcon(sheet.type)}
                  <span className="text-sm">{sheet.name}</span>
                </button>
                {datasetSheets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete sheet "${sheet.name}"? This cannot be undone.`)) {
                        handleDeleteSheet(sheet.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-500"
                    title="Delete sheet"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleAddSheet('grid')}>
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('chart')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Chart View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('returns')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Returns Analysis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('gallery')}>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Gallery View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('form')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Form View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddSheet('kanban')}>
                  <Columns className="h-4 w-4 mr-2" />
                  Kanban View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ImportDataDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        datasetId={datasetId}
        sheetId={currentSheet?.id || ''}
        onImportComplete={async () => {
          const { data: viewsData } = await (supabase as any).from('views').select('*').eq('table_id', datasetId)
          if (viewsData) setSupabaseViews(viewsData)
        }}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        datasetName={currentDataset.name}
        datasetId={datasetId}
      />
    </div>
  )
}
