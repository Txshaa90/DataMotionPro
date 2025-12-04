'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Type,
  Hash,
  BarChart3,
  LineChart,
  PieChart,
  Donut,
  Globe,
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Eraser,
  Download,
  Undo,
} from 'lucide-react'
import Link from 'next/link'

interface Widget {
  id: string
  type: 'text' | 'number' | 'bar' | 'line' | 'pie' | 'donut' | 'iframe'
  title: string
  content?: any
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

export default function DashboardBuilder() {
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard')
  const [isEditingName, setIsEditingName] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])

  const widgetTypes = [
    { type: 'text' as const, icon: Type, label: 'Text' },
    { type: 'number' as const, icon: Hash, label: 'Number' },
    { type: 'bar' as const, icon: BarChart3, label: 'Bar Chart' },
    { type: 'line' as const, icon: LineChart, label: 'Line Chart' },
    { type: 'pie' as const, icon: PieChart, label: 'Pie Chart' },
    { type: 'donut' as const, icon: Donut, label: 'Donut' },
    { type: 'iframe' as const, icon: Globe, label: 'iFrame' },
  ]

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    }
    setWidgets([...widgets, newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id))
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          
          {isEditingName ? (
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="w-64 h-8"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:text-primary"
              onClick={() => setIsEditingName(true)}
            >
              {dashboardName}
            </h1>
          )}
          
          <span className="text-sm text-blue-600 dark:text-blue-400">
            You are now editing this dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Finish
          </Button>
          <Button size="sm">
            Share
          </Button>
        </div>
      </div>

      {/* Widget Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3">
        <div className="flex items-center gap-2">
          {widgetTypes.map((widget) => (
            <Button
              key={widget.type}
              variant="ghost"
              size="sm"
              onClick={() => addWidget(widget.type)}
              className="flex items-center gap-2"
            >
              <widget.icon className="h-4 w-4" />
              {widget.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Canvas - Whiteboard Style */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <div className="min-h-full min-w-full bg-white dark:bg-gray-900 relative">
          {/* Grid Pattern Background */}
          <div 
            className="absolute inset-0 opacity-20 dark:opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Widgets Container */}
          <div className="relative p-6">
            {widgets.length === 0 ? (
              <div className="h-[calc(100vh-250px)] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <Plus className="h-16 w-16 mx-auto mb-2" />
                    <p className="text-lg font-medium">Add widgets to your whiteboard</p>
                    <p className="text-sm">Click on any widget type above to add it to your canvas</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {widgets.map((widget) => {
                  const WidgetIcon = widgetTypes.find(w => w.type === widget.type)?.icon || Type
                  return (
                    <div
                      key={widget.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 min-h-[200px] relative group shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          <WidgetIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm">{widget.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <WidgetIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Configure {widget.type}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
