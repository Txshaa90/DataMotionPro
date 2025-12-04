'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

interface Widget {
  id: string
  type: 'text' | 'number' | 'bar' | 'line' | 'pie' | 'donut' | 'iframe'
  title: string
  content?: any
}

interface DashboardViewProps {
  widgets?: Widget[]
  onWidgetsChange?: (widgets: Widget[]) => void
}

export default function DashboardView({ widgets: initialWidgets = [], onWidgetsChange }: DashboardViewProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)

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
    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    onWidgetsChange?.(updatedWidgets)
  }

  const removeWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id)
    setWidgets(updatedWidgets)
    onWidgetsChange?.(updatedWidgets)
  }

  return (
    <div className="h-full flex flex-col">
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
            className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
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
              <div className="h-[calc(100vh-300px)] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <Plus className="h-16 w-16 mx-auto mb-2" />
                    <p className="text-lg font-medium">Add widgets to your dashboard</p>
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
