'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingDown, Package, AlertCircle } from 'lucide-react'

interface Sheet {
  id: string
  name: string
  type: string
  rows: any[]
}

interface ReturnsAnalysisProps {
  rows: any[]
  columns: any[]
  sheets?: Sheet[]
}

type DateRange = 'all' | 'last60days' | 'lastmonth' | 'thismonth' | 'thisweek' | 'custom'

export default function ReturnsAnalysis({ rows, columns, sheets }: ReturnsAnalysisProps) {
  const [selectedASIN, setSelectedASIN] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [sourceSheetId, setSourceSheetId] = useState<string>(
    sheets && sheets.find(s => s.type === 'grid')?.id || ''
  )

  // Get the actual data to display based on selected sheet
  const displayRows = sourceSheetId && sheets 
    ? sheets.find(s => s.id === sourceSheetId)?.rows || rows
    : rows

  // Debug: Log the first row to see column names
  console.log('🔍 Returns Analysis - Props received:', {
    rowsLength: rows.length,
    columnsLength: columns.length,
    sheetsLength: sheets?.length || 0,
    sourceSheetId
  })
  console.log('🔍 Returns Analysis - DisplayRows:', displayRows.length)
  console.log('🔍 Returns Analysis - First row:', displayRows[0])
  if (displayRows[0]) {
    const allKeys = Object.keys(displayRows[0])
    console.log('🔍 Returns Analysis - All column names:', allKeys.join(', '))
    console.log('🔍 Returns Analysis - Date-related columns:', allKeys.filter(k => k.toLowerCase().includes('date')))
    console.log('🔍 Returns Analysis - Sample date values:', {
      'RETURN REQUEST DATE': displayRows[0]['RETURN REQUEST DATE'],
      'ORDER DATE': displayRows[0]['ORDER DATE'],
      'RETURN DATE': displayRows[0]['RETURN DATE']
    })
  }

  // Filter rows by date range
  const filteredByDate = useMemo(() => {
    if (dateRange === 'all') {
      console.log('📅 All Time selected - showing all', displayRows.length, 'rows')
      return displayRows
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Calculate date boundaries
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last60DaysStart = new Date(todayStart.getTime() - 60 * 24 * 60 * 60 * 1000)
    const thisWeekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(currentYear, currentMonth, 1)
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    let sampleDateLogged = false
    const filtered = displayRows.filter((row: any) => {
      // Prioritize Return request date field (lowercase as shown in console)
      const dateValue = row['Return request date'] || row['RETURN REQUEST DATE'] || row['Return Request Date'] || row.return_request_date ||
                       row['Return delivery date'] || row['RETURN DATE'] || row['Return Date'] || row.return_date ||
                       row['Order date'] || row['ORDER DATE'] || row['Order Date'] || row.order_date ||
                       row.created_at || row.CREATED_AT || row['CREATED AT'] || 
                       row.date || row.DATE || row.Date
      
      // Log first date found for debugging
      if (!sampleDateLogged && dateValue) {
        console.log('✅ Sample date found:', dateValue, 'Type:', typeof dateValue)
        sampleDateLogged = true
      }
      
      if (!dateValue) {
        // Only log first few missing dates to avoid console spam
        if (!sampleDateLogged) {
          console.log('⚠️ No date column found in data. Available keys:', Object.keys(row).slice(0, 15))
          console.log('💡 Date filtering disabled - showing all rows')
          sampleDateLogged = true
        }
        return true // Include rows without dates (show all data when no date column exists)
      }

      // Handle Excel serial dates (numbers like 45603)
      let dateObj: Date
      if (typeof dateValue === 'number' && dateValue > 1 && dateValue < 100000) {
        // Convert Excel serial date to JavaScript Date
        const excelEpoch = new Date(1899, 11, 30)
        dateObj = new Date(excelEpoch.getTime() + dateValue * 86400000)
        
        // Log first conversion for debugging
        if (!sampleDateLogged) {
          console.log('🔄 Converting Excel date:', dateValue, '→', dateObj.toISOString().split('T')[0])
        }
      } else if (typeof dateValue === 'string') {
        // Try parsing string dates (YYYY-MM-DD format)
        dateObj = new Date(dateValue)
      } else {
        dateObj = new Date(dateValue)
      }
      
      if (isNaN(dateObj.getTime())) {
        if (Math.random() < 0.01) {
          console.log('⚠️ Invalid date:', dateValue, typeof dateValue)
        }
        return false
      }

      // Apply date range filters
      let matches = false
      const dateStr = dateObj.toISOString().split('T')[0]
      
      switch (dateRange) {
        case 'last60days':
          matches = dateObj >= last60DaysStart
          if (!sampleDateLogged) {
            console.log(`📅 Checking last60days: ${dateStr} >= ${last60DaysStart.toISOString().split('T')[0]} = ${matches}`)
          }
          break
        case 'thisweek':
          matches = dateObj >= thisWeekStart
          if (!sampleDateLogged) {
            console.log(`📅 Checking thisweek: ${dateStr} >= ${thisWeekStart.toISOString().split('T')[0]} = ${matches}`)
          }
          break
        case 'thismonth':
          matches = dateObj >= thisMonthStart
          if (!sampleDateLogged) {
            console.log(`📅 Checking thismonth: ${dateStr} >= ${thisMonthStart.toISOString().split('T')[0]} = ${matches}`)
          }
          break
        case 'lastmonth':
          matches = dateObj >= lastMonthStart && dateObj <= lastMonthEnd
          if (!sampleDateLogged) {
            console.log(`📅 Checking lastmonth: ${lastMonthStart.toISOString().split('T')[0]} <= ${dateStr} <= ${lastMonthEnd.toISOString().split('T')[0]} = ${matches}`)
          }
          break
        case 'custom':
          if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate)
            const endDate = new Date(customEndDate)
            endDate.setHours(23, 59, 59, 999) // Include the entire end date
            matches = dateObj >= startDate && dateObj <= endDate
            if (!sampleDateLogged) {
              console.log(`📅 Checking custom: ${customStartDate} <= ${dateStr} <= ${customEndDate} = ${matches}`)
            }
          } else {
            matches = true // If custom dates not set, show all
          }
          break
        default:
          matches = true
      }
      
      return matches
    })

    // Find the actual date range in the data
    const allDates = displayRows
      .map((row: any) => {
        const dateValue = row['Return request date'] || row['RETURN REQUEST DATE'] || row['Return Request Date'] || row.return_request_date
        if (typeof dateValue === 'number' && dateValue > 1 && dateValue < 100000) {
          const excelEpoch = new Date(1899, 11, 30)
          return new Date(excelEpoch.getTime() + dateValue * 86400000)
        }
        return dateValue ? new Date(dateValue) : null
      })
      .filter((d: any) => d && !isNaN(d.getTime()))
      .sort((a: any, b: any) => a - b)
    
    const earliestDate = allDates[0]
    const latestDate = allDates[allDates.length - 1]

    console.log(`📅 Date Filter Results:`, {
      dateRange,
      totalRows: displayRows.length,
      filteredRows: filtered.length,
      dataDateRange: earliestDate && latestDate ? {
        earliest: earliestDate.toISOString().split('T')[0],
        latest: latestDate.toISOString().split('T')[0]
      } : 'No dates found',
      boundaries: {
        last60DaysStart: last60DaysStart.toISOString().split('T')[0],
        thisWeekStart: thisWeekStart.toISOString().split('T')[0],
        thisMonthStart: thisMonthStart.toISOString().split('T')[0],
        lastMonthStart: lastMonthStart.toISOString().split('T')[0],
        lastMonthEnd: lastMonthEnd.toISOString().split('T')[0]
      }
    })

    return filtered
  }, [displayRows, dateRange, customStartDate, customEndDate])

  // Calculate return rate for each ASIN
  const returnRateData = useMemo(() => {
    const asinStats: Record<string, {
      asin: string
      itemName: string
      totalUnitsSold: number
      totalOrders: number
      totalReturns: number
      returnRate: number
      topReturnReason: string
      returnReasonCount: Record<string, number>
    }> = {}

    filteredByDate.forEach((row: any) => {
      // Try multiple possible column name variations
      const asin = row.asin || row.ASIN || row['ASIN'] || row['Product ASIN'] || row['product_asin'] || 'Unknown'
      const itemName = row.item_name || row['ITEM NAME'] || row.itemName || row['Item Name'] || row['Product Name'] || row['product_name'] || 'Unknown Item'
      const returnReason = row.return_reason || row['RETURN REASON'] || row.returnReason || row['Return Reason'] || 
                          row['Reason'] || row.reason || row['Return reason'] || 'Unknown'
      
      // Get total units sold, total orders, and total returns from the new CSV structure
      const totalUnitsSold = parseInt(row.asin_total_units_sold || row['asin_total_units_sold'] || 
                                     row.ASIN_TOTAL_UNITS_SOLD || row['ASIN_TOTAL_UNITS_SOLD'] || 
                                     row.total_units_sold || '0')
      const totalOrders = parseInt(row.asin_total_orders || row['asin_total_orders'] || 
                                   row.ASIN_TOTAL_ORDERS || row['ASIN_TOTAL_ORDERS'] ||
                                   row.total_orders || row.order_quantity || row['ORDER QUANTITY'] || '0')
      const totalReturns = parseInt(row.asin_total_units_returned || row['asin_total_units_returned'] ||
                                   row.ASIN_TOTAL_UNITS_RETURNED || row['ASIN_TOTAL_UNITS_RETURNED'] ||
                                   row.asin_total_returns || row['asin_total_returns'] || row.total_returns ||
                                   row.return_quantity || row['RETURN QUANTITY'] || '0')

      if (!asinStats[asin]) {
        asinStats[asin] = {
          asin,
          itemName,
          totalUnitsSold: 0,
          totalOrders: 0,
          totalReturns: 0,
          returnRate: 0,
          topReturnReason: '',
          returnReasonCount: {}
        }
      }

      // Use the values from the row (they're already aggregated per ASIN)
      // Only update if the new value is higher (in case of multiple rows per ASIN)
      asinStats[asin].totalUnitsSold = Math.max(asinStats[asin].totalUnitsSold, totalUnitsSold)
      asinStats[asin].totalOrders = Math.max(asinStats[asin].totalOrders, totalOrders)
      asinStats[asin].totalReturns = Math.max(asinStats[asin].totalReturns, totalReturns)
      
      // Count return reasons
      if (returnReason && returnReason !== 'Unknown') {
        if (!asinStats[asin].returnReasonCount[returnReason]) {
          asinStats[asin].returnReasonCount[returnReason] = 0
        }
        asinStats[asin].returnReasonCount[returnReason] += 1
      }
    })

    // Calculate return rate and find top reason
    Object.values(asinStats).forEach(stat => {
      // Return Rate = (Total Returns / Total Orders) * 100
      stat.returnRate = stat.totalOrders > 0 ? (stat.totalReturns / stat.totalOrders) * 100 : 0
      
      // Find most common return reason
      let maxCount = 0
      Object.entries(stat.returnReasonCount).forEach(([reason, count]) => {
        if (count > maxCount) {
          maxCount = count
          stat.topReturnReason = reason
        }
      })
    })

    // Sort by total returns (highest first)
    return Object.values(asinStats).sort((a, b) => b.totalReturns - a.totalReturns)
  }, [filteredByDate])

  // Get return reasons for selected ASIN
  const returnReasonsPieData = useMemo(() => {
    if (selectedASIN === 'all') {
      // Aggregate all return reasons
      const reasonCounts: Record<string, number> = {}
      filteredByDate.forEach((row: any) => {
        const reason = row.return_reason || row['RETURN REASON'] || row.returnReason || row['Return Reason'] || 'Unknown'
        const qty = parseInt(row.return_quantity || row['RETURN QUANTITY'] || row.returnQuantity || row['Return Quantity'] || '1')
        reasonCounts[reason] = (reasonCounts[reason] || 0) + qty
      })
      
      return Object.entries(reasonCounts).map(([name, value]) => ({ name, value }))
    } else {
      // Get reasons for specific ASIN
      const asinData = returnRateData.find(d => d.asin === selectedASIN)
      if (!asinData) return []
      
      return Object.entries(asinData.returnReasonCount).map(([name, value]) => ({ name, value }))
    }
  }, [selectedASIN, filteredByDate, returnRateData])

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

  // Get total orders for selected ASIN
  const totalOrders = useMemo(() => {
    if (selectedASIN === 'all') {
      return filteredByDate.length
    }
    const asinData = returnRateData.find(d => d.asin === selectedASIN)
    return asinData?.totalOrders || 0
  }, [selectedASIN, filteredByDate, returnRateData])

  // Get unique ASINs for dropdown
  const uniqueASINs = useMemo(() => {
    return Array.from(new Set(returnRateData.map(d => d.asin)))
  }, [returnRateData])

  // Format date range display
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'all':
        return 'All Time'
      case 'last60days':
        return 'Last 60 Days'
      case 'lastmonth':
        return 'Last Month'
      case 'thismonth':
        return 'This Month'
      case 'thisweek':
        return 'This Week'
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const end = new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          return `${start} - ${end}`
        }
        return 'Custom Range'
      default:
        return 'All Time'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Returns Analysis Report</h2>
          <p className="text-gray-500 dark:text-gray-400">Analyze return rates and reasons by ASIN</p>
        </div>
        <div className="flex gap-4">
          {/* Data Source Selection */}
          {sheets && sheets.length > 0 && (
            <Select value={sourceSheetId || 'placeholder'} onValueChange={setSourceSheetId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Select sheet</SelectItem>
                {sheets.filter(s => s.type === 'grid').map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name} ({sheet.rows?.length || 0} rows)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last60days">Last 60 Days</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="thisweek">This Week</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="Start Date"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="End Date"
              />
            </div>
          )}

          <Select value={selectedASIN} onValueChange={setSelectedASIN}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select ASIN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ASINs</SelectItem>
              {uniqueASINs.map(asin => (
                <SelectItem key={asin} value={asin}>{asin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {selectedASIN === 'all' ? 'All ASINs' : selectedASIN}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Return Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedASIN === 'all' 
                ? (returnRateData.reduce((sum, d) => sum + d.returnRate, 0) / returnRateData.length || 0).toFixed(1)
                : (returnRateData.find(d => d.asin === selectedASIN)?.returnRate || 0).toFixed(1)
              }%
            </div>
            <p className="text-xs text-muted-foreground">Returns / Orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Return Reason</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {returnReasonsPieData.length > 0 
                ? returnReasonsPieData.reduce((max, curr) => curr.value > max.value ? curr : max).name
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">Most common issue</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart for Return Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Return Reasons Distribution</CardTitle>
          <CardDescription>
            {selectedASIN === 'all' ? 'All ASINs' : `ASIN: ${selectedASIN}`} - {getDateRangeLabel()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={returnReasonsPieData}
                cx="35%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {returnReasonsPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value} returns`, 'Count']} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ paddingLeft: '20px' }}
                formatter={(value: string, entry: any) => {
                  const total = returnReasonsPieData.reduce((sum, item) => sum + item.value, 0)
                  const percent = ((entry.payload.value / total) * 100).toFixed(1)
                  return `${value} (${percent}%)`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Return Rate Table */}
      <Card>
        <CardHeader>
          <CardTitle>Returns by ASIN</CardTitle>
          <CardDescription>Ranked by total number of returns (highest to lowest)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ASIN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Units Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Returns</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Return Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Top Return Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {returnRateData.slice(0, 20).map((data, index) => (
                  <tr 
                    key={data.asin} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${selectedASIN === data.asin ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => setSelectedASIN(data.asin)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">#{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{data.asin}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{data.itemName}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                      {data.totalUnitsSold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                      {data.totalOrders.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-bold ${data.totalReturns > 50 ? 'text-red-600' : data.totalReturns > 25 ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {data.totalReturns.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-bold ${data.returnRate > 10 ? 'text-red-600' : data.returnRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {data.returnRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{data.topReturnReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
