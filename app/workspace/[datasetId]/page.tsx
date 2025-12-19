'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTableStore } from '@/store/useTableStore'
import { useViewStore } from '@/store/useViewStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  Undo,
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
  Check,
  Palette,
  Calendar,
  Edit,
  Copy,
  Eye,
  EyeOff
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
  const [selectedCells, setSelectedCells] = useState<string[]>([])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [manualCellColorDialog, setManualCellColorDialog] = useState(false)
  const [manualCellColorColumnId, setManualCellColorColumnId] = useState('placeholder')
  const [manualCellColorOperator, setManualCellColorOperator] = useState('is')
  const [manualCellColorValue, setManualCellColorValue] = useState('')
  const [manualCellColorColor, setManualCellColorColor] = useState('#10b981')
  const [manualCellColorRules, setManualCellColorRules] = useState<Array<{
    id: string
    columnId: string
    operator: string
    value: string
    color: string
    enabled: boolean
  }>>([])
  const [cellColorRulesSaving, setCellColorRulesSaving] = useState(false)
  const [cellColorRulesSaved, setCellColorRulesSaved] = useState(false)
  const [columnHighlights, setColumnHighlights] = useState<Record<string, string>>({})
  const [highlightColumnDialog, setHighlightColumnDialog] = useState(false)
  const [highlightColumnId, setHighlightColumnId] = useState<string | null>(null)
  const [highlightColor, setHighlightColor] = useState('#fef08a')
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const [dateRangeFilter, setDateRangeFilter] = useState<{ columnId: string; startDate: string; endDate: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [newlyAddedRowId, setNewlyAddedRowId] = useState<string | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  const [undoStack, setUndoStack] = useState<Array<{
    type: 'cell_edit' | 'row_add' | 'row_delete' | 'column_add' | 'column_delete'
    data: any
  }>>([])
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [deleteColumnDialogOpen, setDeleteColumnDialogOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<{id: string, name: string} | null>(null)
  const [addRowDialogOpen, setAddRowDialogOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null)

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<Record<string, NodeJS.Timeout>>({})
  
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
        
        // Dataset fetch logging removed
        
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

  // Load cell color rules when sheet changes
  useEffect(() => {
    if (currentSheet?.cell_color_rules && currentSheet.cell_color_rules.length > 0) {
      setManualCellColorRules(currentSheet.cell_color_rules)
    } else {
      setManualCellColorRules([])
      setCellColors({})
    }
    
    // Load column highlights
    if (currentSheet?.column_highlights) {
      setColumnHighlights(currentSheet.column_highlights)
    } else {
      setColumnHighlights({})
    }
  }, [currentSheet?.id])

  // Reapply cell color rules when rules or sheet rows change
  useEffect(() => {
    if (!currentSheet || manualCellColorRules.length === 0) {
      setCellColors({})
      return
    }
    
    // Debounce to reduce lag
    const timeoutId = setTimeout(() => {
      const rows = currentSheet.type === 'chart' 
        ? (datasetSheets.find(s => s.type === 'grid')?.rows || currentDataset?.rows || [])
        : (currentSheet.rows || currentDataset?.rows || [])
      
      if (!rows || rows.length === 0) return
      
      const newColors: { [key: string]: string } = {}
      const enabledRules = manualCellColorRules.filter(rule => rule.enabled)
      
      // Only process if we have enabled rules
      if (enabledRules.length === 0) {
        setCellColors({})
        return
      }
      
      enabledRules.forEach(rule => {
        const targetLower = rule.value.toLowerCase()
        const targetNum = parseFloat(rule.value)
        
        rows.forEach((row: any) => {
          const cellValue = String(row[rule.columnId] || '')
          const cellLower = cellValue.toLowerCase()
          const cellNum = parseFloat(cellValue)
          let matches = false
          
          switch (rule.operator) {
            case 'is':
              matches = cellLower === targetLower
              break
            case 'is not':
              matches = cellLower !== targetLower
              break
            case 'contains':
              matches = cellLower.includes(targetLower)
              break
            case 'does not contain':
              matches = !cellLower.includes(targetLower)
              break
            case 'starts with':
              matches = cellLower.startsWith(targetLower)
              break
            case 'ends with':
              matches = cellLower.endsWith(targetLower)
              break
            case 'greater than':
              matches = !isNaN(cellNum) && !isNaN(targetNum) && cellNum > targetNum
              break
            case 'less than':
              matches = !isNaN(cellNum) && !isNaN(targetNum) && cellNum < targetNum
              break
            case 'greater than or equal':
              matches = !isNaN(cellNum) && !isNaN(targetNum) && cellNum >= targetNum
              break
            case 'less than or equal':
              matches = !isNaN(cellNum) && !isNaN(targetNum) && cellNum <= targetNum
              break
          }
          
          if (matches) {
            const cellKey = `${row.id}-${rule.columnId}`
            newColors[cellKey] = rule.color
          }
        })
      })
      
      setCellColors(newColors)
    }, 150)
    
    return () => clearTimeout(timeoutId)
  }, [manualCellColorRules, currentSheet?.id, currentSheet?.rows, currentSheet?.type])

  // Realtime sync for shared spreadsheets
  useEffect(() => {
    if (!datasetId) return

    // Subscribe to changes on the tables table (dataset rows)
    const channel = supabase
      .channel(`table-${datasetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${datasetId}`
        },
        async (payload) => {
          console.log('Realtime update received:', payload)
          // Refetch data when changes occur
          const { data: tableData } = await (supabase as any).from('tables').select('*').eq('id', datasetId).single()
          if (tableData) {
            setSupabaseDataset(tableData)
          }
        }
      )
      .subscribe()

    // Subscribe to view changes
    const viewChannel = supabase
      .channel(`views-${datasetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'views',
          filter: `table_id=eq.${datasetId}`
        },
        async (payload) => {
          console.log('View update received:', payload)
          // Don't refetch if user is actively editing - prevents overwriting current input
          if (editingCell) {
            console.log('Skipping sync - user is editing')
            return
          }
          // Refetch views when changes occur
          const { data: viewsData } = await (supabase as any).from('views').select('*').eq('table_id', datasetId)
          if (viewsData) {
            setSupabaseViews(viewsData)
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(viewChannel)
    }
  }, [datasetId])

  // Global keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoStack])

  // Cleanup pending save timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimerRef.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

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
    
    let rafId: number | null = null
    
    const handleTopScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        tableContainer.scrollLeft = topScroll.scrollLeft
        rafId = null
      })
    }
    
    const handleTableScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        topScroll.scrollLeft = tableContainer.scrollLeft
        rafId = null
      })
    }
    
    topScroll.addEventListener('scroll', handleTopScroll, { passive: true })
    tableContainer.addEventListener('scroll', handleTableScroll, { passive: true })
    window.addEventListener('resize', updateScrollbarWidth, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      topScroll.removeEventListener('scroll', handleTopScroll)
      tableContainer.removeEventListener('scroll', handleTableScroll)
      window.removeEventListener('resize', updateScrollbarWidth)
    }
  })


  if (loading || !mounted) {
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

  const handleUndo = async () => {
    if (undoStack.length === 0) return
    
    const lastAction = undoStack[undoStack.length - 1]
    
    try {
      if (lastAction.type === 'cell_edit') {
        const { rowId, columnId, oldValue, sheetId } = lastAction.data
        const sheet = supabaseViews.find(v => v.id === sheetId)
        if (!sheet) return
        
        const updatedRows = (sheet.rows || []).map((r: any) => 
          r.id === rowId ? { ...r, [columnId]: oldValue } : r
        )
        await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', sheetId)
        updateSupabaseView(sheetId, { rows: updatedRows })
      } else if (lastAction.type === 'row_add') {
        const { rowId, sheetId } = lastAction.data
        const sheet = supabaseViews.find(v => v.id === sheetId)
        if (!sheet) return
        
        const updatedRows = (sheet.rows || []).filter((r: any) => r.id !== rowId)
        await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', sheetId)
        updateSupabaseView(sheetId, { rows: updatedRows })
      } else if (lastAction.type === 'row_delete') {
        const { row, index, sheetId } = lastAction.data
        const sheet = supabaseViews.find(v => v.id === sheetId)
        if (!sheet) return
        
        const updatedRows = [...(sheet.rows || [])]
        updatedRows.splice(index, 0, row)
        await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', sheetId)
        updateSupabaseView(sheetId, { rows: updatedRows })
      } else if (lastAction.type === 'column_add') {
        const { columnId, oldColumns, datasetId } = lastAction.data
        
        // Restore old columns
        await (supabase as any).from('tables').update({ 
          columns: oldColumns
        }).eq('id', datasetId)
        
        // Update local dataset state
        if (currentDataset) {
          setSupabaseDataset({ ...currentDataset, columns: oldColumns })
        }
        
        // Update all views to remove the column from visible_columns
        const viewUpdates = supabaseViews.map(async (view) => {
          const updatedVisibleColumns = (view.visible_columns || []).filter((id: string) => id !== columnId)
          await (supabase as any).from('views').update({
            visible_columns: updatedVisibleColumns
          }).eq('id', view.id)
          return { ...view, visible_columns: updatedVisibleColumns }
        })
        
        const updatedViews = await Promise.all(viewUpdates)
        setSupabaseViews(updatedViews)
      }
      
      // Remove the action from undo stack
      setUndoStack(prev => prev.slice(0, -1))
    } catch (error) {
      console.error('Error undoing action:', error)
    }
  }

  const handleAddRow = async () => {
    if (!currentDataset || !currentSheet) return
    const newRow: any = { id: crypto.randomUUID() }
    currentDataset.columns.forEach((col: any) => { newRow[col.id] = '' })
    const updatedRows = [...(currentSheet.rows || []), newRow]
    try {
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      updateSupabaseView(currentSheet.id, { rows: updatedRows })
      
      // Add to undo stack
      setUndoStack(prev => [...prev, {
        type: 'row_add',
        data: { rowId: newRow.id, sheetId: currentSheet.id }
      }])
      
      // Navigate to the last page where the new row is located
      const totalRows = updatedRows.length
      const lastPage = Math.ceil(totalRows / rowsPerPage)
      setCurrentPage(lastPage)
      
      // Scroll to the new row and focus first cell
      setTimeout(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight
        }
        // Focus the first cell of the new row
        const firstColumnId = currentDataset.columns[0]?.id
        if (firstColumnId) {
          const cellInput = document.querySelector(`input[data-row-id="${newRow.id}"][data-column-id="${firstColumnId}"]`) as HTMLInputElement
          if (cellInput) {
            cellInput.focus()
            cellInput.select()
          }
        }
      }, 100)
    } catch (error) {
      console.error('Error adding row:', error)
    }
  }

  const handleAddColumn = async () => {
    if (!currentDataset || !newColumnName.trim()) return
    
    const columnName = newColumnName.trim()
    
    const newColumn = {
      id: crypto.randomUUID(),
      name: columnName,
      type: 'text'
    }
    
    const updatedColumns = [...currentDataset.columns, newColumn]
    
    // Store old columns for undo
    const oldColumns = currentDataset.columns
    
    try {
      // Update the table - ONLY update columns, preserve rows
      const { data: updateData, error: updateError } = await (supabase as any).from('tables').update({ 
        columns: updatedColumns
      }).eq('id', datasetId).select()
      
      if (updateError) {
        console.error('Error updating columns:', updateError)
        throw updateError
      }
      
      console.log('Column added successfully:', updateData)
      
      // Update local dataset state - preserve all existing data
      setSupabaseDataset((prev: any) => ({ ...prev, columns: updatedColumns }))
      
      // Update all views to include the new column in visible_columns
      const viewUpdates = supabaseViews.map(async (view) => {
        const updatedVisibleColumns = [...(view.visible_columns || []), newColumn.id]
        await (supabase as any).from('views').update({
          visible_columns: updatedVisibleColumns
        }).eq('id', view.id)
        return { ...view, visible_columns: updatedVisibleColumns }
      })
      
      const updatedViews = await Promise.all(viewUpdates)
      setSupabaseViews(updatedViews)
      
      // Add to undo stack
      setUndoStack(prev => [...prev, {
        type: 'column_add',
        data: { columnId: newColumn.id, oldColumns, datasetId }
      }])
      
      // Close dialog and reset state
      setAddColumnDialogOpen(false)
      setNewColumnName('')
      
      // Scroll to the new column and focus first cell
      setTimeout(() => {
        if (tableContainerRef.current) {
          // Scroll all the way to the right to show the new column
          tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth
        }
        
        // Focus the first cell of the new column
        const firstRow = (currentSheet?.rows || [])[0]
        if (firstRow) {
          const cellInput = document.querySelector(`input[data-row-id="${firstRow.id}"][data-column-id="${newColumn.id}"]`) as HTMLInputElement
          if (cellInput) {
            cellInput.focus()
            cellInput.select()
          }
        }
      }, 200)
    } catch (error) {
      console.error('Error adding column:', error)
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
    
    // Store row data and index for undo
    const rowIndex = (currentSheet.rows || []).findIndex((r: any) => r.id === rowId)
    const deletedRow = (currentSheet.rows || []).find((r: any) => r.id === rowId)
    
    const updatedRows = (currentSheet.rows || []).filter((r: any) => r.id !== rowId)
    try {
      await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
      setSupabaseViews(supabaseViews.map(v => v.id === currentSheet.id ? { ...v, rows: updatedRows } : v))
      
      // Add to undo stack
      if (deletedRow) {
        setUndoStack(prev => [...prev, {
          type: 'row_delete',
          data: { row: deletedRow, index: rowIndex, sheetId: currentSheet.id }
        }])
      }
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const openDeleteColumnDialog = (columnId: string, columnName: string) => {
    setColumnToDelete({ id: columnId, name: columnName })
    setDeleteColumnDialogOpen(true)
  }

  const handleDeleteColumn = async () => {
    if (!currentDataset || !columnToDelete) return
    
    const columnId = columnToDelete.id
    
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
      
      // Close dialog
      setDeleteColumnDialogOpen(false)
      setColumnToDelete(null)
      
      // Refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting column:', error)
    }
  }

  const handleUpdateCell = async (rowId: string, columnId: string, value: any) => {
    if (!currentSheet) return
    
    // Store old value for undo
    const oldRow = (currentSheet.rows || []).find((r: any) => r.id === rowId)
    const oldValue = oldRow?.[columnId]
    
    const updatedRows = (currentSheet.rows || []).map((r: any) => r.id === rowId ? { ...r, [columnId]: value } : r)
    
    // Update UI immediately for responsive typing
    updateSupabaseView(currentSheet.id, { rows: updatedRows })
    
    // Debounce database write - only save after user stops typing for 500ms
    const cellKey = `${currentSheet.id}-${rowId}-${columnId}`
    
    // Clear existing timer for this cell
    if (saveTimerRef.current[cellKey]) {
      clearTimeout(saveTimerRef.current[cellKey])
    }
    
    // Set new timer to save after 500ms of no typing
    saveTimerRef.current[cellKey] = setTimeout(async () => {
      try {
        await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
        
        // Add to undo stack only after successful save
        setUndoStack(prev => [...prev, {
          type: 'cell_edit',
          data: { rowId, columnId, oldValue, newValue: value, sheetId: currentSheet.id }
        }])
        
        // Clean up timer
        delete saveTimerRef.current[cellKey]
      } catch (error) {
        console.error('Error updating cell:', error)
      }
    }, 500)
  }

  const handleCopyCell = (rowId: string, columnId: string, value: any) => {
    const cellKey = `${rowId}-${columnId}`
    const color = cellColors[cellKey]
    setCopiedCell({ rowId, columnId, value, color })
    
    // Also copy to system clipboard
    navigator.clipboard.writeText(value || '')
  }

  const handlePasteCell = async (targetRowId: string, targetColumnId: string) => {
    if (!copiedCell || !currentSheet || !currentDataset) return
    
    // Update cell value
    await handleUpdateCell(targetRowId, targetColumnId, copiedCell.value)
    
    // Copy cell color if exists
    if (copiedCell.color) {
      const targetCellKey = `${targetRowId}-${targetColumnId}`
      setCellColors(prev => ({ ...prev, [targetCellKey]: copiedCell.color! }))
    }
    
    // Check if we're pasting to the last row
    const currentRows = currentSheet.rows || []
    const targetRowIndex = currentRows.findIndex((r: any) => r.id === targetRowId)
    const isLastRow = targetRowIndex === currentRows.length - 1
    
    if (isLastRow) {
      // Add a blank row
      const newRowId = crypto.randomUUID()
      const newRow: any = { id: newRowId }
      currentDataset.columns.forEach((col: any) => { newRow[col.id] = '' })
      const updatedRows = [...currentRows, newRow]
      
      try {
        await (supabase as any).from('views').update({ rows: updatedRows }).eq('id', currentSheet.id)
        updateSupabaseView(currentSheet.id, { rows: updatedRows })
        
        // Highlight the newly added row
        setNewlyAddedRowId(newRowId)
        
        // Scroll to the last row after a short delay to allow DOM update
        setTimeout(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight
          }
          
          // Remove highlight after 2 seconds
          setTimeout(() => {
            setNewlyAddedRowId(null)
          }, 2000)
        }, 100)
      } catch (error) {
        console.error('Error adding blank row:', error)
      }
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

  const handleOpenManualCellColorDialog = () => {
    setManualCellColorColumnId('placeholder')
    setManualCellColorOperator('is')
    setManualCellColorValue('')
    setManualCellColorColor('#10b981')
    setManualCellColorDialog(true)
  }

  const handleApplyManualCellColor = async () => {
    if (manualCellColorColumnId === 'placeholder' || !manualCellColorValue.trim()) return
    
    // Create new rule
    const newRule = {
      id: crypto.randomUUID(),
      columnId: manualCellColorColumnId,
      operator: manualCellColorOperator,
      value: manualCellColorValue,
      color: manualCellColorColor,
      enabled: true
    }
    
    // Add rule to list
    const updatedRules = [...manualCellColorRules, newRule]
    setManualCellColorRules(updatedRules)
    
    // Save rules to current sheet
    setCellColorRulesSaving(true)
    if (currentSheet) {
      await (supabase as any)
        .from('views')
        .update({ cell_color_rules: updatedRules })
        .eq('id', currentSheet.id)
      
      // Update the local sheet data to include the new rules
      setSupabaseViews(supabaseViews.map(v => 
        v.id === currentSheet.id ? { ...v, cell_color_rules: updatedRules } : v
      ))
    }
    setCellColorRulesSaving(false)
    setCellColorRulesSaved(true)
    setTimeout(() => setCellColorRulesSaved(false), 2000)
    
    // Get rows based on sheet type
    const rows = currentSheet?.type === 'chart' 
      ? (datasetSheets.find(s => s.type === 'grid')?.rows || currentDataset?.rows || [])
      : (currentSheet?.rows || currentDataset?.rows || [])
    
    // Apply color to all cells in the column that match based on operator
    const matchingRows = rows.filter((row: any) => {
      const cellValue = String(row[manualCellColorColumnId] || '')
      const targetValue = manualCellColorValue
      
      switch (manualCellColorOperator) {
        case 'is':
          return cellValue.toLowerCase() === targetValue.toLowerCase()
        case 'is not':
          return cellValue.toLowerCase() !== targetValue.toLowerCase()
        case 'contains':
          return cellValue.toLowerCase().includes(targetValue.toLowerCase())
        case 'does not contain':
          return !cellValue.toLowerCase().includes(targetValue.toLowerCase())
        case 'starts with':
          return cellValue.toLowerCase().startsWith(targetValue.toLowerCase())
        case 'ends with':
          return cellValue.toLowerCase().endsWith(targetValue.toLowerCase())
        case 'greater than':
          return parseFloat(cellValue) > parseFloat(targetValue)
        case 'less than':
          return parseFloat(cellValue) < parseFloat(targetValue)
        case 'greater than or equal':
          return parseFloat(cellValue) >= parseFloat(targetValue)
        case 'less than or equal':
          return parseFloat(cellValue) <= parseFloat(targetValue)
        default:
          return cellValue.toLowerCase() === targetValue.toLowerCase()
      }
    })
    
    setCellColors(prev => {
      const newColors = { ...prev }
      matchingRows.forEach((row: any) => {
        const cellKey = `${row.id}-${manualCellColorColumnId}`
        newColors[cellKey] = manualCellColorColor
      })
      return newColors
    })
    
    setManualCellColorDialog(false)
    setManualCellColorColumnId('placeholder')
    setManualCellColorOperator('is')
    setManualCellColorValue('')
  }

  const handleRemoveCellColorRule = async (ruleId: string) => {
    const rule = manualCellColorRules.find(r => r.id === ruleId)
    if (!rule) return
    
    // Remove colors applied by this rule
    setCellColors(prev => {
      const newColors = { ...prev }
      baseRows.forEach((row: any) => {
        const cellValue = String(row[rule.columnId] || '')
        const targetValue = rule.value
        let matches = false
        
        switch (rule.operator) {
          case 'is':
            matches = cellValue.toLowerCase() === targetValue.toLowerCase()
            break
          case 'is not':
            matches = cellValue.toLowerCase() !== targetValue.toLowerCase()
            break
          case 'contains':
            matches = cellValue.toLowerCase().includes(targetValue.toLowerCase())
            break
          case 'does not contain':
            matches = !cellValue.toLowerCase().includes(targetValue.toLowerCase())
            break
          case 'starts with':
            matches = cellValue.toLowerCase().startsWith(targetValue.toLowerCase())
            break
          case 'ends with':
            matches = cellValue.toLowerCase().endsWith(targetValue.toLowerCase())
            break
          case 'greater than':
            matches = parseFloat(cellValue) > parseFloat(targetValue)
            break
          case 'less than':
            matches = parseFloat(cellValue) < parseFloat(targetValue)
            break
          case 'greater than or equal':
            matches = parseFloat(cellValue) >= parseFloat(targetValue)
            break
          case 'less than or equal':
            matches = parseFloat(cellValue) <= parseFloat(targetValue)
            break
        }
        
        if (matches) {
          const cellKey = `${row.id}-${rule.columnId}`
          delete newColors[cellKey]
        }
      })
      return newColors
    })
    
    // Remove rule from list
    const updatedRules = manualCellColorRules.filter(r => r.id !== ruleId)
    setManualCellColorRules(updatedRules)
    
    // Save to database
    setCellColorRulesSaving(true)
    if (currentSheet) {
      await (supabase as any)
        .from('views')
        .update({ cell_color_rules: updatedRules })
        .eq('id', currentSheet.id)
    }
    setCellColorRulesSaving(false)
    setCellColorRulesSaved(true)
    setTimeout(() => setCellColorRulesSaved(false), 2000)
  }

  const handleToggleCellColorRule = async (ruleId: string) => {
    const updatedRules = manualCellColorRules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    setManualCellColorRules(updatedRules)
    
    // Save to database
    setCellColorRulesSaving(true)
    if (currentSheet) {
      await (supabase as any)
        .from('views')
        .update({ cell_color_rules: updatedRules })
        .eq('id', currentSheet.id)
    }
    setCellColorRulesSaving(false)
    setCellColorRulesSaved(true)
    setTimeout(() => setCellColorRulesSaved(false), 2000)
    
    // Reapply all enabled rules
    applyAllCellColorRules(updatedRules)
  }

  const applyAllCellColorRules = (rules: typeof manualCellColorRules) => {
    const newColors: { [key: string]: string } = {}
    
    rules.filter(rule => rule.enabled).forEach(rule => {
      baseRows.forEach((row: any) => {
        const cellValue = String(row[rule.columnId] || '')
        const targetValue = rule.value
        let matches = false
        
        switch (rule.operator) {
          case 'is':
            matches = cellValue.toLowerCase() === targetValue.toLowerCase()
            break
          case 'is not':
            matches = cellValue.toLowerCase() !== targetValue.toLowerCase()
            break
          case 'contains':
            matches = cellValue.toLowerCase().includes(targetValue.toLowerCase())
            break
          case 'does not contain':
            matches = !cellValue.toLowerCase().includes(targetValue.toLowerCase())
            break
          case 'starts with':
            matches = cellValue.toLowerCase().startsWith(targetValue.toLowerCase())
            break
          case 'ends with':
            matches = cellValue.toLowerCase().endsWith(targetValue.toLowerCase())
            break
          case 'greater than':
            matches = parseFloat(cellValue) > parseFloat(targetValue)
            break
          case 'less than':
            matches = parseFloat(cellValue) < parseFloat(targetValue)
            break
          case 'greater than or equal':
            matches = parseFloat(cellValue) >= parseFloat(targetValue)
            break
          case 'less than or equal':
            matches = parseFloat(cellValue) <= parseFloat(targetValue)
            break
        }
        
        if (matches) {
          const cellKey = `${row.id}-${rule.columnId}`
          newColors[cellKey] = rule.color
        }
      })
    })
    
    setCellColors(newColors)
  }

  const handleOpenHighlightColumnDialog = (columnId: string) => {
    setHighlightColumnId(columnId)
    setHighlightColor(columnHighlights[columnId] || '#fef08a')
    setHighlightColumnDialog(true)
  }

  const handleApplyColumnHighlight = async () => {
    if (!highlightColumnId) return
    
    const updatedHighlights = { ...columnHighlights, [highlightColumnId]: highlightColor }
    setColumnHighlights(updatedHighlights)
    
    // Save to database
    if (currentSheet) {
      await (supabase as any)
        .from('views')
        .update({ column_highlights: updatedHighlights })
        .eq('id', currentSheet.id)
    }
    
    setHighlightColumnDialog(false)
  }

  const handleRemoveColumnHighlight = async (columnId: string) => {
    const updatedHighlights = { ...columnHighlights }
    delete updatedHighlights[columnId]
    setColumnHighlights(updatedHighlights)
    
    // Save to database
    if (currentSheet) {
      await (supabase as any)
        .from('views')
        .update({ column_highlights: updatedHighlights })
        .eq('id', currentSheet.id)
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

  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[columnId] || 180)
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(100, resizeStartWidth + diff)
    setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }))
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (!resizingColumn) return

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

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

  // Map visible columns in the order specified by activeVisibleColumns, not dataset order
  const visibleColumns = activeVisibleColumns
    .map((colId: string) => currentDataset.columns.find((col: any) => col.id === colId))
    .filter((col: any) => col !== undefined)
  
  // Debug logging removed to prevent render loop
  
  // Fallback: If no columns are visible, show all columns
  let finalVisibleColumns = visibleColumns.length > 0 ? visibleColumns : currentDataset.columns
  
  // Filter columns by header name when global search is active
  if (globalSearch.trim()) {
    const searchLower = globalSearch.toLowerCase()
    finalVisibleColumns = finalVisibleColumns.filter((col: any) => 
      col.name.toLowerCase().includes(searchLower)
    )
  }
  
  // Final visible columns computed

  const baseRows = (() => {
    if (currentSheet?.type === 'chart') {
      const firstGridView = datasetSheets.find(s => s.type === 'grid')
      return firstGridView?.rows || currentDataset.rows || []
    }
    return currentSheet?.rows || currentDataset.rows || []
  })()

  const getFilteredRows = () => {
    let rows = [...baseRows]
    // Global search is now handled by filtering visible columns, not row data
    // See visibleColumns computation below
    
    // Active filters applied
    
    for (const filter of activeFilters) {
      const beforeCount = rows.length
      rows = rows.filter((row: any) => {
        const rawValue = row[filter.columnId] || ''
        const cellValue = String(rawValue).toLowerCase()
        const filterValue = String(filter.value).toLowerCase()
        
        switch (filter.operator) {
          case 'is':
          case 'equals': 
            return cellValue === filterValue
          case 'is not':
          case 'is_not':
            return cellValue !== filterValue
          case 'contains': 
            return cellValue.includes(filterValue)
          case 'does not contain':
          case 'does_not_contain':
            return !cellValue.includes(filterValue)
          case 'starts with':
          case 'startsWith': 
            return cellValue.startsWith(filterValue)
          case 'ends with':
          case 'endsWith': 
            return cellValue.endsWith(filterValue)
          case 'greater than':
          case 'greater_than': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter
          }
          case 'less than':
          case 'less_than': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue < numFilter
          }
          case 'greater than or equal':
          case 'greater_than_or_equal': {
            const numValue = parseFloat(rawValue)
            const numFilter = parseFloat(filter.value)
            return !isNaN(numValue) && !isNaN(numFilter) && numValue >= numFilter
          }
          case 'less than or equal':
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
    
    // Apply date range filter
    if (dateRangeFilter) {
      rows = rows.filter((row: any) => {
        const dateValue = row[dateRangeFilter.columnId]
        if (!dateValue) return false
        
        const rowDate = new Date(dateValue)
        const startDate = new Date(dateRangeFilter.startDate)
        const endDate = new Date(dateRangeFilter.endDate)
        
        return rowDate >= startDate && rowDate <= endDate
      })
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden" suppressHydrationWarning>
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar 
          isExpanded={!sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          datasetName={currentDataset.name}
          onAddSheet={handleAddSheet}
          onShare={() => setShareDialogOpen(true)}
          sheets={datasetSheets}
          activeSheetId={activeSheetId || undefined}
          onSheetSelect={setActiveSheetId}
          onSheetRename={handleRenameSheet}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-14" style={{ maxWidth: '100%' }} suppressHydrationWarning>
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
                  <DropdownMenuContent align="start" className="w-[220px]">
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
                    {currentSheet && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            const name = window.prompt('Rename sheet', currentSheet.name)
                            if (name && name !== currentSheet.name) {
                              handleRenameSheet(currentSheet.id, name)
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Rename Sheet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateSheet(currentSheet.id)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Sheet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSheet(currentSheet.id)
                          }}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Sheet
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  title={`Undo last action (Ctrl+Z) - ${undoStack.length} action(s) available`}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenManualCellColorDialog} title="Set color for cells matching a value">
                  <Palette className="h-4 w-4 mr-1" />
                  Set Cell Color
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
                    <DropdownMenuItem onClick={() => setAddRowDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Single Row
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePasteFromClipboard}>
                      <ClipboardPaste className="h-4 w-4 mr-2" />
                      Paste from Clipboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="outline" onClick={() => setAddColumnDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
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
              dateRangeFilter={dateRangeFilter}
              onDateRangeFilterChange={setDateRangeFilter}
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
                <table className="border border-gray-300 dark:border-gray-600" style={{ minWidth: 'max-content', borderCollapse: 'collapse', width: 'auto' }}>
                    <thead className="bg-white dark:bg-gray-800">
                      <tr className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm">
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky left-0 z-30 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>#</th>
                        {finalVisibleColumns.map((column: any, index: number) => (
                          <th 
                            key={column.id} 
                            draggable
                            onDragStart={() => handleColumnDragStart(column.id)}
                            onDragOver={(e) => handleColumnDragOver(e, column.id)}
                            onDrop={(e) => handleColumnDrop(e, column.id)}
                            onDragEnd={handleColumnDragEnd}
                            className={`px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap group border border-gray-300 dark:border-gray-600 cursor-move ${
                              index === 0 ? 'sticky left-[60px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-white dark:bg-gray-800' : ''
                            } ${
                              draggedColumn === column.id ? 'opacity-50' : ''
                            } ${
                              dragOverColumn === column.id && draggedColumn !== column.id ? 'border-l-4 border-l-blue-500' : ''
                            }`} 
                            style={{ 
                              minWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : '180px',
                              width: columnWidths[column.id] ? `${columnWidths[column.id]}px` : '180px',
                              backgroundColor: index === 0 ? '' : (columnHighlights[column.id] || ''),
                              position: 'relative'
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0">
                                {getColumnLetter(index)}
                              </span>
                              <span className="uppercase text-xs truncate flex-1 min-w-0">{column.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenHighlightColumnDialog(column.id)
                                  }}
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-600"
                                  title="Highlight column"
                                >
                                  <Palette className="h-3 w-3" />
                                </Button>
                                {columnHighlights[column.id] && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveColumnHighlight(column.id)
                                    }}
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                    title="Remove highlight"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDeleteColumnDialog(column.id, column.name)
                                  }}
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                  title="Delete column"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Resize handle */}
                            <div
                              onMouseDown={(e) => handleResizeStart(e, column.id)}
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all"
                              style={{ zIndex: 40 }}
                              title="Drag to resize column"
                            />
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" style={{ width: '100px', minWidth: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(displayRowsWithColor).flatMap(([group, { rows }]) =>
                        rows.map((row: any, index: number) => {
                          const isNewlyAdded = row.id === newlyAddedRowId
                          return (
                          <tr 
                            key={row.id} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-500 ${rowPaddingClass} ${
                              isNewlyAdded ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500 ring-inset' : ''
                            }`} 
                            style={{ backgroundColor: isNewlyAdded ? undefined : row.rowColor }}
                          >
                            <td className={`px-2 ${cellPaddingClass} text-center text-sm text-gray-500 dark:text-gray-400 font-medium sticky left-0 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
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
                                  className={`px-4 ${cellPaddingClass} border border-gray-300 dark:border-gray-600 ${
                                    colIndex === 0 ? 'sticky left-[60px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-white dark:bg-gray-800' : ''
                                  } ${isCopied ? 'ring-2 ring-blue-500 ring-inset' : ''}`} 
                                  style={{ 
                                    minWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : '180px',
                                    width: columnWidths[column.id] ? `${columnWidths[column.id]}px` : '180px',
                                    backgroundColor: cellColor || (colIndex === 0 ? '' : columnHighlights[column.id] || '')
                                  }}
                                >
                                  <Input
                                    type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                                    value={String(row[column.id] ?? '')}
                                    onChange={(e) => handleUpdateCell(row.id, column.id, e.target.value)}
                                    onFocus={() => setEditingCell({ rowId: row.id, columnId: column.id })}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyDown={(e: any) => handleKeyDown(e, row.id, column.id, row[column.id])}
                                    className={`border-0 focus:ring-1 focus:ring-primary bg-transparent w-full px-2 ${inputHeightClass} text-sm`}
                                    style={{ backgroundColor: 'transparent' }}
                                    data-row-id={row.id}
                                    data-column-id={column.id}
                                  />
                                </td>
                              )
                            })}
                            <td className="px-4 py-3 text-center border border-gray-300 dark:border-gray-600" style={{ width: '100px', minWidth: '100px' }}>
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
                          )
                        })
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

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Enter a name for the new column. It will be added to the right of existing columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name</Label>
              <Input
                id="column-name"
                placeholder="New Column"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newColumnName.trim()) {
                    handleAddColumn()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddColumnDialogOpen(false)
              setNewColumnName('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddColumn}
              disabled={!newColumnName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation Dialog */}
      <Dialog open={deleteColumnDialogOpen} onOpenChange={setDeleteColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the column "{columnToDelete?.name}"? This action cannot be undone and will remove all data in this column.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteColumnDialogOpen(false)
              setColumnToDelete(null)
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteColumn}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Row Dialog */}
      <Dialog open={addRowDialogOpen} onOpenChange={setAddRowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Row</DialogTitle>
            <DialogDescription>
              A new empty row will be added to the bottom of your spreadsheet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRowDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setAddRowDialogOpen(false)
                handleAddRow()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Cell Color Dialog */}
      <Dialog open={manualCellColorDialog} onOpenChange={setManualCellColorDialog}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Set Cell Color</DialogTitle>
              {cellColorRulesSaving && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              )}
              {cellColorRulesSaved && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <DialogDescription>
              Apply color to all cells in a column that match a specific value. This will override conditional formatting. Rules are automatically saved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2">
            {/* Active Cell Color Rules */}
            {manualCellColorRules.length > 0 && (
              <div className="space-y-2 border-b pb-4 mb-4">
                <h4 className="text-sm font-semibold">Active Cell Color Rules</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {manualCellColorRules.map(rule => {
                    const column = currentDataset?.columns.find((c: any) => c.id === rule.columnId)
                    return (
                      <div key={rule.id} className={`flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded ${!rule.enabled ? 'opacity-50' : ''}`}>
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: rule.color }}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{column?.name || rule.columnId}</span>
                          {' '}<span className="text-gray-500">{String(rule.operator)}</span>{' '}
                          <span className="font-medium">"{String(rule.value)}"</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCellColorRule(rule.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          title={rule.enabled ? "Hide rule" : "Show rule"}
                        >
                          {rule.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCellColorRule(rule.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          title="Delete rule"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cell-column">Select Column</Label>
              <select
                id="cell-column"
                value={manualCellColorColumnId}
                onChange={(e) => setManualCellColorColumnId(e.target.value)}
                className="w-full h-10 px-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="placeholder" disabled>Select a column</option>
                {(currentDataset?.columns || []).map((col: any) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell-operator">Operator</Label>
              <select
                id="cell-operator"
                value={manualCellColorOperator}
                onChange={(e) => setManualCellColorOperator(e.target.value)}
                className="w-full h-10 px-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="is">is</option>
                <option value="is not">is not</option>
                <option value="contains">contains</option>
                <option value="does not contain">does not contain</option>
                <option value="starts with">starts with</option>
                <option value="ends with">ends with</option>
                <option value="greater than">greater than</option>
                <option value="less than">less than</option>
                <option value="greater than or equal">greater than or equal</option>
                <option value="less than or equal">less than or equal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell-value">Cell Value</Label>
              <Input
                id="cell-value"
                placeholder="Enter the value to match"
                value={manualCellColorValue}
                onChange={(e) => setManualCellColorValue(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All cells that match this condition will be colored
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell-color">Cell Color</Label>
              
              {/* Preset Colors */}
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { name: 'Red', color: '#ef4444' },
                  { name: 'Orange', color: '#f97316' },
                  { name: 'Yellow', color: '#eab308' },
                  { name: 'Green', color: '#10b981' },
                  { name: 'Blue', color: '#3b82f6' },
                  { name: 'Purple', color: '#a855f7' },
                  { name: 'Pink', color: '#ec4899' },
                  { name: 'Gray', color: '#6b7280' }
                ].map(preset => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setManualCellColorColor(preset.color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      manualCellColorColor === preset.color 
                        ? 'border-gray-900 dark:border-white scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="flex gap-2">
                <input
                  type="color"
                  id="cell-color"
                  value={manualCellColorColor}
                  onChange={(e) => setManualCellColorColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  title="Pick custom color"
                />
                <Input
                  placeholder="#10b981"
                  value={manualCellColorColor}
                  onChange={(e) => setManualCellColorColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualCellColorDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleApplyManualCellColor}
              disabled={manualCellColorColumnId === 'placeholder' || !manualCellColorValue.trim()}
            >
              <Palette className="h-4 w-4 mr-2" />
              Apply Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Highlight Column Dialog */}
      <Dialog open={highlightColumnDialog} onOpenChange={setHighlightColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Highlight Column</DialogTitle>
            <DialogDescription>
              Choose a background color for the entire column. This will be applied to all cells in the column.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Column</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {highlightColumnId && currentDataset?.columns.find((c: any) => c.id === highlightColumnId)?.name}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="highlight-color">Highlight Color</Label>
              
              {/* Preset Colors */}
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { name: 'Yellow', color: '#fef08a' },
                  { name: 'Light Green', color: '#bbf7d0' },
                  { name: 'Light Blue', color: '#bfdbfe' },
                  { name: 'Light Pink', color: '#fbcfe8' },
                  { name: 'Light Purple', color: '#e9d5ff' },
                  { name: 'Light Orange', color: '#fed7aa' },
                  { name: 'Light Red', color: '#fecaca' },
                  { name: 'Light Gray', color: '#e5e7eb' }
                ].map(preset => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setHighlightColor(preset.color)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      highlightColor === preset.color 
                        ? 'border-gray-900 dark:border-white scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="flex gap-2">
                <input
                  type="color"
                  id="highlight-color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  title="Pick custom color"
                />
                <Input
                  placeholder="#fef08a"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHighlightColumnDialog(false)}>Cancel</Button>
            <Button onClick={handleApplyColumnHighlight}>
              <Palette className="h-4 w-4 mr-2" />
              Apply Highlight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                            value={String(selectedRow[column.id] ?? '')}
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
