'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTableStore } from '@/store/useTableStore'
import { useViewStore } from '@/store/useViewStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  X,
  Maximize2,
  MessageSquare,
  History,
  ChevronDown,
  ClipboardPaste,
  Check
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
  const [globalSearch, setGlobalSearch] = useState('')
  const [rowHeight, setRowHeight] = useState<'compact' | 'comfortable'>('comfortable')
  const [cellColors, setCellColors] = useState<Record<string, string>>({}) // { "rowId-columnId": "color" }
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: string; columnId: string } | null>(null)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [recordViewTab, setRecordViewTab] = useState<'comments' | 'history'>('comments')
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [copiedCell, setCopiedCell] = useState<{ rowId: string; columnId: string; value: any; color?: string } | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  
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
        
        console.log('🔍 Workspace - Dataset fetch:', { datasetData, datasetError })
        console.log('🔍 Workspace - Rows count:', datasetData?.rows?.length || 0)
        
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

  const handlePasteFromClipboard = async () => {
    if (!currentDataset || !currentSheet) return
    
    try {
      const text = await navigator.clipboard.readText()
      
      // Parse tab-separated or comma-separated values (from Excel/Sheets)
      const lines = text.trim().split('\n')
      const newRows: any[] = []
      
      for (const line of lines) {
        // Try tab-separated first (Excel default), then comma-separated
        const values = line.includes('\t') ? line.split('\t') : line.split(',')
        const newRow: any = { id: crypto.randomUUID() }
        
        // Map values to columns
        currentDataset.columns.forEach((col: any, index: number) => {
          newRow[col.id] = values[index]?.trim() || ''
        })
        
        newRows.push(newRow)
      }
      
      if (newRows.length === 0) {
        alert('No data found in clipboard')
        return
      }
      
      const updatedRows = [...(currentSheet.rows || []), ...newRows]
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      updateSupabaseView(currentSheet.id, { rows: updatedRows })
      
      alert(`Successfully added ${newRows.length} row(s) from clipboard!`)
    } catch (error) {
      console.error('Error pasting from clipboard:', error)
      alert('Failed to paste from clipboard. Make sure you have copied data from Excel or a spreadsheet.')
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

  const handleCopyCell = (rowId: string, columnId: string, value: any) => {
    const cellKey = `${rowId}-${columnId}`
    const color = cellColors[cellKey]
    setCopiedCell({ rowId, columnId, value, color })
    
    // Also copy to system clipboard
    navigator.clipboard.writeText(value || '')
  }

  const handlePasteCell = async (targetRowId: string, targetColumnId: string) => {
    if (!copiedCell) return
    
    // Update cell value
    await handleUpdateCell(targetRowId, targetColumnId, copiedCell.value)
    
    // Copy cell color if exists
    if (copiedCell.color) {
      const targetCellKey = `${targetRowId}-${targetColumnId}`
      setCellColors(prev => ({ ...prev, [targetCellKey]: copiedCell.color! }))
    }
  }

  // Keyboard shortcuts for copy/paste
  const handleKeyDown = (e: KeyboardEvent, rowId: string, columnId: string, value: any) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault()
      handleCopyCell(rowId, columnId, value)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      handlePasteCell(rowId, columnId)
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

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumn(columnId)
  }

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedColumn && draggedColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleColumnDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    const currentColumns = [...activeVisibleColumns]
    const draggedIndex = currentColumns.indexOf(draggedColumn)
    const targetIndex = currentColumns.indexOf(targetColumnId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    // Reorder columns
    currentColumns.splice(draggedIndex, 1)
    currentColumns.splice(targetIndex, 0, draggedColumn)

    setLocalVisibleColumns(currentColumns)
    await updateView({ visible_columns: currentColumns })
    
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  // Convert index to column letter (A, B, C, ... Z, AA, AB, etc.)
  const getColumnLetter = (index: number): string => {
    let letter = ''
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter
      index = Math.floor(index / 26) - 1
    }
    return letter
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
      const fieldId = sort.columnId || sort.field // Support both columnId and field
      const aVal = a[fieldId] || ''
      const bVal = b[fieldId] || ''
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
          const matchingRule = activeColorRules.find((rule: any) => String(row[rule.columnId] || '').toLowerCase() === String(rule.value).toLowerCase())
          if (matchingRule) rowColor = matchingRule.color
        }
        return { ...row, rowColor }
      })
    ])
  )

  const displayRowsWithColor = Object.fromEntries(
    Object.entries(rowsWithColor).map(([group, rows]) => {
      const rowsArray = rows as any[]
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
                {/* Sheet Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                      <span className="flex items-center gap-2">
                        {currentSheet && getSheetIcon(currentSheet.type)}
                        <span className="text-sm">{currentSheet?.name || 'Select Sheet'}</span>
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    {datasetSheets.map(sheet => (
                      <DropdownMenuItem 
                        key={sheet.id}
                        onClick={() => setActiveSheetId(sheet.id)}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          {getSheetIcon(sheet.type)}
                          <span>{sheet.name}</span>
                        </span>
                        {sheet.id === activeSheetId && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleAddRow}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Single Row
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePasteFromClipboard}>
                      <ClipboardPaste className="h-4 w-4 mr-2" />
                      Paste from Clipboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                {currentSheet && datasetSheets.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete sheet "${currentSheet.name}"? This cannot be undone.`)) {
                        handleDeleteSheet(currentSheet.id)
                      }
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete current sheet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" title="Add new sheet">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                  </DropdownMenuContent>
                </DropdownMenu>
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
              {/* Table container with scroll - both vertical and horizontal */}
              <div 
                ref={tableContainerRef} 
                className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-md dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500" 
                style={{ scrollbarWidth: 'thin' }}
              >
                <table className="border-separate border-spacing-0 w-full border-2 border-gray-300 dark:border-gray-600" style={{ minWidth: '100%' }}>
                    <thead className="bg-white dark:bg-gray-800">
                      <tr className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b-2 border-gray-300 dark:border-gray-600">
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky left-0 z-30 bg-white dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-600" style={{ width: '60px', minWidth: '60px' }}>#</th>
                        {finalVisibleColumns.map((column: any, index: number) => (
                          <th 
                            key={column.id} 
                            draggable
                            onDragStart={() => handleColumnDragStart(column.id)}
                            onDragOver={(e) => handleColumnDragOver(e, column.id)}
                            onDrop={(e) => handleColumnDrop(e, column.id)}
                            onDragEnd={handleColumnDragEnd}
                            className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-gray-800 group border-r-2 border-gray-300 dark:border-gray-600 cursor-move ${
                              index === 0 ? 'sticky left-[60px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                            } ${
                              draggedColumn === column.id ? 'opacity-50' : ''
                            } ${
                              dragOverColumn === column.id && draggedColumn !== column.id ? 'border-l-4 border-l-blue-500' : ''
                            }`} 
                            style={{ minWidth: '250px' }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
                                {getColumnLetter(index)}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="uppercase">{column.name}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteColumn(column.id)
                                  }}
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
                            <td className={`px-2 ${cellPaddingClass} text-center text-sm text-gray-500 dark:text-gray-400 font-medium sticky left-0 z-10 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-gray-300 dark:border-gray-600`} style={{ width: '80px', minWidth: '80px' }}>
                              <div className="flex items-center justify-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setSelectedRow(row)} 
                                  className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                  title="View full record"
                                >
                                  <Maximize2 className="h-3 w-3" />
                                </Button>
                                <span>{(currentPage - 1) * rowsPerPage + index + 1}</span>
                              </div>
                            </td>
                            {finalVisibleColumns.map((column: any, colIndex: number) => {
                              const cellColor = row._cellColors?.[column.id] || cellColors[`${row.id}-${column.id}`]
                              const isCopied = copiedCell?.rowId === row.id && copiedCell?.columnId === column.id
                              
                              return (
                                <td 
                                  key={column.id} 
                                  className={`px-4 ${cellPaddingClass} border-r-2 border-b-2 border-gray-300 dark:border-gray-600 ${
                                    colIndex === 0 ? 'sticky left-[60px] z-10 bg-white dark:bg-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                                  } ${isCopied ? 'ring-2 ring-blue-500 ring-inset' : ''}`} 
                                  style={{ 
                                    minWidth: '250px',
                                    ...(cellColor && { backgroundColor: cellColor })
                                  }}
                                >
                                  <Input
                                    type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                                    value={row[column.id] || ''}
                                    onChange={(e) => handleUpdateCell(row.id, column.id, e.target.value)}
                                    onKeyDown={(e: any) => handleKeyDown(e, row.id, column.id, row[column.id])}
                                    className={`border-0 focus:ring-1 focus:ring-primary bg-transparent w-full px-2 ${inputHeightClass} text-sm`}
                                    style={{ backgroundColor: 'transparent' }}
                                  />
                                </td>
                              )
                            })}
                            <td className="px-4 py-3 text-center border-r-2 border-b-2 border-gray-300 dark:border-gray-600" style={{ width: '100px', minWidth: '100px' }}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteRow(row.id)} 
                                className="text-gray-400 hover:text-red-600"
                              >
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
            
            {/* Pagination and totals bar - BELOW scrollbar */}
            <div className="w-full bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'} total
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }} 
                    className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                    title="Rows per page"
                  >
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={200}>200 per page</option>
                    <option value={500}>500 per page</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Dialogs */}
      <ImportDataDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        datasetId={datasetId}
        sheetId={currentSheet?.id || ''}
        onImportComplete={async () => {
          const { data: viewsData } = await (supabase as any).from('views').select('*').eq('table_id', datasetId)
          if (viewsData) setSupabaseViews(viewsData)
          setImportDialogOpen(false)
        }}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        datasetName={currentDataset?.name || ''}
        datasetId={datasetId}
      />

      {/* Full-Screen Record View Modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold">Record Details</h2>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden min-h-0">
              <div className="grid grid-cols-2 h-full">
                {/* Left: Record Data */}
                <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
                  <h3 className="text-lg font-semibold p-6 pb-4 flex-shrink-0">Record Data</h3>
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-4">
                      {visibleColumns.map((column: any) => (
                        <div key={column.id}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {column.name}
                          </label>
                          <Input
                            type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                            value={selectedRow[column.id] || ''}
                            onChange={(e) => {
                              const updatedRow = { ...selectedRow, [column.id]: e.target.value }
                              setSelectedRow(updatedRow)
                              handleUpdateCell(selectedRow.id, column.id, e.target.value)
                            }}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Comments or History */}
                <div className="flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-6 flex-shrink-0">
                    <button
                      onClick={() => setRecordViewTab('comments')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        recordViewTab === 'comments'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 inline mr-2" />
                      Comments
                    </button>
                    <button
                      onClick={() => setRecordViewTab('history')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        recordViewTab === 'history'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <History className="h-4 w-4 inline mr-2" />
                      Revision History
                    </button>
                  </div>

                  {recordViewTab === 'comments' ? (
                    <div className="flex flex-col flex-1 min-h-0">
                      
                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
                        {comments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Start commenting!</p>
                          </div>
                        ) : (
                          comments.map((comment, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                    {comment.author?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{comment.author || 'User'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="border-t border-gray-200 dark:border-gray-700 p-6 pt-4 flex-shrink-0">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newComment.trim()) {
                                setComments([...comments, {
                                  author: 'Current User',
                                  text: newComment,
                                  created_at: new Date().toISOString()
                                }])
                                setNewComment('')
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              if (newComment.trim()) {
                                setComments([...comments, {
                                  author: 'Current User',
                                  text: newComment,
                                  created_at: new Date().toISOString()
                                }])
                                setNewComment('')
                              }
                            }}
                            disabled={!newComment.trim()}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-0">
                      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
                        <div className="space-y-4">
                        {/* Sample revision history */}
                        <div className="border-l-2 border-blue-500 pl-4 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500 -ml-[25px]"></div>
                            <p className="text-sm font-medium">Record created</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleString()} by Current User
                          </p>
                        </div>
                        
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                          <History className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <p>No revision history yet</p>
                        </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
