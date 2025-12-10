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
}: WorkspaceToolbarProps) {
  const [newFilter, setNewFilter] = useState({ columnId: 'placeholder', operator: 'is', value: '' })
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [newSort, setNewSort] = useState({ field: 'placeholder', direction: 'asc' })
  const [newColorRule, setNewColorRule] = useState({ columnId: 'placeholder', value: '', color: '#10b981' })
  const [newCellColorFilter, setNewCellColorFilter] = useState({ color: '#10b981', operator: 'is' })
  const [showSearchInput, setShowSearchInput] = useState(false)

  const currentRowHeight = rowHeight || 'comfortable'

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onVisibleColumnsChange(visibleColumns.filter(id => id !== columnId))
    } else {
      onVisibleColumnsChange([...visibleColumns, columnId])
    }
  }

  const addFilter = () => {
    // Allow filters without value for 'is empty' and 'is not empty'
    if (newFilter.columnId && (newFilter.value || newFilter.operator === 'is_empty' || newFilter.operator === 'is_not_empty')) {
      onFiltersChange([...filters, newFilter])
      setNewFilter({ columnId: '', operator: 'is', value: '' })
    }
  }

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  const addSort = () => {
    if (newSort.field) {
      onSortsChange([...sorts, newSort])
      setNewSort({ field: '', direction: 'asc' })
    }
  }

  const removeSort = (index: number) => {
    onSortsChange(sorts.filter((_, i) => i !== index))
  }

  const addColorRule = () => {
    if (newColorRule.columnId && newColorRule.value) {
      onColorRulesChange([...colorRules, newColorRule])
      setNewColorRule({ columnId: '', value: '', color: '#10b981' })
    }
  }

  const removeColorRule = (index: number) => {
    onColorRulesChange(colorRules.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-3 py-1.5">
      <div className="flex items-center gap-2">
        {/* Fields Panel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <MenuIcon className="h-4 w-4 mr-2" />
              Fields
              {visibleColumns.length < columns.length && (
                <span className="ml-1 text-xs text-primary">({visibleColumns.length}/{columns.length})</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Visible Columns</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {columns.map(column => (
                  <label
                    key={column.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
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
              <div className="pt-2 border-t flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVisibleColumnsChange(columns.map(c => c.id))}
                  className="flex-1"
                >
                  Show All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVisibleColumnsChange([])}
                  className="flex-1"
                >
                  Hide All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter Panel */}
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
          <PopoverContent className="w-[500px]" align="start">
            <div className="space-y-3">
              {filters.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No filter conditions are applied</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter, index) => {
                    const column = columns.find(c => c.id === filter.columnId)
                    const isCellColorFilter = filter.columnId === '__cell_color__'
                    const operatorLabels: Record<string, string> = {
                      'is': 'is',
                      'is_not': 'is not',
                      'contains': 'contains',
                      'does_not_contain': 'does not contain',
                      'greater_than': '>',
                      'less_than': '<',
                      'greater_than_or_equal': '≥',
                      'less_than_or_equal': '≤',
                      'is_empty': 'is empty',
                      'is_not_empty': 'is not empty'
                    }
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Where</span>
                          <span className="text-sm font-medium">{isCellColorFilter ? '🎨 Cell Color' : column?.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{operatorLabels[filter.operator] || filter.operator}</span>
                          {filter.value && (
                            isCellColorFilter ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border-2 border-gray-300" style={{ backgroundColor: filter.value }}></div>
                                <span className="text-sm font-medium">{filter.value}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">"{filter.value}"</span>
                            )
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => removeFilter(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add New Filter */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Where</span>
                  <Select value={newFilter.columnId} onValueChange={(v) => setNewFilter({...newFilter, columnId: v})}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select field</SelectItem>
                      <SelectItem value="__cell_color__">🎨 Cell Color</SelectItem>
                      {columns.filter(col => col.id && col.id !== '').map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newFilter.operator} onValueChange={(v) => setNewFilter({...newFilter, operator: v})}>
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="is">is</SelectItem>
                      <SelectItem value="is_not">is not</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="does_not_contain">does not contain</SelectItem>
                      <SelectItem value="greater_than">greater than (&gt;)</SelectItem>
                      <SelectItem value="less_than">less than (&lt;)</SelectItem>
                      <SelectItem value="greater_than_or_equal">greater than or equal (&gt;=)</SelectItem>
                      <SelectItem value="less_than_or_equal">less than or equal (&lt;=)</SelectItem>
                      <SelectItem value="is_empty">is empty</SelectItem>
                      <SelectItem value="is_not_empty">is not empty</SelectItem>
                    </SelectContent>
                  </Select>
                  {newFilter.operator !== 'is_empty' && newFilter.operator !== 'is_not_empty' && (
                    newFilter.columnId === '__cell_color__' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={newFilter.value || '#10b981'}
                          onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                          className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <Input
                          placeholder="#10b981"
                          value={newFilter.value}
                          onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                          className="h-9 flex-1"
                        />
                      </div>
                    ) : (
                      <Input
                        placeholder="Value"
                        value={newFilter.value}
                        onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                        className="h-9 flex-1"
                      />
                    )
                  )}
                </div>

                <Button 
                  size="sm" 
                  onClick={addFilter} 
                  variant="outline"
                  className="w-full justify-start text-primary hover:text-primary"
                  disabled={!newFilter.columnId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add condition
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Group Panel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Group
              {groupBy && <Check className="h-3 w-3 ml-1 text-primary" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Group By</h4>
              <Select value={groupBy || 'none'} onValueChange={(v) => onGroupByChange(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  {columns.filter(col => col.id && col.id !== '').map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Panel */}
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
              <h4 className="font-semibold text-sm">Sort Rules</h4>
              
              {/* Existing Sorts */}
              {sorts.map((sort, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm flex-1">
                    {columns.find(c => c.id === sort.field)?.name} ({sort.direction})
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => removeSort(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add New Sort */}
              <div className="space-y-2 pt-2 border-t">
                <Select value={newSort.field} onValueChange={(v) => setNewSort({...newSort, field: v})}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Select column</SelectItem>
                    {columns.filter(col => col.id && col.id !== '').map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newSort.direction} onValueChange={(v) => setNewSort({...newSort, direction: v})}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>

                <Button size="sm" onClick={addSort} className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Sort
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Colour Panel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Palette className="h-4 w-4 mr-2" />
              Colour
              {colorRules.length > 0 && (
                <span className="ml-1 text-xs text-primary">({colorRules.length})</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Color Rules</h4>
              
              {/* Existing Rules */}
              {colorRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: rule.color }}
                  />
                  <span className="text-sm flex-1">
                    {columns.find(c => c.id === rule.columnId)?.name} = "{rule.value}"
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => removeColorRule(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add New Rule */}
              <div className="space-y-2 pt-2 border-t">
                <Select value={newColorRule.columnId} onValueChange={(v) => setNewColorRule({...newColorRule, columnId: v})}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Select column</SelectItem>
                    {columns.filter(col => col.id && col.id !== '').map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Value"
                  value={newColorRule.value}
                  onChange={(e) => setNewColorRule({...newColorRule, value: e.target.value})}
                  className="h-8"
                />

                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newColorRule.color}
                    onChange={(e) => setNewColorRule({...newColorRule, color: e.target.value})}
                    className="h-8 w-16"
                  />
                  <Button size="sm" onClick={addColorRule} className="flex-1">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Cell Color Filter Panel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Palette className="h-4 w-4 mr-2" />
              Cell Color
              {filters.filter(f => f.columnId === '__cell_color__').length > 0 && (
                <span className="ml-1 text-xs text-primary">
                  ({filters.filter(f => f.columnId === '__cell_color__').length})
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Filter by Cell Color</h4>
              
              {/* Existing Cell Color Filters */}
              {filters.filter(f => f.columnId === '__cell_color__').map((filter, index) => {
                const actualIndex = filters.findIndex(f => f === filter)
                return (
                  <div key={actualIndex} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: filter.value }}
                    />
                    <span className="text-sm flex-1">
                      {filter.operator === 'is' ? 'Show' : 'Hide'} cells with this color
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeFilter(actualIndex)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}

              {filters.filter(f => f.columnId === '__cell_color__').length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No cell color filters applied</p>
                </div>
              )}

              {/* Add New Cell Color Filter */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Select 
                    value={newCellColorFilter.operator} 
                    onValueChange={(v) => setNewCellColorFilter({...newCellColorFilter, operator: v})}
                  >
                    <SelectTrigger className="h-9 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="is">Show</SelectItem>
                      <SelectItem value="is_not">Hide</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600 dark:text-gray-300">cells with color:</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCellColorFilter.color}
                    onChange={(e) => setNewCellColorFilter({...newCellColorFilter, color: e.target.value})}
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    title="Pick a color"
                  />
                  <Input
                    placeholder="#10b981"
                    value={newCellColorFilter.color}
                    onChange={(e) => setNewCellColorFilter({...newCellColorFilter, color: e.target.value})}
                    className="h-10 flex-1"
                  />
                </div>

                <Button 
                  size="sm" 
                  onClick={() => {
                    if (newCellColorFilter.color) {
                      onFiltersChange([...filters, {
                        columnId: '__cell_color__',
                        operator: newCellColorFilter.operator,
                        value: newCellColorFilter.color
                      }])
                      setNewCellColorFilter({ color: '#10b981', operator: 'is' })
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Color Filter
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Conditional Formatting Rules */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Conditional Formatting
              {filters.filter(f => f.columnId === '__conditional_format__').length > 0 && (
                <span className="ml-1 text-xs text-primary">
                  ({filters.filter(f => f.columnId === '__conditional_format__').length})
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Conditional Formatting Rules</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Apply colors to cells based on their values
              </p>
              
              {/* Existing Rules */}
              {colorRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: rule.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {columns.find(c => c.id === rule.columnId)?.name || rule.columnId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      equals "{rule.value}"
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      const newRules = colorRules.filter((_, i) => i !== index)
                      onColorRulesChange(newRules)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {colorRules.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No rules applied</p>
                </div>
              )}

              {/* Add New Rule */}
              <div className="space-y-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Field</label>
                    <Select 
                      value={newColorRule.columnId} 
                      onValueChange={(v) => setNewColorRule({...newColorRule, columnId: v})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled>Select field</SelectItem>
                        {columns.filter(col => col.id && col.id !== '').map(col => (
                          <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Value</label>
                    <Input
                      placeholder="Value"
                      value={newColorRule.value}
                      onChange={(e) => setNewColorRule({...newColorRule, value: e.target.value})}
                      className="h-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newColorRule.color}
                      onChange={(e) => setNewColorRule({...newColorRule, color: e.target.value})}
                      className="h-9 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      title="Pick a color"
                    />
                    <Input
                      placeholder="#10b981"
                      value={newColorRule.color}
                      onChange={(e) => setNewColorRule({...newColorRule, color: e.target.value})}
                      className="h-9 flex-1"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={newColorRule.columnId === 'placeholder' || !newColorRule.value}
                  onClick={() => {
                    if (newColorRule.columnId !== 'placeholder' && newColorRule.value) {
                      onColorRulesChange([...colorRules, newColorRule])
                      setNewColorRule({ columnId: 'placeholder', value: '', color: '#10b981' })
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row height toggle */}
        {onRowHeightChange && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onRowHeightChange(currentRowHeight === 'compact' ? 'comfortable' : 'compact')}
            title="Row height"
          >
            <MenuIcon className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* View actions menu */}
        {(onViewRename || onViewDuplicate || onViewDelete) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 px-0"
                title="View actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 py-1" align="end">
              {onViewRename && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={onViewRename}
                >
                  Rename view
                </Button>
              )}
              {onViewDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={onViewDuplicate}
                >
                  Duplicate view
                </Button>
              )}
              {onViewDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-red-600"
                  onClick={onViewDelete}
                >
                  Delete view
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Global search */}
        {onGlobalSearchChange && (
          <div className="flex items-center gap-2 ml-1">
            {showSearchInput && (
              <Input
                value={globalSearch || ''}
                onChange={(e) => onGlobalSearchChange(e.target.value)}
                placeholder="Search this view..."
                className="h-7 w-48 text-sm"
              />
            )}
            <Button
              variant={showSearchInput ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 px-0"
              title="Search"
              onClick={() => setShowSearchInput(v => !v)}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
