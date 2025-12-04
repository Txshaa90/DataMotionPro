'use client'

import { Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FolderCardProps {
  folder: {
    id: string
    name: string
    color?: string
    createdAt: string
  }
  tableCount: number
  onClick?: () => void
  onRename?: () => void
  onDelete?: () => void
}

export function FolderCard({
  folder,
  tableCount,
  onClick,
  onRename,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      className="group relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Folder Icon */}
      <div className="mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: folder.color || '#10b981' }}
        >
          <Folder className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Folder Name */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 truncate pr-8">
        {folder.name}
      </h3>

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {tableCount} {tableCount === 1 ? 'item' : 'items'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          folder
        </span>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      {/* Actions Menu */}
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename?.()
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
