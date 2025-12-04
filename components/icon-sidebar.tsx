'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface IconSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  datasetName?: string
  onAddSheet?: (viewType?: 'grid' | 'chart' | 'returns' | 'dashboard') => void
  onShare?: () => void
}

export function IconSidebar({ isExpanded, onToggle, datasetName, onAddSheet, onShare }: IconSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', onClick: undefined },
    { icon: Database, label: 'Datasets', href: '/dashboard', onClick: undefined },
    { icon: Calculator, label: 'Analytics', href: '#', onClick: undefined },
    { icon: Share2, label: 'Share', href: '#', onClick: onShare },
    { icon: Bell, label: 'Notifications', href: '#', onClick: undefined },
  ]

  return (
    <div 
      className={`relative bg-primary dark:bg-primary flex flex-col transition-all duration-300 flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
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
                className="w-full justify-between bg-green-600 hover:bg-green-700 text-white rounded-lg"
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
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
            title="Create New"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4 space-y-1">
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
  )
}
