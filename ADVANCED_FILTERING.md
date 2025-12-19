v# Advanced Filtering System

## 🎯 Overview

ZeroStack now features an advanced filtering system with 6 powerful operators, matching modern database tools like Airtable and Notion.

---

## 🔍 Filter Operators

### **1. is** (Equals)
**Meaning**: Exact match  
**Example**: `Name is "Trisha"`  
**Use Case**: Find exact values

### **2. is not** (Not Equal)
**Meaning**: Does not match exactly  
**Example**: `Status is not "Done"`  
**Use Case**: Exclude specific values

### **3. contains** (Substring Match)
**Meaning**: Field contains substring  
**Example**: `Notes contains "urgent"`  
**Use Case**: Search within text

### **4. does not contain** (Negative Substring)
**Meaning**: Field does not contain substring  
**Example**: `Notes does not contain "done"`  
**Use Case**: Exclude text patterns

### **5. is empty** (No Value)
**Meaning**: Field has no value  
**Example**: `Description is empty`  
**Use Case**: Find missing data  
**Note**: No value input needed

### **6. is not empty** (Has Value)
**Meaning**: Field has a value  
**Example**: `Description is not empty`  
**Use Case**: Find filled fields  
**Note**: No value input needed

---

## 🎨 UI Design

### **Empty State**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│         No filter conditions are applied                 │
│                                                          │
│  + Add condition                                         │
└─────────────────────────────────────────────────────────┘
```

### **Adding a Filter**
```
┌─────────────────────────────────────────────────────────┐
│  Where  [Select field ▼]  [is ▼]  [Value...]            │
│                                                          │
│  + Add condition                                         │
└─────────────────────────────────────────────────────────┘
```

### **Active Filters**
```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────┐  │
│  │ Where Name is "Trisha"                      [🗑]  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Where Status is not "Done"                  [🗑]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Where  [Select field ▼]  [is ▼]  [Value...]            │
│                                                          │
│  + Add condition                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### **Filter Structure**
```typescript
interface Filter {
  columnId: string    // Field to filter
  operator: string    // Filter operator
  value: string       // Filter value (optional for is_empty/is_not_empty)
}
```

### **Supported Operators**
```typescript
type FilterOperator = 
  | 'is'                  // Equals
  | 'is_not'              // Not equal
  | 'contains'            // Contains substring
  | 'does_not_contain'    // Does not contain
  | 'is_empty'            // Has no value
  | 'is_not_empty'        // Has value
```

### **Filter Logic**
```typescript
switch (filter.operator) {
  case 'is':
    return cellValue === filterValue
  case 'is_not':
    return cellValue !== filterValue
  case 'contains':
    return cellValue.includes(filterValue)
  case 'does_not_contain':
    return !cellValue.includes(filterValue)
  case 'is_empty':
    return !row[filter.columnId] || String(row[filter.columnId]).trim() === ''
  case 'is_not_empty':
    return row[filter.columnId] && String(row[filter.columnId]).trim() !== ''
}
```

---

## 📋 Usage Examples

### **Example 1: Find Specific Person**
```
Filter: Name is "Trisha"
Result: Shows only rows where Name exactly equals "Trisha"
```

### **Example 2: Exclude Completed Items**
```
Filter: Status is not "Done"
Result: Shows all rows except those with Status = "Done"
```

### **Example 3: Search Notes**
```
Filter: Notes contains "urgent"
Result: Shows rows where Notes field contains the word "urgent"
```

### **Example 4: Find Incomplete Records**
```
Filter: Description is empty
Result: Shows rows where Description field is blank
```

### **Example 5: Multiple Conditions (AND Logic)**
```
Filter 1: Status is not "Done"
Filter 2: Priority contains "High"
Result: Shows rows that match BOTH conditions
```

---

## 🎯 Features

### ✅ **Implemented**
- [x] 6 filter operators
- [x] Multiple filters (AND logic)
- [x] "No filter conditions" empty state
- [x] Clean "Where" syntax
- [x] Delete individual filters
- [x] Auto-hide value input for is_empty/is_not_empty
- [x] Disabled state when no field selected
- [x] Filter count badge on button

### 🔮 **Future Enhancements**
- [ ] OR logic (Add condition group)
- [ ] Greater than / Less than for numbers
- [ ] Date range filters
- [ ] Multi-select filters
- [ ] Save filter presets
- [ ] Filter templates

---

## 🎨 UI Components

### **Filter Button**
```tsx
<Button variant="ghost" size="sm">
  <FilterIcon className="h-4 w-4 mr-2" />
  Filter
  {filters.length > 0 && (
    <span className="ml-1 text-xs text-primary">({filters.length})</span>
  )}
</Button>
```

### **Filter Condition Display**
```tsx
<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
  <div className="flex items-center gap-2 flex-1">
    <span className="text-xs text-gray-500">Where</span>
    <span className="text-sm font-medium">{column.name}</span>
    <span className="text-sm text-gray-600">{operatorLabel}</span>
    {filter.value && (
      <span className="text-sm font-medium">"{filter.value}"</span>
    )}
  </div>
  <Button onClick={() => removeFilter(index)}>
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
```

### **Add Condition Form**
```tsx
<div className="flex items-center gap-2">
  <span className="text-xs text-gray-500">Where</span>
  <Select value={newFilter.columnId}>
    <SelectTrigger>
      <SelectValue placeholder="Select field" />
    </SelectTrigger>
    <SelectContent>
      {columns.map(col => (
        <SelectItem value={col.id}>{col.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Select value={newFilter.operator}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="is">is</SelectItem>
      <SelectItem value="is_not">is not</SelectItem>
      <SelectItem value="contains">contains</SelectItem>
      <SelectItem value="does_not_contain">does not contain</SelectItem>
      <SelectItem value="is_empty">is empty</SelectItem>
      <SelectItem value="is_not_empty">is not empty</SelectItem>
    </SelectContent>
  </Select>
  {needsValue && (
    <Input placeholder="Value" value={newFilter.value} />
  )}
</div>
```

---

## 🔧 Technical Details

### **Files Modified**
1. `components/workspace-toolbar.tsx`
   - Enhanced filter UI
   - Added new operators
   - Improved UX

2. `app/workspace/[datasetId]/page.tsx`
   - Updated filter logic
   - Added operator support
   - Backward compatibility

### **State Management**
```typescript
const [newFilter, setNewFilter] = useState({ 
  columnId: '', 
  operator: 'is', 
  value: '' 
})
const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
```

### **Validation**
```typescript
const addFilter = () => {
  // Allow filters without value for 'is empty' and 'is not empty'
  if (newFilter.columnId && 
      (newFilter.value || 
       newFilter.operator === 'is_empty' || 
       newFilter.operator === 'is_not_empty')) {
    onFiltersChange([...filters, newFilter])
    setNewFilter({ columnId: '', operator: 'is', value: '' })
  }
}
```

---

## 📊 Comparison with Other Tools

| Feature | ZeroStack | Airtable | Notion |
|---------|-----------|----------|--------|
| is (equals) | ✅ | ✅ | ✅ |
| is not | ✅ | ✅ | ✅ |
| contains | ✅ | ✅ | ✅ |
| does not contain | ✅ | ✅ | ✅ |
| is empty | ✅ | ✅ | ✅ |
| is not empty | ✅ | ✅ | ✅ |
| Multiple filters (AND) | ✅ | ✅ | ✅ |
| Filter groups (OR) | 🔮 Future | ✅ | ✅ |

---

## 🎓 Best Practices

### **1. Use Specific Operators**
- ✅ Use `is` for exact matches
- ✅ Use `contains` for partial matches
- ✅ Use `is_empty` to find missing data

### **2. Combine Filters**
```
Example: Find urgent incomplete tasks
Filter 1: Status is not "Done"
Filter 2: Priority contains "Urgent"
```

### **3. Clean Data**
```
Example: Find records needing attention
Filter: Description is empty
```

### **4. Exclude Patterns**
```
Example: Hide archived items
Filter: Name does not contain "ARCHIVED"
```

---

## 🐛 Troubleshooting

### **Issue**: Filter not working
**Solution**: Check that column exists and has data

### **Issue**: "is empty" showing filled rows
**Solution**: Check for whitespace - filter trims values

### **Issue**: Case sensitivity
**Solution**: All text filters are case-insensitive

---

## 🚀 Quick Start

1. **Open your workspace**
2. **Click "Filter" button** in toolbar
3. **Select a field** from dropdown
4. **Choose an operator** (is, contains, etc.)
5. **Enter a value** (if needed)
6. **Click "+ Add condition"**
7. ✅ **Filter applied!**

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
