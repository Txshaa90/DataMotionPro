'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Search, Filter, SortAsc, Eye, Settings } from 'lucide-react'
import Link from 'next/link'

export default function DatasetPage() {
  const params = useParams<{ datasetId: string }>()
  const router = useRouter()
  const datasetId = params.datasetId
  
  const [dataset, setDataset] = useState<any>(null)
  const [views, setViews] = useState<any[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [showAllRows, setShowAllRows] = useState(false)

  const currentView = views.find(v => v.id === activeViewId) || views[0]
  const visibleColumns = dataset?.columns?.filter((col: any) => 
    currentView?.visible_columns?.includes(col.id)
  ) || []

  useEffect(() => {
    async function fetchData() {
      if (!datasetId) return
      setLoading(true)
      try {
        const { data: datasetData, error: datasetError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', datasetId)
          .single()
        if (datasetError) throw datasetError

        const { data: viewsData, error: viewsError } = await supabase
          .from('views')
          .select('*')
          .eq('table_id', datasetId)
        if (viewsError) throw viewsError

        setDataset(datasetData)
        setViews(viewsData || [])
        
        if (viewsData && viewsData.length > 0 && !activeViewId) {
          setActiveViewId((viewsData[0] as any).id)
        }
      } catch (error) {
        console.error('Error fetching dataset:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [datasetId])

  const handleUpdateCell = async (rowId: string, columnId: string, value: any) => {
    if (!currentView) return
    const updatedRows = (currentView.rows || []).map((r: any) => 
      r.id === rowId ? { ...r, [columnId]: value } : r
    )
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentView.id)
      setViews(views.map(v => v.id === currentView.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error updating cell:', error)
    }
  }

  const handleAddRow = async () => {
    if (!dataset || !currentView) return
    const newRow: any = { id: crypto.randomUUID() }
    dataset.columns.forEach((col: any) => { newRow[col.id] = '' })
    const updatedRows = [...(currentView.rows || []), newRow]
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentView.id)
      setViews(views.map(v => v.id === currentView.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error adding row:', error)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!currentView) return
    const updatedRows = (currentView.rows || []).filter((r: any) => r.id !== rowId)
    try {
      await supabase.from('views').update({ rows: updatedRows }).eq('id', currentView.id)
      setViews(views.map(v => v.id === currentView.id ? { ...v, rows: updatedRows } : v))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const filteredRows = useMemo(() => {
    let rows = currentView?.rows || []
    
    if (globalSearch) {
      rows = rows.filter((row: any) =>
        dataset.columns.some((col: any) =>
          String(row[col.id] || '').toLowerCase().includes(globalSearch.toLowerCase())
        )
      )
    }
    
    return rows
  }, [currentView?.rows, globalSearch, dataset?.columns])

  const totalRows = filteredRows.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const displayRows = showAllRows 
    ? filteredRows 
    : filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Dataset not found</h2>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 gap-4 sticky top-0 z-50">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {dataset.name}
        </h1>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>

        <Button variant="outline" size="sm" className="gap-2">
          <SortAsc className="h-4 w-4" />
          Sort
        </Button>

        <Button onClick={handleAddRow} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </header>

      {/* Views Tabs */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center px-4 gap-2 overflow-x-auto">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveViewId(view.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeViewId === view.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {view.name}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto w-full">
          <div className="min-w-max">
            <table className="border-separate border-spacing-0 w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky left-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700" style={{ width: '60px' }}>
                    #
                  </th>
                  {visibleColumns.map((column: any) => (
                    <th 
                      key={column.id} 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700" 
                      style={{ minWidth: '200px' }}
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ width: '100px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row: any, index: number) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400 font-medium sticky left-0 z-10 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700" style={{ width: '60px' }}>
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    {visibleColumns.map((column: any) => (
                      <td 
                        key={column.id} 
                        className="px-4 py-2 border-b border-r border-gray-200 dark:border-gray-700" 
                        style={{ minWidth: '200px' }}
                      >
                        <Input
                          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                          value={row[column.id] || ''}
                          onChange={(e) => handleUpdateCell(row.id, column.id, e.target.value)}
                          className="border-0 focus:ring-1 focus:ring-blue-500 bg-transparent w-full h-8 text-sm"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-center border-b border-gray-200 dark:border-gray-700" style={{ width: '100px' }}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteRow(row.id)} 
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with row count and pagination */}
        <div className="h-12 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'}
          </div>

          {!showAllRows && totalPages > 1 && (
            <div className="flex items-center gap-4">
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }} 
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
