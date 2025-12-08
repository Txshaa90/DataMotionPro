'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterCondition, FilterOperator } from '@/store/useViewStore'
import { Column } from '@/store/useTableStore'
import { getOperatorsForType, getOperatorLabel } from '@/lib/filter-utils'
import { X } from 'lucide-react'

interface FilterBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: Column[]
  filters: FilterCondition[]
  onAddFilter: (filter: Omit<FilterCondition, 'id'>) => void
  onUpdateFilter: (filterId: string, updates: Partial<FilterCondition>) => void
  onRemoveFilter: (filterId: string) => void
  onClearFilters: () => void
}

export function FilterBuilder({
  open,
  onOpenChange,
  columns,
  filters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearFilters,
}: FilterBuilderProps) {
  const [newFilter, setNewFilter] = useState<{
    columnId: string
    operator: FilterOperator
    value: string
  }>({
    columnId: columns[0]?.id || '',
    operator: 'equals',
    value: '',
  })

  const selectedColumn = columns.find((c) => c.id === newFilter.columnId)
  const availableOperators = selectedColumn
    ? getOperatorsForType(selectedColumn.type)
    : []

  const handleAddFilter = () => {
    if (!newFilter.columnId || !newFilter.operator) return

    onAddFilter({
      columnId: newFilter.columnId,
      operator: newFilter.operator,
      value: newFilter.value,
    })

    // Reset form
    setNewFilter({
      columnId: columns[0]?.id || '',
      operator: 'equals',
      value: '',
    })
  }

  const needsValue = (operator: FilterOperator) => {
    return operator !== 'is_empty' && operator !== 'is_not_empty'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Records</DialogTitle>
          <DialogDescription>
            Add conditions to filter your data. All conditions must be met (AND logic).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Filters ({filters.length})</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {filters.map((filter) => {
                  const column = columns.find((c) => c.id === filter.columnId)
                  return (
                    <div
                      key={filter.id}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{column?.name}</span>
                        <span className="text-gray-500 mx-2">
                          {getOperatorLabel(filter.operator)}
                        </span>
                        {needsValue(filter.operator) && (
                          <span className="font-medium">"{String(filter.value)}"</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onRemoveFilter(filter.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add New Filter */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Add Filter</h4>
            
            {/* Column Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Column</label>
              <Select
                value={newFilter.columnId}
                onValueChange={(value) =>
                  setNewFilter({ ...newFilter, columnId: value, operator: 'equals' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name} ({column.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Condition</label>
              <Select
                value={newFilter.operator}
                onValueChange={(value) =>
                  setNewFilter({ ...newFilter, operator: value as FilterOperator })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {getOperatorLabel(op)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            {needsValue(newFilter.operator) && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Value</label>
                <Input
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter({ ...newFilter, value: e.target.value })
                  }
                  placeholder="Enter value..."
                  type={
                    selectedColumn?.type === 'number'
                      ? 'number'
                      : selectedColumn?.type === 'date'
                      ? 'date'
                      : 'text'
                  }
                />
              </div>
            )}

            <Button onClick={handleAddFilter} className="w-full">
              Add Filter
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
