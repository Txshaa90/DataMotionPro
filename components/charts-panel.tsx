'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  X,
  Settings
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Column {
  id: string
  name: string
  type: string
}

interface ChartsPanelProps {
  columns: Column[]
  rows: any[]
}

type ChartType = 'bar' | 'line' | 'pie'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

export default function ChartsPanel({ columns, rows }: ChartsPanelProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [xAxisField, setXAxisField] = useState<string>('')
  const [yAxisField, setYAxisField] = useState<string>('')
  const [aggregation, setAggregation] = useState<'count' | 'sum' | 'avg'>('count')

  // Get numeric columns for Y-axis
  const numericColumns = columns.filter(col => col.type === 'number')
  
  // Get all columns for X-axis (categorical)
  const categoricalColumns = columns.filter(col => col.type === 'text' || col.type === 'select')

  // Process data for charts
  const getChartData = () => {
    if (!xAxisField) return []

    // Group data by X-axis field
    const grouped = rows.reduce((acc, row) => {
      const key = String(row[xAxisField] || 'Unknown')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(row)
      return acc
    }, {} as Record<string, any[]>)

    // Calculate aggregation
    return Object.entries(grouped).map(([key, items]) => {
      const itemsArray = items as any[]
      let value = 0
      
      if (aggregation === 'count') {
        value = itemsArray.length
      } else if (yAxisField) {
        const values = itemsArray
          .map((item: any) => Number(item[yAxisField]))
          .filter((v: number) => !isNaN(v))
        
        if (aggregation === 'sum') {
          value = values.reduce((sum, v) => sum + v, 0)
        } else if (aggregation === 'avg') {
          value = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
        }
      }

      return {
        name: key,
        value: Math.round(value * 100) / 100
      }
    }).sort((a, b) => b.value - a.value).slice(0, 10) // Top 10
  }

  const chartData = getChartData()

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Select fields to generate a chart
        </div>
      )
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name={aggregation === 'count' ? 'Count' : yAxisField} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" name={aggregation === 'count' ? 'Count' : yAxisField} />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Charts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Visualization</DialogTitle>
          <DialogDescription>
            Create charts and graphs from your dataset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chart Type Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Chart Type:</span>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Bar
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                <LineChartIcon className="h-4 w-4 mr-1" />
                Line
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
              >
                <PieChartIcon className="h-4 w-4 mr-1" />
                Pie
              </Button>
            </div>
          </div>

          {/* Field Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">X-Axis (Category)</label>
              <Select value={xAxisField} onValueChange={setXAxisField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aggregation</label>
              <Select value={aggregation} onValueChange={(v) => setAggregation(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aggregation !== 'count' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Y-Axis (Value)</label>
                <Select value={yAxisField} onValueChange={setYAxisField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select numeric field" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Chart Display */}
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
            {renderChart()}
          </div>

          {/* Stats */}
          {chartData.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing top {chartData.length} categories from {rows.length} total rows
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
