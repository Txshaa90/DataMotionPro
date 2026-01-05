'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Column {
  id: string
  name: string
  type: string
}

interface Sheet {
  id: string
  name: string
  type: string
  rows: any[]
}

interface ProfitabilityReportProps {
  columns: Column[]
  rows: any[]
  sheets?: Sheet[]
}

interface ReportRow {
  label: string
  ytd: number
  lastMonth: number
  mtd: number
  thisWeek: number
  lastWeek: number
  indent?: number
  isBold?: boolean
  isHeader?: boolean
}

export default function ProfitabilityReport({ columns, rows, sheets }: ProfitabilityReportProps) {
  const [sourceSheetId, setSourceSheetId] = useState<string>('')
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())

  // Get data from selected sheet or use current rows
  const displayRows = useMemo(() => {
    if (sourceSheetId && sheets) {
      const selectedSheet = sheets.find(s => s.id === sourceSheetId)
      return selectedSheet?.rows || []
    }
    return rows
  }, [sourceSheetId, sheets, rows])

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = asOfDate
    const currentYear = now.getFullYear()
    
    // Year to Date
    const ytdStart = new Date(currentYear, 0, 1)
    const ytdEnd = now
    
    // Last Month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Month to Date
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mtdEnd = now
    
    // This Week (Monday start)
    const thisWeekStart = new Date(now)
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    thisWeekStart.setDate(now.getDate() + diff)
    thisWeekStart.setHours(0, 0, 0, 0)
    const thisWeekEnd = now
    
    // Last Week
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1)
    lastWeekEnd.setHours(23, 59, 59, 999)
    
    return {
      ytd: { start: ytdStart, end: ytdEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      mtd: { start: mtdStart, end: mtdEnd },
      thisWeek: { start: thisWeekStart, end: thisWeekEnd },
      lastWeek: { start: lastWeekStart, end: lastWeekEnd }
    }
  }, [asOfDate])

  // Filter rows by date range
  const filterByDateRange = (rows: any[], start: Date, end: Date) => {
    return rows.filter(row => {
      const dateValue = row['date/time'] || row['Date'] || row['date']
      if (!dateValue) return false
      
      const rowDate = new Date(dateValue)
      return rowDate >= start && rowDate <= end
    })
  }

  // Calculate metrics for each time period
  const calculateMetrics = useMemo(() => {
    const metrics = {
      ytd: { sales: {}, returns: {}, fees: {}, purchases: {} },
      lastMonth: { sales: {}, returns: {}, fees: {}, purchases: {} },
      mtd: { sales: {}, returns: {}, fees: {}, purchases: {} },
      thisWeek: { sales: {}, returns: {}, fees: {}, purchases: {} },
      lastWeek: { sales: {}, returns: {}, fees: {}, purchases: {} }
    }

    Object.keys(dateRanges).forEach(periodKey => {
      const period = periodKey as keyof typeof dateRanges
      const range = dateRanges[period]
      const filteredRows = filterByDateRange(displayRows, range.start, range.end)

      const channelSales: { [key: string]: number } = {}
      const channelReturns: { [key: string]: number } = {}
      const feeTypes: { [key: string]: number } = {}
      const channelPurchases: { [key: string]: number } = {}

      filteredRows.forEach(row => {
        const vendor = row['Vendor'] || 'Unknown'
        const type = row['type'] || ''
        const itemMargin = parseFloat(row['Item Margin']) || 0
        const sellingFees = parseFloat(row['selling fees']) || 0
        const fbaFees = parseFloat(row['fba fees']) || 0
        const otherFees = parseFloat(row['other transaction fees']) || 0
        const productSales = parseFloat(row['product sales']) || 0
        const itemCost = parseFloat(row['Item Cost']) || 0
        const returnedItemCost = parseFloat(row['Returned Item Cost']) || 0
        const costToReturn = parseFloat(row['Cost to Return']) || 0

        // Sales (Item Margin = profit from sales)
        if (type === 'Order' && itemMargin !== 0) {
          channelSales[vendor] = (channelSales[vendor] || 0) + itemMargin
        }

        // Returns
        if (returnedItemCost !== 0 || costToReturn !== 0) {
          const returnAmount = -(returnedItemCost + costToReturn)
          channelReturns[vendor] = (channelReturns[vendor] || 0) + returnAmount
        }

        // Fees
        if (sellingFees !== 0) {
          feeTypes['Service Fee'] = (feeTypes['Service Fee'] || 0) + sellingFees
        }
        if (fbaFees !== 0) {
          feeTypes['FBA Inventory Fee'] = (feeTypes['FBA Inventory Fee'] || 0) + fbaFees
        }
        if (otherFees !== 0) {
          // Categorize other fees
          if (row['description']?.includes('Shipping')) {
            feeTypes['Shipping Services'] = (feeTypes['Shipping Services'] || 0) + otherFees
          } else {
            feeTypes['Other Fees'] = (feeTypes['Other Fees'] || 0) + otherFees
          }
        }

        // Purchases
        if (type === 'Order' && itemCost !== 0) {
          channelPurchases[vendor] = (channelPurchases[vendor] || 0) + itemCost
        }
      })

      metrics[period] = {
        sales: channelSales,
        returns: channelReturns,
        fees: feeTypes,
        purchases: channelPurchases
      }
    })

    return metrics
  }, [displayRows, dateRanges])

  // Build report sections
  const reportData = useMemo(() => {
    const netMargins: ReportRow[] = []
    const returns: ReportRow[] = []
    const fees: ReportRow[] = []
    const purchases: ReportRow[] = []
    const sales: ReportRow[] = []

    // Get all unique channels
    const allChannels = new Set<string>()
    Object.values(calculateMetrics).forEach(period => {
      Object.keys(period.sales).forEach(ch => allChannels.add(ch))
    })
    const channels = Array.from(allChannels).sort()

    // NET MARGINS SECTION
    // Calculate totals for each period
    const totalSalesByPeriod = {
      ytd: Object.values(calculateMetrics.ytd.sales).reduce((sum, val) => sum + val, 0),
      lastMonth: Object.values(calculateMetrics.lastMonth.sales).reduce((sum, val) => sum + val, 0),
      mtd: Object.values(calculateMetrics.mtd.sales).reduce((sum, val) => sum + val, 0),
      thisWeek: Object.values(calculateMetrics.thisWeek.sales).reduce((sum, val) => sum + val, 0),
      lastWeek: Object.values(calculateMetrics.lastWeek.sales).reduce((sum, val) => sum + val, 0)
    }

    const totalReturnsByPeriod = {
      ytd: Object.values(calculateMetrics.ytd.returns).reduce((sum, val) => sum + val, 0),
      lastMonth: Object.values(calculateMetrics.lastMonth.returns).reduce((sum, val) => sum + val, 0),
      mtd: Object.values(calculateMetrics.mtd.returns).reduce((sum, val) => sum + val, 0),
      thisWeek: Object.values(calculateMetrics.thisWeek.returns).reduce((sum, val) => sum + val, 0),
      lastWeek: Object.values(calculateMetrics.lastWeek.returns).reduce((sum, val) => sum + val, 0)
    }

    const totalFeesByPeriod = {
      ytd: Object.values(calculateMetrics.ytd.fees).reduce((sum, val) => sum + val, 0),
      lastMonth: Object.values(calculateMetrics.lastMonth.fees).reduce((sum, val) => sum + val, 0),
      mtd: Object.values(calculateMetrics.mtd.fees).reduce((sum, val) => sum + val, 0),
      thisWeek: Object.values(calculateMetrics.thisWeek.fees).reduce((sum, val) => sum + val, 0),
      lastWeek: Object.values(calculateMetrics.lastWeek.fees).reduce((sum, val) => sum + val, 0)
    }

    // 20% Projection
    netMargins.push({
      label: '20% Projection',
      ytd: totalSalesByPeriod.ytd * 0.20,
      lastMonth: totalSalesByPeriod.lastMonth * 0.20,
      mtd: totalSalesByPeriod.mtd * 0.20,
      thisWeek: totalSalesByPeriod.thisWeek * 0.20,
      lastWeek: totalSalesByPeriod.lastWeek * 0.20
    })

    // Net Profit (Total)
    netMargins.push({
      label: "Net Profit Al's Supply",
      ytd: totalSalesByPeriod.ytd + totalReturnsByPeriod.ytd + totalFeesByPeriod.ytd,
      lastMonth: totalSalesByPeriod.lastMonth + totalReturnsByPeriod.lastMonth + totalFeesByPeriod.lastMonth,
      mtd: totalSalesByPeriod.mtd + totalReturnsByPeriod.mtd + totalFeesByPeriod.mtd,
      thisWeek: totalSalesByPeriod.thisWeek + totalReturnsByPeriod.thisWeek + totalFeesByPeriod.thisWeek,
      lastWeek: totalSalesByPeriod.lastWeek + totalReturnsByPeriod.lastWeek + totalFeesByPeriod.lastWeek,
      isBold: true
    })

    // Item Profit vs Returned Items
    netMargins.push({
      label: 'Item Profit Vs. Returned Items',
      ytd: totalSalesByPeriod.ytd + totalReturnsByPeriod.ytd,
      lastMonth: totalSalesByPeriod.lastMonth + totalReturnsByPeriod.lastMonth,
      mtd: totalSalesByPeriod.mtd + totalReturnsByPeriod.mtd,
      thisWeek: totalSalesByPeriod.thisWeek + totalReturnsByPeriod.thisWeek,
      lastWeek: totalSalesByPeriod.lastWeek + totalReturnsByPeriod.lastWeek
    })

    // Al's Supply Item Sales Profit
    netMargins.push({
      label: "Al's Supply Item Sales Profit",
      ytd: totalSalesByPeriod.ytd,
      lastMonth: totalSalesByPeriod.lastMonth,
      mtd: totalSalesByPeriod.mtd,
      thisWeek: totalSalesByPeriod.thisWeek,
      lastWeek: totalSalesByPeriod.lastWeek
    })

    // By channel
    channels.forEach(channel => {
      netMargins.push({
        label: channel,
        ytd: calculateMetrics.ytd.sales[channel] || 0,
        lastMonth: calculateMetrics.lastMonth.sales[channel] || 0,
        mtd: calculateMetrics.mtd.sales[channel] || 0,
        thisWeek: calculateMetrics.thisWeek.sales[channel] || 0,
        lastWeek: calculateMetrics.lastWeek.sales[channel] || 0,
        indent: 1
      })
    })

    // RETURNS SECTION
    returns.push({
      label: 'Returns',
      ytd: totalReturnsByPeriod.ytd,
      lastMonth: totalReturnsByPeriod.lastMonth,
      mtd: totalReturnsByPeriod.mtd,
      thisWeek: totalReturnsByPeriod.thisWeek,
      lastWeek: totalReturnsByPeriod.lastWeek,
      isBold: true
    })

    channels.forEach(channel => {
      const ytdVal = calculateMetrics.ytd.returns[channel] || 0
      const lmVal = calculateMetrics.lastMonth.returns[channel] || 0
      const mtdVal = calculateMetrics.mtd.returns[channel] || 0
      const twVal = calculateMetrics.thisWeek.returns[channel] || 0
      const lwVal = calculateMetrics.lastWeek.returns[channel] || 0

      if (ytdVal !== 0 || lmVal !== 0 || mtdVal !== 0 || twVal !== 0 || lwVal !== 0) {
        returns.push({
          label: channel,
          ytd: ytdVal,
          lastMonth: lmVal,
          mtd: mtdVal,
          thisWeek: twVal,
          lastWeek: lwVal,
          indent: 1
        })
      }
    })

    // FEES SECTION
    fees.push({
      label: 'Other Fees',
      ytd: totalFeesByPeriod.ytd,
      lastMonth: totalFeesByPeriod.lastMonth,
      mtd: totalFeesByPeriod.mtd,
      thisWeek: totalFeesByPeriod.thisWeek,
      lastWeek: totalFeesByPeriod.lastWeek,
      isBold: true
    })

    const allFeeTypes = new Set<string>()
    Object.values(calculateMetrics).forEach(period => {
      Object.keys(period.fees).forEach(ft => allFeeTypes.add(ft))
    })

    Array.from(allFeeTypes).sort().forEach(feeType => {
      fees.push({
        label: feeType,
        ytd: calculateMetrics.ytd.fees[feeType] || 0,
        lastMonth: calculateMetrics.lastMonth.fees[feeType] || 0,
        mtd: calculateMetrics.mtd.fees[feeType] || 0,
        thisWeek: calculateMetrics.thisWeek.fees[feeType] || 0,
        lastWeek: calculateMetrics.lastWeek.fees[feeType] || 0,
        indent: 1
      })
    })

    // PURCHASES SECTION
    const totalPurchasesByPeriod = {
      ytd: Object.values(calculateMetrics.ytd.purchases).reduce((sum, val) => sum + val, 0),
      lastMonth: Object.values(calculateMetrics.lastMonth.purchases).reduce((sum, val) => sum + val, 0),
      mtd: Object.values(calculateMetrics.mtd.purchases).reduce((sum, val) => sum + val, 0),
      thisWeek: Object.values(calculateMetrics.thisWeek.purchases).reduce((sum, val) => sum + val, 0),
      lastWeek: Object.values(calculateMetrics.lastWeek.purchases).reduce((sum, val) => sum + val, 0)
    }

    channels.forEach(channel => {
      const ytdVal = calculateMetrics.ytd.purchases[channel] || 0
      const lmVal = calculateMetrics.lastMonth.purchases[channel] || 0
      const mtdVal = calculateMetrics.mtd.purchases[channel] || 0
      const twVal = calculateMetrics.thisWeek.purchases[channel] || 0
      const lwVal = calculateMetrics.lastWeek.purchases[channel] || 0

      if (ytdVal !== 0 || lmVal !== 0 || mtdVal !== 0 || twVal !== 0 || lwVal !== 0) {
        purchases.push({
          label: channel,
          ytd: ytdVal,
          lastMonth: lmVal,
          mtd: mtdVal,
          thisWeek: twVal,
          lastWeek: lwVal
        })
      }
    })

    // SALES SECTION
    sales.push({
      label: 'All Vendors',
      ytd: totalSalesByPeriod.ytd,
      lastMonth: totalSalesByPeriod.lastMonth,
      mtd: totalSalesByPeriod.mtd,
      thisWeek: totalSalesByPeriod.thisWeek,
      lastWeek: totalSalesByPeriod.lastWeek,
      isBold: true
    })

    channels.forEach(channel => {
      sales.push({
        label: channel,
        ytd: calculateMetrics.ytd.sales[channel] || 0,
        lastMonth: calculateMetrics.lastMonth.sales[channel] || 0,
        mtd: calculateMetrics.mtd.sales[channel] || 0,
        thisWeek: calculateMetrics.thisWeek.sales[channel] || 0,
        lastWeek: calculateMetrics.lastWeek.sales[channel] || 0,
        indent: 1
      })
    })

    return { netMargins, returns, fees, purchases, sales }
  }, [calculateMetrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const renderSection = (title: string, rows: ReportRow[], icon: React.ReactNode) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={`border-b border-gray-200 dark:border-gray-700 ${row.isBold ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <td className={`py-2 px-4 ${row.isBold ? 'font-bold' : ''} ${row.indent ? `pl-${4 + row.indent * 4}` : ''}`}>
                  {row.label}
                </td>
                <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.ytd < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {formatCurrency(row.ytd)}
                </td>
                <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.lastMonth < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {formatCurrency(row.lastMonth)}
                </td>
                <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.mtd < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {formatCurrency(row.mtd)}
                </td>
                <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.thisWeek < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {formatCurrency(row.thisWeek)}
                </td>
                <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.lastWeek < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {formatCurrency(row.lastWeek)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const lastMonthName = new Date(dateRanges.lastMonth.start).toLocaleString('default', { month: 'long' })
  const currentMonthName = new Date(dateRanges.mtd.start).toLocaleString('default', { month: 'long' })
  const thisWeekDate = dateRanges.thisWeek.start.toLocaleDateString()
  const lastWeekDate = dateRanges.lastWeek.start.toLocaleDateString()

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Year to Date Profitability Report</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">As of {asOfDate.toLocaleDateString()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAsOfDate(new Date())}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Data Source Selection */}
        {sheets && sheets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Source:</span>
            <Select value={sourceSheetId} onValueChange={setSourceSheetId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select sheet..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Current Sheet</SelectItem>
                {sheets.filter(s => s.type === 'grid').map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left font-bold text-gray-900 dark:text-gray-100"></th>
              <th className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                <div>Year to Date</div>
                <div className="text-xs font-normal text-gray-500">{new Date().getFullYear()}</div>
              </th>
              <th className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                <div>Last Month</div>
                <div className="text-xs font-normal text-gray-500">{lastMonthName}</div>
              </th>
              <th className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                <div>Month to Date</div>
                <div className="text-xs font-normal text-gray-500">{currentMonthName}</div>
              </th>
              <th className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                <div>This Week</div>
                <div className="text-xs font-normal text-gray-500">{thisWeekDate}</div>
              </th>
              <th className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                <div>Last Week</div>
                <div className="text-xs font-normal text-gray-500">{lastWeekDate}</div>
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-auto p-6">
        {displayRows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm mt-2">Import transaction data to generate the profitability report</p>
            </div>
          </div>
        ) : (
          <>
            {renderSection('Net Margins', reportData.netMargins, <TrendingUp className="h-5 w-5 text-green-600" />)}
            {renderSection('Returns', reportData.returns, <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />)}
            {renderSection('Other Fees', reportData.fees, <Calendar className="h-5 w-5 text-orange-600" />)}
            
            <div className="my-8 border-t-2 border-gray-300 dark:border-gray-600"></div>
            
            {renderSection('Purchase Reconciliations', reportData.purchases, <Calendar className="h-5 w-5 text-blue-600" />)}
            {renderSection('Sales', reportData.sales, <TrendingUp className="h-5 w-5 text-green-600" />)}
          </>
        )}
      </div>
    </div>
  )
}
