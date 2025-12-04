'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Grid3x3,
  LayoutGrid,
  FileText,
  Columns as ColumnsIcon,
  Calendar,
  BarChart3,
  TrendingDown,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Sheet {
  id: string
  name: string
  type: 'grid' | 'gallery' | 'form' | 'kanban' | 'calendar' | 'chart' | 'returns'
  rows?: any[]
  visible_columns?: string[]
  filters?: any[]
  sorts?: any[]
  group_by?: string | null
  color_rules?: any[]
  chart_config?: {
    chartType: 'bar' | 'line' | 'pie'
    xAxisField: string
    yAxisField: string
    aggregation: 'count' | 'sum' | 'avg'
  }
}

interface SheetSidebarProps {
  datasetName?: string
  sheets: Sheet[]
  activeSheetId: string | null
  onSheetSelect: (sheetId: string) => void
  onAddSheet: (viewType?: 'grid' | 'chart' | 'returns') => void
  onRenameSheet: (sheetId: string, newName: string) => void
  onDeleteSheet: (sheetId: string) => void
  onDuplicateSheet: (sheetId: string) => void
}

export function SheetSidebar({
  datasetName,
  sheets,
  activeSheetId,
  onSheetSelect,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  onDuplicateSheet,
}: SheetSidebarProps) {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const getSheetIcon = (type: string) => {
    switch (type) {
      case 'grid': return <Grid3x3 className="h-4 w-4" />
      case 'gallery': return <LayoutGrid className="h-4 w-4" />
      case 'form': return <FileText className="h-4 w-4" />
      case 'kanban': return <ColumnsIcon className="h-4 w-4" />
      case 'calendar': return <Calendar className="h-4 w-4" />
      case 'chart': return <BarChart3 className="h-4 w-4" />
      case 'returns': return <TrendingDown className="h-4 w-4" />
      default: return <Grid3x3 className="h-4 w-4" />
    }
  }

  const startEditing = (sheet: Sheet) => {
    setEditingSheetId(sheet.id)
    setEditingName(sheet.name)
  }

  const saveEdit = (sheetId: string) => {
    if (editingName.trim()) {
      onRenameSheet(sheetId, editingName.trim())
    }
    setEditingSheetId(null)
    setEditingName('')
  }

  const cancelEdit = () => {
    setEditingSheetId(null)
    setEditingName('')
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Dataset Title */}
      {datasetName && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{datasetName}</h2>
        </div>
      )}
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Sheets</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddSheet()}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sheet List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {sheets.map(sheet => (
            <div
              key={sheet.id}
              className={`group relative rounded-lg transition-colors ${
                sheet.id === activeSheetId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {editingSheetId === sheet.id ? (
                // Edit Mode
                <div className="flex items-center gap-1 p-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(sheet.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => saveEdit(sheet.id)}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => onSheetSelect(sheet.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    {getSheetIcon(sheet.type)}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">{sheet.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sheet.rows?.length || 0} rows
                      </div>
                    </div>
                  </button>

                  {/* Actions Menu */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8"
                          onClick={() => startEditing(sheet)}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Rename
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8"
                          onClick={() => onDuplicateSheet(sheet.id)}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Duplicate
                        </Button>
                        {sheets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => onDeleteSheet(sheet.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Sheet Button (Bottom) */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              New View
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => onAddSheet('grid')}
              >
                <Grid3x3 className="h-3 w-3 mr-2" />
                Grid View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => onAddSheet('chart')}
              >
                <BarChart3 className="h-3 w-3 mr-2" />
                Chart View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => onAddSheet('returns')}
              >
                <TrendingDown className="h-3 w-3 mr-2" />
                Returns Analysis
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
