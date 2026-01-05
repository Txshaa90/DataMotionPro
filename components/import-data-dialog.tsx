'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUp, FileSpreadsheet, FileJson, ChevronRight, Upload, FileType, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

interface ImportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
  sheetId: string
  onImportComplete: () => void
}

type ImportSource = 'csv' | 'json' | 'excel' | null

export function ImportDataDialog({ 
  open, 
  onOpenChange, 
  datasetId, 
  sheetId,
  onImportComplete 
}: ImportDataDialogProps) {
  const BATCH_SIZE = 300 // Optimal batch size for Supabase
  
  // Helper function for chunked batch inserts
  const insertRowsInBatches = async (rows: any[], viewId: string, onProgress?: (current: number, total: number) => void) => {
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1
      
      // Update progress if callback provided
      if (onProgress) {
        onProgress(currentBatch, totalBatches)
      }
      
      // Get existing rows from the view
      const { data: viewData, error: fetchError } = await (supabase as any)
        .from('views')
        .select('rows')
        .eq('id', viewId)
        .single()
      
      if (fetchError) throw fetchError
      
      const existingRows = viewData?.rows || []
      const updatedRows = [...existingRows, ...batch]
      
      // Update view with new batch
      const { error: updateError } = await (supabase as any)
        .from('views')
        .update({ rows: updatedRows })
        .eq('id', viewId)
      
      if (updateError) throw updateError
      
      // Small delay to prevent overwhelming Supabase
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }
  
  const [selectedSource, setSelectedSource] = useState<ImportSource>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [excelSheets, setExcelSheets] = useState<string[]>([])
  const [selectedExcelSheets, setSelectedExcelSheets] = useState<string[]>([])
  const [showSheetSelector, setShowSheetSelector] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; sheetName: string; rowCount: number; batchInfo?: { current: number; total: number } } | null>(null)

  const importSources = [
    {
      id: 'csv' as const,
      name: 'CSV',
      description: 'Import from CSV file',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    {
      id: 'excel' as const,
      name: 'Excel',
      description: 'Import from Excel file (.xlsx)',
      icon: FileType,
      color: 'text-emerald-600'
    },
    {
      id: 'json' as const,
      name: 'JSON',
      description: 'Import from JSON file',
      icon: FileJson,
      color: 'text-blue-600'
    }
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      
      // If Excel file, detect available sheets
      if (selectedSource === 'excel') {
        try {
          const data = await selectedFile.arrayBuffer()
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetNames = workbook.SheetNames
          
          setExcelSheets(sheetNames)
          setSelectedExcelSheets([sheetNames[0]]) // Select first sheet by default
          
          if (sheetNames.length > 1) {
            setShowSheetSelector(true)
          }
        } catch (err) {
          setError('Failed to read Excel file')
        }
      }
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // Improved CSV parser that handles quoted fields with commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"'
            i++ // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      // Add last field
      result.push(current.trim())
      
      return result
    }

    // Parse header
    const headers = parseCSVLine(lines[0])
    console.log('📋 CSV Headers:', headers)
    
    // Parse rows
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = { id: crypto.randomUUID() }
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
    
    console.log('📊 Sample parsed row:', rows[0])
    
    return rows
  }

  const parseJSON = (text: string): any[] => {
    try {
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: item.id || crypto.randomUUID(),
          ...item
        }))
      } else if (typeof data === 'object') {
        return [{
          id: crypto.randomUUID(),
          ...data
        }]
      }
      return []
    } catch (err) {
      throw new Error('Invalid JSON format')
    }
  }

  const parseExcelWithExcelJS = async (file: File, sheetNames?: string[]): Promise<{ [sheetName: string]: any[] }> => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)
    
    const result: { [sheetName: string]: any[] } = {}
    const sheetsToImport = sheetNames || workbook.worksheets.map(ws => ws.name)
    
    for (const sheetName of sheetsToImport) {
      const worksheet = workbook.getWorksheet(sheetName)
      if (!worksheet) continue
      
      const rows: any[] = []
      const headers: string[] = []
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || `Column${colNumber}`)
      })
      
      // Process data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header row
        
        // Build rowData with id first, then columns in header order
        const rowData: any = { id: crypto.randomUUID() }
        const cellColors: any = {}
        const cellValues: any = {}
        
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1]
          if (!header) return
          
          let value = cell.value
          
          // Handle date values
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0] // YYYY-MM-DD
          }
          // Handle formula results
          else if (value && typeof value === 'object' && 'result' in value) {
            value = (value as any).result
          }
          // Handle rich text
          else if (value && typeof value === 'object' && 'richText' in value) {
            value = (value as any).richText.map((t: any) => t.text).join('')
          }
          
          cellValues[header] = value
          
          // Extract cell background color
          if (cell.fill && cell.fill.type === 'pattern') {
            const patternFill = cell.fill as ExcelJS.FillPattern
            if (patternFill.fgColor) {
              let hexColor = ''
              
              if ('argb' in patternFill.fgColor && patternFill.fgColor.argb) {
                // ARGB format (e.g., "FFFF0000")
                hexColor = `#${patternFill.fgColor.argb.substring(2)}`
              } else if ('theme' in patternFill.fgColor) {
                // Theme colors - map to approximate values
                const themeColors: { [key: number]: string } = {
                  0: '#000000', 1: '#FFFFFF', 2: '#E7E6E6', 3: '#44546A',
                  4: '#4472C4', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
                  8: '#5B9BD5', 9: '#70AD47'
                }
                hexColor = themeColors[patternFill.fgColor.theme || 0] || '#FFFFFF'
              }
              
              if (hexColor && hexColor !== '#FFFFFF' && hexColor !== '#ffffff') {
                cellColors[header] = hexColor
              }
            }
          }
        })
        
        // Add columns in header order to preserve column sequence
        headers.forEach(header => {
          rowData[header] = cellValues[header] !== undefined ? cellValues[header] : ''
        })
        
        // Store cell colors if any were found
        if (Object.keys(cellColors).length > 0) {
          rowData._cellColors = cellColors
        }
        
        rows.push(rowData)
      })
      
      result[sheetName] = rows
    }
    
    return result
  }

  const parseExcel = async (file: File, sheetNames?: string[]): Promise<{ [sheetName: string]: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { 
            type: 'binary',
            cellDates: true,  // Convert Excel dates to JS Date objects
            cellStyles: true, // Read cell styles for conditional formatting
            raw: true         // Keep raw values to preserve ASINs and text
          })
          
          const result: { [sheetName: string]: any[] } = {}
          
          // Parse selected sheets (or all if none specified)
          const sheetsToImport = sheetNames || workbook.SheetNames
          
          sheetsToImport.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            
            // Get the range of the worksheet
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
            
            // First pass: identify ASIN columns by checking header row
            const headerRow: any = {}
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col })
              const cell = worksheet[cellAddress]
              if (cell && cell.v) {
                headerRow[col] = String(cell.v)
              }
            }
            
            // Find ASIN column indices
            const asinColumns = new Set<number>()
            Object.entries(headerRow).forEach(([colIndex, headerName]) => {
              if (String(headerName).toLowerCase().includes('asin')) {
                asinColumns.add(parseInt(colIndex))
              }
            })
            
            // Convert to JSON with options to handle dates and hidden columns
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              raw: true,         // Keep raw values to preserve text like ASINs
              defval: '',        // Default value for empty cells
              blankrows: false   // Skip blank rows
              // Don't specify header - let it auto-detect from first row
            })
            
            // Extract headers from first row
            const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as any) : []
            
            // Add unique IDs and process dates
            const rows = jsonData.map((row: any, rowIndex: number) => {
              const processedRow: any = { id: crypto.randomUUID() }
              const cellColors: any = {} // Store cell colors
              
              // Actual row index in Excel (accounting for header row)
              const excelRowIndex = rowIndex + 1
              
              Object.entries(row).forEach(([key, value], colIndex) => {
                const keyLower = key.toLowerCase()
                
                // Force ASIN columns to be text (prevent scientific notation)
                if (keyLower.includes('asin') && typeof value === 'number') {
                  // Convert number back to string, preserving leading zeros if possible
                  processedRow[key] = String(value)
                }
                // If value looks like an Excel serial date (number between 1 and 100000)
                else if (typeof value === 'number' && value > 1 && value < 100000 && keyLower.includes('date')) {
                  // Convert Excel serial date to JavaScript Date
                  const excelEpoch = new Date(1899, 11, 30)
                  const jsDate = new Date(excelEpoch.getTime() + value * 86400000)
                  processedRow[key] = jsDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
                }
                // If value is already a Date object or ISO string, format it
                else if (value instanceof Date || (typeof value === 'string' && value.includes('T') && keyLower.includes('date'))) {
                  const date = value instanceof Date ? value : new Date(value)
                  processedRow[key] = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
                } else {
                  processedRow[key] = value
                }
                
                // Extract cell background color
                const headerIndex = headers.indexOf(key)
                if (headerIndex !== -1) {
                  const cellAddress = XLSX.utils.encode_cell({ r: excelRowIndex, c: headerIndex })
                  const cell = worksheet[cellAddress]
                  
                  if (cell && cell.s) {
                    let hexColor = ''
                    
                    // Try to get fill color from various sources
                    const fill = cell.s.fill || cell.s.fgColor
                    
                    if (fill) {
                      // Check for patternFill (most common)
                      if (fill.fgColor) {
                        const color = fill.fgColor
                        if (color.rgb) {
                          // RGB format (e.g., "FFFF0000" for red)
                          hexColor = `#${color.rgb.substring(2)}` // Remove alpha channel
                        } else if (color.theme !== undefined) {
                          // Theme color - map to approximate hex values
                          const themeColors: { [key: number]: string } = {
                            0: '#000000', 1: '#FFFFFF', 2: '#E7E6E6', 3: '#44546A',
                            4: '#4472C4', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
                            8: '#5B9BD5', 9: '#70AD47'
                          }
                          hexColor = themeColors[color.theme] || '#FFFFFF'
                        }
                      }
                      // Check for bgColor as fallback
                      else if (fill.bgColor && fill.bgColor.rgb) {
                        hexColor = `#${fill.bgColor.rgb.substring(2)}`
                      }
                    }
                    // Direct fgColor (older format)
                    else if (cell.s.fgColor) {
                      const color = cell.s.fgColor
                      if (color.rgb) {
                        hexColor = `#${color.rgb.substring(2)}`
                      } else if (color.theme !== undefined) {
                        const themeColors: { [key: number]: string } = {
                          0: '#000000', 1: '#FFFFFF', 2: '#E7E6E6', 3: '#44546A',
                          4: '#4472C4', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
                          8: '#5B9BD5', 9: '#70AD47'
                        }
                        hexColor = themeColors[color.theme] || '#FFFFFF'
                      }
                    }
                    
                    if (hexColor && hexColor !== '#FFFFFF' && hexColor !== '#ffffff') {
                      cellColors[key] = hexColor
                    }
                  }
                }
              })
              
              // Store cell colors if any were found
              if (Object.keys(cellColors).length > 0) {
                processedRow._cellColors = cellColors
              }
              
              return processedRow
            })
            
            result[sheetName] = rows
          })
          
          resolve(result)
        } catch (err) {
          reject(new Error('Failed to parse Excel file'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }

  const handleImport = async () => {
    if (!file || !selectedSource) return

    setImporting(true)
    setError(null)

    try {
      const userId = '0aebc03e-defa-465d-ac65-b6c15806fd26' // TODO: Get from auth context

      if (selectedSource === 'excel' && selectedExcelSheets.length > 0) {
        // Multi-sheet Excel import using ExcelJS
        const sheetsData = await parseExcelWithExcelJS(file, selectedExcelSheets)
        
        // Extract columns from ALL sheets to get complete column list
        // Use array to preserve order instead of Set
        const allColumnKeys: string[] = []
        const seenColumns = new Set<string>()
        
        Object.values(sheetsData).forEach(sheetRows => {
          if (sheetRows && sheetRows.length > 0) {
            const sampleRow = sheetRows[0]
            // Object.keys preserves insertion order in modern JavaScript
            Object.keys(sampleRow).filter(key => key !== 'id' && key !== '_cellColors').forEach(key => {
              if (!seenColumns.has(key)) {
                allColumnKeys.push(key)
                seenColumns.add(key)
              }
            })
          }
        })
        
        const columnKeys = allColumnKeys
        console.log('📋 All unique columns from import (in order):', columnKeys)
        
        if (columnKeys.length > 0) {
          // Get current dataset columns
          const { data: tableData, error: tableError } = await (supabase as any)
            .from('tables')
            .select('columns')
            .eq('id', datasetId)
            .single()
          
          if (!tableError && tableData) {
            const existingColumns = tableData.columns || []
            const existingColumnIds = new Set(existingColumns.map((c: any) => c.id))
            
            // Create new columns for any that don't exist
            const newColumns = columnKeys
              .filter(key => !existingColumnIds.has(key))
              .map(key => ({
                id: key,
                name: key, // Keep original name
                type: 'text',
                width: 200
              }))
            
            console.log('📋 New columns to add:', newColumns.length)
            console.log('📋 Existing columns:', existingColumns.length)
            
            // Always update with merged columns
            const updatedColumns = [...existingColumns, ...newColumns]
            const { error: updateError } = await (supabase as any)
              .from('tables')
              .update({ columns: updatedColumns })
              .eq('id', datasetId)
            
            if (updateError) {
              console.error('❌ Error updating columns:', updateError)
            } else {
              console.log('✅ Columns updated successfully:', updatedColumns.length, 'total columns')
            }
          }
        }
        
        const sheetEntries = Object.entries(sheetsData)
        const totalSheets = sheetEntries.length
        
        console.log('📊 Starting import of', totalSheets, 'sheets')
        
        for (let i = 0; i < sheetEntries.length; i++) {
          const [sheetName, rows] = sheetEntries[i]
          
          console.log(`📄 Processing sheet "${sheetName}":`, rows.length, 'rows')
          
          if (rows.length === 0) {
            console.warn(`⚠️ Skipping empty sheet: ${sheetName}`)
            continue
          }
          
          // Update progress
          setImportProgress({ current: i + 1, total: totalSheets, sheetName, rowCount: rows.length })
          
          // Get all column IDs from the rows (exclude id and _cellColors)
          const columnIds = rows.length > 0 ? Object.keys(rows[0]).filter(key => key !== 'id' && key !== '_cellColors') : []
          
          console.log(`📋 Columns for "${sheetName}":`, columnIds)
          console.log(`📊 Sample row:`, rows[0])
          
          // Create new sheet for each Excel sheet (initially empty)
          const { data: insertedData, error: insertError } = await (supabase as any)
            .from('views')
            .insert({
              user_id: userId,
              table_id: datasetId,
              name: sheetName,
              type: 'grid',
              visible_columns: columnIds,
              filters: [],
              sorts: [],
              color_rules: [],
              group_by: null,
              rows: [] // Start with empty rows
            })
            .select()
          
          if (insertError) {
            console.error(`❌ Error creating sheet "${sheetName}":`, insertError)
            throw new Error(`Failed to import sheet "${sheetName}": ${insertError.message}`)
          }
          
          const viewId = insertedData[0].id
          console.log(`✅ Sheet "${sheetName}" created, now importing ${rows.length} rows in batches...`)
          
          // Import rows in batches to avoid Supabase limits
          await insertRowsInBatches(rows, viewId, (currentBatch, totalBatches) => {
            setImportProgress({ 
              current: i + 1, 
              total: totalSheets, 
              sheetName, 
              rowCount: rows.length,
              batchInfo: { current: currentBatch, total: totalBatches }
            })
          })
          
          console.log(`✅ Sheet "${sheetName}" imported successfully with ${rows.length} rows`)
          
          // Small delay to prevent overwhelming the UI
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        console.log('🎉 All sheets imported successfully!')
      } else {
        // Single file import (CSV, JSON, or single Excel sheet)
        let importedRows: any[] = []

        if (selectedSource === 'csv') {
          const text = await file.text()
          importedRows = parseCSV(text)
        } else if (selectedSource === 'json') {
          const text = await file.text()
          importedRows = parseJSON(text)
        }

        if (importedRows.length === 0) {
          throw new Error('No data found in file')
        }

        console.log('📊 Imported rows:', importedRows.length)
        console.log('📋 Sample row:', importedRows[0])

        // Show progress for CSV/JSON imports
        setImportProgress({ 
          current: 1, 
          total: 3, 
          sheetName: file.name,
          rowCount: importedRows.length 
        })

        // Extract column names from imported data
        const columnKeys = importedRows.length > 0 
          ? Object.keys(importedRows[0]).filter(key => key !== 'id')
          : []
        
        console.log('📋 Detected columns:', columnKeys)

        // Update dataset columns
        if (columnKeys.length > 0) {
          const { data: tableData, error: tableError } = await (supabase as any)
            .from('tables')
            .select('columns')
            .eq('id', datasetId)
            .single()
          
          if (!tableError && tableData) {
            const existingColumns = tableData.columns || []
            const existingColumnIds = new Set(existingColumns.map((c: any) => c.id))
            
            // Create new columns for any that don't exist
            const newColumns = columnKeys
              .filter(key => !existingColumnIds.has(key))
              .map(key => ({
                id: key,
                name: key,
                type: 'text',
                width: 200
              }))
            
            if (newColumns.length > 0 || existingColumns.length === 0) {
              const updatedColumns = [...existingColumns, ...newColumns]
              
              // Update progress - step 2
              setImportProgress({ 
                current: 2, 
                total: 3, 
                sheetName: file.name,
                rowCount: importedRows.length 
              })
              
              const { error: updateColError } = await (supabase as any)
                .from('tables')
                .update({ columns: updatedColumns })
                .eq('id', datasetId)
              
              if (updateColError) {
                console.error('❌ Error updating columns:', updateColError)
              } else {
                console.log('✅ Columns updated:', updatedColumns.length)
              }
            }
          }
        }

        // Update progress - step 3
        setImportProgress({ 
          current: 3, 
          total: 3, 
          sheetName: file.name,
          rowCount: importedRows.length 
        })

        // Create a new sheet for the imported data (initially empty)
        const sheetName = file.name.replace(/\.(csv|json)$/i, '') || 'Imported Data'
        
        const { data: insertedData, error: insertError } = await (supabase as any)
          .from('views')
          .insert({
            user_id: userId,
            table_id: datasetId,
            name: sheetName,
            type: 'grid',
            visible_columns: columnKeys,
            filters: [],
            sorts: [],
            color_rules: [],
            group_by: null,
            rows: [] // Start with empty rows
          })
          .select()

        if (insertError) {
          console.error(`❌ Error creating sheet "${sheetName}":`, insertError)
          throw new Error(`Failed to import data: ${insertError.message}`)
        }
        
        const viewId = insertedData[0].id
        console.log(`✅ Sheet "${sheetName}" created, now importing ${importedRows.length} rows in batches...`)
        
        // Import rows in batches to avoid Supabase limits
        await insertRowsInBatches(importedRows, viewId, (currentBatch, totalBatches) => {
          setImportProgress({ 
            current: 3, 
            total: 3, 
            sheetName: file.name, 
            rowCount: importedRows.length,
            batchInfo: { current: currentBatch, total: totalBatches }
          })
        })
        
        console.log(`✅ Sheet "${sheetName}" imported successfully with ${importedRows.length} rows`)
      }

      // Success
      onImportComplete()
      onOpenChange(false)
      setSelectedSource(null)
      setFile(null)
      setExcelSheets([])
      setSelectedExcelSheets([])
      setShowSheetSelector(false)
      setImportProgress(null)
    } catch (err: any) {
      setError(err.message || 'Failed to import data')
    } finally {
      setImporting(false)
      setImportProgress(null)
    }
  }

  const handleBack = () => {
    setSelectedSource(null)
    setFile(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedSource ? `Import from ${selectedSource.toUpperCase()}` : 'Import data from'}
          </DialogTitle>
          <DialogDescription>
            {selectedSource 
              ? 'Upload your file to import data'
              : 'Choose a source to import your data'
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedSource ? (
          // Source Selection
          <div className="space-y-2 py-4">
            {importSources.map((source) => {
              const Icon = source.icon
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${source.color}`} />
                    <div className="text-left">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {source.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              )
            })}
          </div>
        ) : (
          // File Upload
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">
                Upload {selectedSource.toUpperCase()} File
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept={
                    selectedSource === 'csv' 
                      ? '.csv' 
                      : selectedSource === 'excel' 
                        ? '.xlsx,.xls' 
                        : '.json'
                  }
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileUp className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-gray-400">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}
            </div>

            {/* Excel Sheet Selector */}
            {selectedSource === 'excel' && showSheetSelector && excelSheets.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Sheets to Import</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExcelSheets(excelSheets)}
                      className="h-7 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExcelSheets([])}
                      className="h-7 text-xs"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {excelSheets.map((sheetName) => (
                    <label
                      key={sheetName}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExcelSheets.includes(sheetName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExcelSheets([...selectedExcelSheets, sheetName])
                          } else {
                            setSelectedExcelSheets(selectedExcelSheets.filter(s => s !== sheetName))
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm flex-1">{sheetName}</span>
                      {selectedExcelSheets.includes(sheetName) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {selectedExcelSheets.length} of {excelSheets.length} sheet(s) selected
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Each will create a new sheet
                  </span>
                </div>
              </div>
            )}

            {/* Import Progress */}
            {(importing || importProgress) && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      {importProgress ? (
                        <>Importing {importProgress.sheetName || 'data'}...</>
                      ) : (
                        <>Processing file...</>
                      )}
                    </div>
                    {importProgress && (
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {importProgress.rowCount?.toLocaleString() || 0} rows • Step {importProgress.current} of {importProgress.total}
                        {importProgress.batchInfo && (
                          <span className="ml-2">
                            • Batch {importProgress.batchInfo.current} of {importProgress.batchInfo.total}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {importProgress && (
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {Math.round((importProgress.current / importProgress.total) * 100)}%
                    </span>
                  )}
                </div>
                {importProgress && (
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {selectedSource === 'csv' 
                  ? '💡 CSV files should have headers in the first row. Data will be appended to existing rows.'
                  : selectedSource === 'excel'
                    ? showSheetSelector && excelSheets.length > 1
                      ? `💡 Select any number of sheets to import (${excelSheets.length} available). Each will become a new sheet in your workspace.`
                      : '💡 Excel files (.xlsx) should have headers in the first row. Data will be imported as a new sheet.'
                    : '💡 JSON files should contain an array of objects or a single object. Each object will become a row.'
                }
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={importing}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  !file || 
                  importing || 
                  (selectedSource === 'excel' && showSheetSelector && selectedExcelSheets.length === 0)
                }
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
