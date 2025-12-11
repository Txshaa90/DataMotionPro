'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Database,
  Home,
  Settings,
  Bell,
  Share2,
  Calculator,
  RefreshCw,
  Wifi,
  Cloud,
  Users,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Plus,
  Table,
  LayoutDashboard,
  ChevronDown,
  Palette,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface IconSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  datasetName?: string
  onAddSheet?: (viewType?: 'grid' | 'chart' | 'returns' | 'dashboard') => void
  onShare?: () => void
  sheets?: any[]
  activeSheetId?: string
  onSheetSelect?: (sheetId: string) => void
  onSheetRename?: (sheetId: string, newName: string) => void
}

export function IconSidebar({ isExpanded, onToggle, datasetName, onAddSheet, onShare, sheets, activeSheetId, onSheetSelect, onSheetRename }: IconSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [sidebarColor, setSidebarColor] = useState('#22c55e') // Default green
  
  // Load saved color from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('datamotionpro-sidebar-color')
    if (savedColor) {
      setSidebarColor(savedColor)
    }
  }, [])
  
  // Save color to localStorage when it changes
  const handleColorChange = (color: string) => {
    setSidebarColor(color)
    localStorage.setItem('datamotionpro-sidebar-color', color)
  }
  
  const presetColors = [
    { name: 'Green', color: '#22c55e' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Indigo', color: '#6366f1' },
  ]
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', onClick: undefined },
    { icon: Database, label: 'Datasets', href: '/dashboard', onClick: undefined },
    { icon: Calculator, label: 'Analytics', href: '#', onClick: undefined },
    { icon: Share2, label: 'Share', href: '#', onClick: onShare },
    { icon: Bell, label: 'Notifications', href: '#', onClick: undefined },
  ]

  return (
    <>
    <div 
      className={`relative flex flex-col transition-all duration-300 flex-shrink-0 h-screen ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      style={{ backgroundColor: sidebarColor }}
    >
      {/* Dataset Title (when expanded) */}
      {isExpanded && datasetName && (
        <div className="p-4 border-b border-primary-foreground/20">
          <h2 className="font-semibold text-lg text-primary-foreground truncate">
            {datasetName}
          </h2>
        </div>
      )}

      {/* Create New Button - Under Title */}
      <div className="p-3">
        {isExpanded ? (
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full justify-between bg-white/10 hover:bg-white/20 text-primary-foreground rounded-lg border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create New</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
                  <Table className="h-4 w-4" />
                  <span>Table</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onAddSheet?.('dashboard'); setCreateMenuOpen(false); }}>
                <LayoutDashboard className="h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Dashboard</span>
                  <span className="text-xs text-blue-500 font-medium">Beta</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="icon"
            className="w-full bg-white/10 hover:bg-white/20 text-primary-foreground rounded-lg border border-white/20"
            title="Create New"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/30" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
        {menuItems.map((item, index) => {
          const content = (
            <button
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
          
          return item.onClick ? (
            <div key={index}>{content}</div>
          ) : (
            <Link key={index} href={item.href}>
              {content}
            </Link>
          )
        })}
        
        {/* Divider */}
        {onAddSheet && (
          <div className="border-t border-primary-foreground/20 my-2" />
        )}
        
        {/* Add Chart View */}
        {onAddSheet && (
          <button
            onClick={() => onAddSheet('chart')}
            className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            title={!isExpanded ? 'Add Chart View' : undefined}
          >
            <Calculator className="h-5 w-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">Add Chart View</span>
            )}
          </button>
        )}
        
        {/* Add Returns Analysis */}
        {onAddSheet && (
          <button
            onClick={() => onAddSheet('returns')}
            className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            title={!isExpanded ? 'Add Returns Analysis' : undefined}
          >
            <RefreshCw className="h-5 w-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">Add Returns Analysis</span>
            )}
          </button>
        )}
      </div>

      {/* Theme Toggle & Settings */}
      <div className="p-2 border-t border-primary-foreground/20 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors rounded"
          title={!isExpanded ? 'Toggle Theme' : undefined}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Moon className="h-5 w-5 flex-shrink-0" />
          )}
          {isExpanded && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
        
        {/* Sidebar Color */}
        <button
          onClick={() => setColorDialogOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors rounded"
          title={!isExpanded ? 'Sidebar Color' : undefined}
        >
          <Palette className="h-5 w-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium">Sidebar Color</span>
          )}
        </button>
        
        {/* Settings */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-primary-foreground/10 transition-colors rounded"
          title={!isExpanded ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </button>
      </div>

      {/* Toggle Button - Chevron at bottom */}
      <div className="p-2 border-t border-primary-foreground/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-full text-primary-foreground hover:bg-primary-foreground/10"
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>

    {/* Color Picker Dialog */}
    <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Sidebar Color</DialogTitle>
          <DialogDescription>
            Choose a color for your sidebar. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Preset Colors */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preset Colors</Label>
            <div className="grid grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => handleColorChange(preset.color)}
                  className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    sidebarColor === preset.color ? 'border-gray-900 dark:border-white ring-2 ring-offset-2' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <Label htmlFor="custom-color" className="text-sm font-medium mb-3 block">
              Custom Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="custom-color"
                type="color"
                value={sidebarColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-12 w-20 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={sidebarColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="#22c55e"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preview</Label>
            <div 
              className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: sidebarColor }}
            >
              Sidebar Preview
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleColorChange('#22c55e')}
          >
            Reset to Default
          </Button>
          <Button onClick={() => setColorDialogOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
