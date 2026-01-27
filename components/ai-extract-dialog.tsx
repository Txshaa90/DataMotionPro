'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface AIExtractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExtractComplete: (data: any[]) => void
}

export default function AIExtractDialog({ open, onOpenChange, onExtractComplete }: AIExtractDialogProps) {
  const [inputText, setInputText] = useState('')
  const [extractionType, setExtractionType] = useState('general')
  const [extracting, setExtracting] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const extractionTypes = [
    { value: 'general', label: 'General Data', description: 'Auto-detect fields from any text' },
    { value: 'products', label: 'Products', description: 'Title, price, link, description' },
    { value: 'contacts', label: 'Contacts', description: 'Name, email, phone, company' },
    { value: 'inventory', label: 'Inventory', description: 'Item name, SKU, quantity, price' },
  ]

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to extract')
      return
    }

    setExtracting(true)
    setError(null)
    setPreviewData(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          extractionType,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract data')
      }

      if (result.data.length === 0) {
        setError('No data could be extracted from the text')
        return
      }

      setPreviewData(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to extract data')
    } finally {
      setExtracting(false)
    }
  }

  const handleImport = () => {
    if (previewData) {
      onExtractComplete(previewData)
      handleClose()
    }
  }

  const handleClose = () => {
    setInputText('')
    setPreviewData(null)
    setError(null)
    setExtractionType('general')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Data Extraction
          </DialogTitle>
          <DialogDescription>
            Paste raw text, product listings, or URLs. AI will extract structured data automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Extraction Type Selector */}
          <div className="space-y-2">
            <Label>What type of data are you extracting?</Label>
            <Select value={extractionType} onValueChange={setExtractionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {extractionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input Text Area */}
          <div className="space-y-2">
            <Label>Paste your text or URLs</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Example:&#10;&#10;Product 1: iPhone 15 Pro - $999&#10;Link: https://example.com/iphone&#10;&#10;Product 2: Samsung Galaxy S24 - $899&#10;Link: https://example.com/samsung&#10;&#10;Or paste any unstructured text..."
              className="min-h-[200px] font-mono text-sm"
              disabled={extracting}
            />
            <p className="text-xs text-gray-500">
              {inputText.length} characters
            </p>
          </div>

          {/* Extract Button */}
          <Button
            onClick={handleExtract}
            disabled={extracting || !inputText.trim()}
            className="w-full"
            size="lg"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Data
              </>
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Extraction Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewData && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Extraction Successful!</p>
                  <p className="text-sm text-green-700">
                    Found {previewData.length} {previewData.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-700">Preview</p>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium text-gray-700 border-b">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          {Object.values(row).map((value: any, colIdx) => (
                            <td key={colIdx} className="px-4 py-2 text-gray-900">
                              {String(value || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleImport} className="flex-1" size="lg">
                  Import {previewData.length} {previewData.length === 1 ? 'Row' : 'Rows'}
                </Button>
                <Button onClick={handleClose} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
