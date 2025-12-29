'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Menu as MenuIcon,
  Filter as FilterIcon,
  Grid3x3,
  SortAsc,
  Palette,
  Plus,
  X,
  Check,
  Trash2,
  MoreVertical,
  Search as SearchIcon,
  Sparkles,
  Calendar,
  Type,
  Bold,
  Italic,
  Underline,
} from 'lucide-react'

interface WorkspaceToolbarProps {
  columns: any[]
  visibleColumns: string[]
  groupBy: string | null
  filters: any[]
  sorts: any[]
  colorRules: any[]
  onVisibleColumnsChange: (columns: string[]) => void
  onGroupByChange: (columnId: string | null) => void
  onFiltersChange: (filters: any[]) => void
  onSortsChange: (sorts: any[]) => void
  onColorRulesChange: (rules: any[]) => void
  globalSearch?: string
  onGlobalSearchChange?: (value: string) => void
  rowHeight?: 'compact' | 'comfortable'
  onRowHeightChange?: (mode: 'compact' | 'comfortable') => void
  onViewRename?: () => void
  onViewDuplicate?: () => void
  onViewDelete?: () => void
  dateRangeFilter?: { startDate: string; endDate: string; columnId: string } | null
  onDateRangeFilterChange?: (filter: { startDate: string; endDate: string; columnId: string } | null) => void
  globalFontColor?: string
  globalBgColor?: string
  onGlobalFontColorChange?: (color: string) => void
  onGlobalBgColorChange?: (color: string) => void
  globalBold?: boolean
  globalItalic?: boolean
  globalUnderline?: boolean
  onGlobalBoldChange?: (bold: boolean) => void
  onGlobalItalicChange?: (italic: boolean) => void
  onGlobalUnderlineChange?: (underline: boolean) => void
}

export function WorkspaceToolbar({
  columns,
  visibleColumns,
  groupBy,
  filters,
  sorts,
  colorRules,
  onVisibleColumnsChange,
  onGroupByChange,
  onFiltersChange,
  onSortsChange,
  onColorRulesChange,
  globalSearch,
  onGlobalSearchChange,
  rowHeight,
  onRowHeightChange,
  onViewRename,
  onViewDuplicate,
  onViewDelete,
  dateRangeFilter,
  onDateRangeFilterChange,
  globalFontColor,
  globalBgColor,
  onGlobalFontColorChange,
  onGlobalBgColorChange,
  globalBold,
  globalItalic,
  globalUnderline,
  onGlobalBoldChange,
  onGlobalItalicChange,
  onGlobalUnderlineChange,
}: WorkspaceToolbarProps) {
  const [newFilter, setNewFilter] = useState({ columnId: 'placeholder', operator: 'is', value: '' })
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [newSort, setNewSort] = useState({ field: 'placeholder', direction: 'asc' })
  const [newColorRule, setNewColorRule] = useState({ columnId: 'placeholder', value: '', color: '#10b981' })
  const [newCellColorRule, setNewCellColorRule] = useState({ columnId: 'placeholder', value: '', color: '#10b981' })
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [newDateRange, setNewDateRange] = useState({ columnId: 'placeholder', startDate: '', endDate: '', preset: 'custom' })
  const [filterHeaderSearch, setFilterHeaderSearch] = useState('')
  const [cellColorHeaderSearch, setCellColorHeaderSearch] = useState('')
  const [conditionalFormattingSearch, setConditionalFormattingSearch] = useState('')

  const currentRowHeight = rowHeight || 'comfortable'

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onVisibleColumnsChange(visibleColumns.filter(id => id !== columnId))
    } else {
      onVisibleColumnsChange([...visibleColumns, columnId])
    }
  }

  const addFilter = () => {
    if (newFilter.columnId !== 'placeholder' && newFilter.value) {
      onFiltersChange([...filters, { ...newFilter, id: crypto.randomUUID() }])
      setNewFilter({ columnId: 'placeholder', operator: 'is', value: '' })
      setFilterPopoverOpen(false)
    }
  }

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId))
  }

  const addSort = () => {
    if (newSort.field !== 'placeholder') {
      onSortsChange([...sorts, { ...newSort, id: crypto.randomUUID() }])
      setNewSort({ field: 'placeholder', direction: 'asc' })
    }
  }

  const removeSort = (sortId: string) => {
    onSortsChange(sorts.filter(s => s.id !== sortId))
  }

  const addColorRule = () => {
    if (newColorRule.columnId !== 'placeholder' && newColorRule.value) {
      onColorRulesChange([...colorRules, { ...newColorRule, id: crypto.randomUUID() }])
      setNewColorRule({ columnId: 'placeholder', value: '', color: '#10b981' })
    }
  }

  const removeColorRule = (ruleId: string) => {
    onColorRulesChange(colorRules.filter(r => r.id !== ruleId))
  }

  const calculateDateRange = (preset: string) => {
    const endDate = new Date().toISOString().split('T')[0]
    let startDate = ''
    
    if (preset === 'last1') {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last3') {
      const date = new Date()
      date.setDate(date.getDate() - 3)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last7') {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last14') {
      const date = new Date()
      date.setDate(date.getDate() - 14)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last30') {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last50') {
      const date = new Date()
      date.setDate(date.getDate() - 50)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last90') {
      const date = new Date()
      date.setDate(date.getDate() - 90)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last180') {
      const date = new Date()
      date.setDate(date.getDate() - 180)
      startDate = date.toISOString().split('T')[0]
    } else if (preset === 'last365') {
      const date = new Date()
      date.setDate(date.getDate() - 365)
      startDate = date.toISOString().split('T')[0]
    }
    
    return { startDate, endDate }
  }

  // Filter columns based on search
  const filteredColumns = columns.filter(col => 
    col.name.toLowerCase().includes(filterHeaderSearch.toLowerCase())
  )

  const filteredCellColorColumns = columns.filter(col => 
    col.name.toLowerCase().includes(cellColorHeaderSearch.toLowerCase())
  )

  const filteredConditionalColumns = columns.filter(col => 
    col.name.toLowerCase().includes(conditionalFormattingSearch.toLowerCase())
  )

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* View Options Menu */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <MenuIcon className="h-4 w-4 mr-2" />
            View
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="space-y-1">
            {onViewRename && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onViewRename}
              >
                Rename View
              </Button>
            )}
            {onViewDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onViewDuplicate}
              >
                Duplicate View
              </Button>
            )}
            {onViewDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={onViewDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete View
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Hide Fields */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Hide Fields
            <span className="ml-1 text-xs text-gray-500">
              ({visibleColumns.length}/{columns.length})
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Visible Columns</h4>
            
            {/* Search input */}
            <Input
              placeholder="Search columns..."
              value={filterHeaderSearch}
              onChange={(e) => setFilterHeaderSearch(e.target.value)}
              className="h-8"
            />
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredColumns.map(column => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{column.name}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter */}
      <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
            {filters.length > 0 && (
              <span className="ml-1 text-xs text-primary">({filters.length})</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Filters</h4>
            
            {/* Current Filters */}
            {filters.length > 0 && (
              <div className="space-y-2">
                {filters.map(filter => (
                  <div key={filter.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm flex-1">
                      {columns.find(c => c.id === filter.columnId)?.name || 'Unknown'} {filter.operator} "{filter.value}"
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Filter */}
            <div className="space-y-2 pt-2 border-t">
              <Select
                value={newFilter.columnId}
                onValueChange={(v) => setNewFilter({...newFilter, columnId: v})}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select column</SelectItem>
                  {columns.filter(col => col.id && col.id.trim() !== '').map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newFilter.operator}
                onValueChange={(v) => setNewFilter({...newFilter, operator: v})}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is">is</SelectItem>
                  <SelectItem value="is not">is not</SelectItem>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="does not contain">does not contain</SelectItem>
                  <SelectItem value="starts with">starts with</SelectItem>
                  <SelectItem value="ends with">ends with</SelectItem>
                  <SelectItem value="greater than">greater than</SelectItem>
                  <SelectItem value="less than">less than</SelectItem>
                  <SelectItem value="greater than or equal">greater than or equal</SelectItem>
                  <SelectItem value="less than or equal">less than or equal</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter value"
                value={newFilter.value}
                onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                className="h-9"
              />

              <Button
                size="sm"
                onClick={addFilter}
                className="w-full"
                disabled={newFilter.columnId === 'placeholder' || !newFilter.value}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Filter
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <SortAsc className="h-4 w-4 mr-2" />
            Sort
            {sorts.length > 0 && (
              <span className="ml-1 text-xs text-primary">({sorts.length})</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Sort</h4>
            
            {/* Current Sorts */}
            {sorts.length > 0 && (
              <div className="space-y-2">
                {sorts.map(sort => (
                  <div key={sort.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm flex-1">
                      {columns.find(c => c.id === sort.field)?.name || 'Unknown'} ({sort.direction})
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeSort(sort.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Sort */}
            <div className="space-y-2 pt-2 border-t">
              <Select
                value={newSort.field}
                onValueChange={(v) => setNewSort({...newSort, field: v})}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select column</SelectItem>
                  {columns.filter(col => col.id && col.id.trim() !== '').map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newSort.direction}
                onValueChange={(v) => setNewSort({...newSort, direction: v})}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={addSort}
                className="w-full"
                disabled={newSort.field === 'placeholder'}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Sort
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
            {dateRangeFilter && (
              <span className="ml-1 text-xs text-primary">(1)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Filter by Date Range</h4>
            
            {/* Current Date Range Filter */}
            {dateRangeFilter && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {columns.find(c => c.id === dateRangeFilter.columnId)?.name || 'Date Column'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onDateRangeFilterChange?.(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {dateRangeFilter.startDate} to {dateRangeFilter.endDate}
                </p>
              </div>
            )}

            {!dateRangeFilter && (
              <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                No date range filter applied
              </p>
            )}

            {/* Add New Date Range Filter */}
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Column</label>
                <Select
                  value={newDateRange.columnId}
                  onValueChange={(v) => setNewDateRange({...newDateRange, columnId: v})}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Select column</SelectItem>
                    {columns.filter(col => (col.type === 'date' || col.id.toLowerCase().includes('date')) && col.id && col.id.trim() !== '').map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={newDateRange.preset || 'custom'}
                  onValueChange={(preset) => {
                    if (preset === 'custom') {
                      setNewDateRange({...newDateRange, preset, startDate: '', endDate: ''})
                    } else {
                      const { startDate, endDate } = calculateDateRange(preset)
                      setNewDateRange({...newDateRange, preset, startDate, endDate})
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last1">Last Day</SelectItem>
                    <SelectItem value="last3">Last 3 Days</SelectItem>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last14">Last 14 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last50">Last 50 Days</SelectItem>
                    <SelectItem value="last90">Last 90 Days</SelectItem>
                    <SelectItem value="last180">Last 180 Days</SelectItem>
                    <SelectItem value="last365">Last 365 Days</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newDateRange.preset === 'custom' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={newDateRange.startDate}
                      onChange={(e) => setNewDateRange({...newDateRange, startDate: e.target.value})}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={newDateRange.endDate}
                      onChange={(e) => setNewDateRange({...newDateRange, endDate: e.target.value})}
                      className="h-9"
                    />
                  </div>
                </>
              )}

              <Button
                size="sm"
                onClick={() => {
                  if (newDateRange.columnId !== 'placeholder' && newDateRange.startDate && newDateRange.endDate) {
                    onDateRangeFilterChange?.({
                      columnId: newDateRange.columnId,
                      startDate: newDateRange.startDate,
                      endDate: newDateRange.endDate
                    })
                    setNewDateRange({ columnId: 'placeholder', startDate: '', endDate: '', preset: 'custom' })
                  }
                }}
                className="w-full"
                disabled={newDateRange.columnId === 'placeholder' || !newDateRange.startDate || !newDateRange.endDate}
              >
                <Plus className="h-3 w-3 mr-1" />
                Apply Date Range
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Global Font & Background Settings */}
      {onGlobalFontColorChange && onGlobalBgColorChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Type className="h-4 w-4 mr-2" />
              Spreadsheet Style
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="start">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Global Spreadsheet Style</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set font, background colors, and text formatting for the entire spreadsheet
              </p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text Formatting</label>
                  <div className="flex gap-2">
                    <Button
                      variant={globalBold ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onGlobalBoldChange?.(!globalBold)}
                      className="flex-1"
                    >
                      <Bold className="h-4 w-4 mr-1" />
                      Bold
                    </Button>
                    <Button
                      variant={globalItalic ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onGlobalItalicChange?.(!globalItalic)}
                      className="flex-1"
                    >
                      <Italic className="h-4 w-4 mr-1" />
                      Italic
                    </Button>
                    <Button
                      variant={globalUnderline ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onGlobalUnderlineChange?.(!globalUnderline)}
                      className="flex-1"
                    >
                      <Underline className="h-4 w-4 mr-1" />
                      Underline
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={globalFontColor || '#000000'}
                      onChange={(e) => onGlobalFontColorChange?.(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      placeholder="#000000"
                      value={globalFontColor || '#000000'}
                      onChange={(e) => onGlobalFontColorChange?.(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={globalBgColor || '#ffffff'}
                      onChange={(e) => onGlobalBgColorChange?.(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      placeholder="#ffffff"
                      value={globalBgColor || '#ffffff'}
                      onChange={(e) => onGlobalBgColorChange?.(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <div 
                    className="px-3 py-2 rounded border"
                    style={{
                      backgroundColor: globalBgColor || '#ffffff',
                      color: globalFontColor || '#000000',
                      fontWeight: globalBold ? 'bold' : 'normal',
                      fontStyle: globalItalic ? 'italic' : 'normal',
                      textDecoration: globalUnderline ? 'underline' : 'none'
                    }}
                  >
                    Sample spreadsheet text
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onGlobalFontColorChange?.('#000000')
                      onGlobalBgColorChange?.('#ffffff')
                      onGlobalBoldChange?.(false)
                      onGlobalItalicChange?.(false)
                      onGlobalUnderlineChange?.(false)
                    }}
                    className="flex-1"
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Search */}
      <div className="ml-auto flex items-center gap-2">
        {showSearchInput ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search columns..."
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange?.(e.target.value)}
              className="h-8 w-64"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowSearchInput(false)
                onGlobalSearchChange?.('')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSearchInput(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
