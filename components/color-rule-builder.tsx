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
import { ColorRule, FilterOperator } from '@/store/useViewStore'
import { Column } from '@/store/useTableStore'
import { getOperatorsForType, getOperatorLabel, COLOR_OPTIONS } from '@/lib/filter-utils'
import { X, Palette } from 'lucide-react'

interface ColorRuleBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: Column[]
  colorRules: ColorRule[]
  onAddColorRule: (rule: Omit<ColorRule, 'id'>) => void
  onRemoveColorRule: (ruleId: string) => void
  onClearColorRules: () => void
}

export function ColorRuleBuilder({
  open,
  onOpenChange,
  columns,
  colorRules,
  onAddColorRule,
  onRemoveColorRule,
  onClearColorRules,
}: ColorRuleBuilderProps) {
  const [newRule, setNewRule] = useState<{
    columnId: string
    operator: FilterOperator
    value: string
    color: string
    textColor: string
  }>({
    columnId: columns[0]?.id || '',
    operator: 'equals',
    value: '',
    color: COLOR_OPTIONS[0].value,
    textColor: COLOR_OPTIONS[0].text,
  })

  const selectedColumn = columns.find((c) => c.id === newRule.columnId)
  const availableOperators = selectedColumn
    ? getOperatorsForType(selectedColumn.type)
    : []

  const handleAddRule = () => {
    if (!newRule.columnId || !newRule.operator || !newRule.color) return

    onAddColorRule({
      columnId: newRule.columnId,
      operator: newRule.operator,
      value: newRule.value,
      color: newRule.color,
      textColor: newRule.textColor,
    })

    // Reset form
    setNewRule({
      columnId: columns[0]?.id || '',
      operator: 'equals',
      value: '',
      color: COLOR_OPTIONS[0].value,
      textColor: COLOR_OPTIONS[0].text,
    })
  }

  const needsValue = (operator: FilterOperator) => {
    return operator !== 'is_empty' && operator !== 'is_not_empty'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conditional Coloring</DialogTitle>
          <DialogDescription>
            Highlight rows based on their values. First matching rule will be applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Active Color Rules */}
          {colorRules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Rules ({colorRules.length})</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearColorRules}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {colorRules.map((rule) => {
                  const column = columns.find((c) => c.id === rule.columnId)
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 p-3 rounded-lg border"
                    >
                      <div className={`w-8 h-8 rounded ${rule.color} flex-shrink-0`} />
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{column?.name}</span>
                        <span className="text-gray-500 mx-2">
                          {getOperatorLabel(rule.operator)}
                        </span>
                        {needsValue(rule.operator) && (
                          <span className="font-medium">"{String(rule.value)}"</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onRemoveColorRule(rule.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add New Color Rule */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Add Color Rule</h4>
            
            {/* Column Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Column</label>
              <Select
                value={newRule.columnId}
                onValueChange={(value) =>
                  setNewRule({ ...newRule, columnId: value, operator: 'equals' })
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
                value={newRule.operator}
                onValueChange={(value) =>
                  setNewRule({ ...newRule, operator: value as FilterOperator })
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
            {needsValue(newRule.operator) && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Value</label>
                <Input
                  value={newRule.value}
                  onChange={(e) =>
                    setNewRule({ ...newRule, value: e.target.value })
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

            {/* Color Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() =>
                      setNewRule({
                        ...newRule,
                        color: colorOption.value,
                        textColor: colorOption.text,
                      })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newRule.color === colorOption.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded ${colorOption.value} flex items-center justify-center`}>
                      {newRule.color === colorOption.value && (
                        <Palette className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-center">{colorOption.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleAddRule} className="w-full">
              Add Color Rule
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
