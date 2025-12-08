import { FilterCondition, FilterOperator, ColorRule } from '@/store/useViewStore'
import { Row } from '@/store/useTableStore'

/**
 * Apply a single filter condition to a row
 */
export function applyFilterCondition(
  row: Row,
  filter: FilterCondition
): boolean {
  const cellValue = row[filter.columnId]
  const filterValue = filter.value

  // Handle empty checks first
  if (filter.operator === 'is_empty') {
    return cellValue === '' || cellValue === null || cellValue === undefined
  }
  if (filter.operator === 'is_not_empty') {
    return cellValue !== '' && cellValue !== null && cellValue !== undefined
  }

  // Convert to strings for text operations
  const cellStr = String(cellValue || '').toLowerCase()
  const filterStr = String(filterValue || '').toLowerCase()

  switch (filter.operator) {
    case 'equals':
      return cellValue === filterValue

    case 'not_equals':
      return cellValue !== filterValue

    case 'contains':
      return cellStr.includes(filterStr)

    case 'not_contains':
      return !cellStr.includes(filterStr)

    case 'starts_with':
      return cellStr.startsWith(filterStr)

    case 'ends_with':
      return cellStr.endsWith(filterStr)

    case 'gt':
      return Number(cellValue) > Number(filterValue)

    case 'lt':
      return Number(cellValue) < Number(filterValue)

    case 'gte':
      return Number(cellValue) >= Number(filterValue)

    case 'lte':
      return Number(cellValue) <= Number(filterValue)

    default:
      return true
  }
}

/**
 * Apply multiple filters to rows (AND logic)
 */
export function applyFilters(
  rows: Row[],
  filters: FilterCondition[]
): Row[] {
  if (filters.length === 0) return rows

  return rows.filter((row) => {
    return filters.every((filter) => applyFilterCondition(row, filter))
  })
}

/**
 * Get color classes for a row based on color rules
 */
export function getRowColorClasses(
  row: Row,
  colorRules: ColorRule[]
): { background: string; text: string } {
  const matchingRules = colorRules.filter((rule) => {
    const cellValue = row[rule.columnId]
    const ruleValue = rule.value

    switch (rule.operator) {
      case 'equals':
        return cellValue === ruleValue
      case 'not_equals':
        return cellValue !== ruleValue
      case 'contains':
        return String(cellValue || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())
      case 'gt':
        return Number(cellValue) > Number(ruleValue)
      case 'lt':
        return Number(cellValue) < Number(ruleValue)
      case 'gte':
        return Number(cellValue) >= Number(ruleValue)
      case 'lte':
        return Number(cellValue) <= Number(ruleValue)
      case 'is_empty':
        return !cellValue || cellValue === ''
      case 'is_not_empty':
        return cellValue && cellValue !== ''
      default:
        return false
    }
  })

  // If multiple rules match, use the first one
  if (matchingRules.length > 0) {
    const rule = matchingRules[0]
    return {
      background: rule.color,
      text: rule.textColor || '',
    }
  }

  return { background: '', text: '' }
}

/**
 * Get operator display name
 */
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    equals: 'is',
    not_equals: 'is not',
    contains: 'contains',
    not_contains: 'does not contain',
    starts_with: 'starts with',
    ends_with: 'ends with',
    is_empty: 'is empty',
    is_not_empty: 'is not empty',
    gt: 'is greater than',
    lt: 'is less than',
    gte: 'is greater than or equal to',
    lte: 'is less than or equal to',
  }
  return labels[operator] || operator
}

/**
 * Get available operators for a column type
 */
export function getOperatorsForType(columnType: string): FilterOperator[] {
  switch (columnType) {
    case 'text':
    case 'email':
    case 'url':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'is_empty',
        'is_not_empty',
      ]

    case 'number':
      return [
        'equals',
        'not_equals',
        'gt',
        'lt',
        'gte',
        'lte',
        'is_empty',
        'is_not_empty',
      ]

    case 'date':
      return [
        'equals',
        'not_equals',
        'gt',
        'lt',
        'is_empty',
        'is_not_empty',
      ]

    case 'select':
    case 'checkbox':
      return [
        'equals',
        'not_equals',
        'is_empty',
        'is_not_empty',
      ]

    default:
      return [
        'equals',
        'not_equals',
        'is_empty',
        'is_not_empty',
      ]
  }
}

/**
 * Predefined color options for conditional formatting
 */
export const COLOR_OPTIONS = [
  { label: 'Red', value: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-100' },
  { label: 'Orange', value: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-100' },
  { label: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-900 dark:text-yellow-100' },
  { label: 'Green', value: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-900 dark:text-green-100' },
  { label: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-100' },
  { label: 'Purple', value: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-100' },
  { label: 'Pink', value: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-100' },
  { label: 'Gray', value: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-900 dark:text-gray-100' },
]
