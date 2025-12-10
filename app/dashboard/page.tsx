'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  Plus,
  Search,
  Settings,
  FolderPlus,
  Grid3x3,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  LayoutGrid,
  List,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useTableStore } from '@/store/useTableStore'
import { useViewStore } from '@/store/useViewStore'
import { ThemeToggle } from '@/components/theme-toggle'
import { FolderCard } from '@/components/folder-card'
import { DatasetCard } from '@/components/dataset-card'
import { supabase } from '@/lib/supabase'

type SupabaseFolder = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

type SupabaseTable = {
  id: string
  user_id: string
  folder_id: string | null
  name: string
  columns: any[]
  rows: any[]
  created_at: string
  updated_at: string
}

type SharedFolder = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

const FOLDER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
]

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value)
  const [newTableName, setNewTableName] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingItem, setRenamingItem] = useState<{ type: 'folder' | 'table'; id: string; name: string } | null>(null)
  const [moveToFolderDialog, setMoveToFolderDialog] = useState(false)
  const [movingTableId, setMovingTableId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<'root' | string>('root') // 'root' or folderId
  const [activeTab, setActiveTab] = useState<'my-workspace' | 'shared'>('my-workspace')
  
  // Supabase data
  const [supabaseFolders, setSupabaseFolders] = useState<SupabaseFolder[]>([])
  const [supabaseTables, setSupabaseTables] = useState<SupabaseTable[]>([])
  const [sharedTables, setSharedTables] = useState<SupabaseTable[]>([])
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([])
  const [sharedFolderItems, setSharedFolderItems] = useState<Map<string, string>>(new Map()) // tableId -> folderId
  const [loading, setLoading] = useState(true)
  const [showSharedFolderDialog, setShowSharedFolderDialog] = useState(false)
  const [newSharedFolderName, setNewSharedFolderName] = useState('')
  const [currentSharedPath, setCurrentSharedPath] = useState<'root' | string>('root')

  const {
    tables,
    folders,
    addTable,
    deleteTable,
    updateTable,
    addFolder,
    deleteFolder,
    updateFolder,
    getFolderTables,
    moveTableToFolder,
  } = useTableStore()

  const { views } = useViewStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        console.log('🔍 Current logged in user:', { id: user?.id, email: user?.email })
        
        if (!user) {
          console.log('No user logged in')
          setLoading(false)
          return
        }
        
        const userId = user.id
        const userEmail = user.email

        // Fetch folders
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (foldersError) throw foldersError

        // Fetch tables owned by user
        const { data: tablesData, error: tablesError } = await supabase
          .from('tables')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (tablesError) throw tablesError

        // Fetch tables shared with user
        let sharedData: SupabaseTable[] = []
        if (userEmail) {
          console.log('🔍 Fetching shares for email:', userEmail)
          const { data: sharesData, error: sharesError } = await supabase
            .from('table_shares')
            .select('table_id, permission')
            .eq('shared_with_email', userEmail)

          console.log('🔍 Shares query result:', { sharesData, sharesError })
          
          if (sharesError) {
            console.error('❌ Error fetching shares:', sharesError.message, sharesError.code, sharesError.details)
          }

          if (!sharesError && sharesData && sharesData.length > 0) {
            const sharedTableIds = sharesData.map((share: any) => share.table_id)
            if (sharedTableIds.length > 0) {
              const { data: sharedTablesData, error: sharedTablesError } = await supabase
                .from('tables')
                .select('*')
                .in('id', sharedTableIds)

              if (!sharedTablesError) {
                sharedData = sharedTablesData || []
              }
            }
          }
        } else {
          console.log('No user email found - user not logged in')
        }

        // Fetch shared folders (personal organization)
        const { data: sharedFoldersData, error: sharedFoldersError } = await supabase
          .from('shared_folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (sharedFoldersError) console.error('Error fetching shared folders:', sharedFoldersError)

        // Fetch shared folder items (which datasets are in which folders)
        const { data: sharedFolderItemsData, error: sharedFolderItemsError } = await supabase
          .from('shared_folder_items')
          .select('table_id, folder_id')
          .eq('user_id', userId)

        if (sharedFolderItemsError) console.error('Error fetching shared folder items:', sharedFolderItemsError)

        // Create map of table_id -> folder_id
        const folderItemsMap = new Map<string, string>()
        if (sharedFolderItemsData) {
          sharedFolderItemsData.forEach((item: any) => {
            folderItemsMap.set(item.table_id, item.folder_id)
          })
        }

        setSupabaseFolders(foldersData || [])
        setSupabaseTables(tablesData || [])
        setSharedTables(sharedData)
        setSharedFolders(sharedFoldersData || [])
        setSharedFolderItems(folderItemsMap)
        
        console.log('Final shared tables count:', sharedData.length)
        console.log('Shared tables:', sharedData)
        
        // Auto-expand all folders
        if (foldersData && foldersData.length > 0) {
          const allFolderIds = new Set(foldersData.map((f: SupabaseFolder) => f.id))
          setExpandedFolders(allFolderIds)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchData()
    }
  }, [mounted])

  useEffect(() => {
    // Auto-expand all folders when folders are loaded (for local store)
    if (mounted && folders.length > 0) {
      const allFolderIds = new Set(folders.map(f => f.id))
      setExpandedFolders(allFolderIds)
    }
  }, [mounted, folders])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Database className="h-16 w-16 opacity-20 animate-pulse" />
      </div>
    )
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Create in Supabase
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: newFolderName,
          color: newFolderColor
        } as any)
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      setSupabaseFolders([data, ...supabaseFolders])
      
      setNewFolderName('')
      setNewFolderColor(FOLDER_COLORS[0].value)
      setShowFolderDialog(false)
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
  }

  const handleCreateTable = async () => {
    if (!newTableName.trim()) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const userId = user.id
      // Create in Supabase
      const { data, error } = await supabase
        .from('tables')
        .insert({
          user_id: userId,
          folder_id: selectedFolderId,
          name: newTableName,
          columns: [],
          rows: []
        } as any)
        .select()
        .single()
      
      if (error) throw error
      
      // Type assertion for data
      const newTable = data as any
      
      // Update local state
      setSupabaseTables([...supabaseTables, newTable])
      
      // Create default views for the new table (Grid View and Chart View)
      const defaultViews = [
        {
          user_id: userId,
          table_id: newTable.id,
          name: 'Grid View',
          type: 'grid',
          visible_columns: [],
          filters: [],
          sorts: [],
          color_rules: [],
          group_by: null,
          rows: []
        },
        {
          user_id: userId,
          table_id: newTable.id,
          name: 'Chart View',
          type: 'chart',
          visible_columns: [],
          filters: [],
          sorts: [],
          color_rules: [],
          group_by: null,
          rows: [],
          chart_config: {
            chartType: 'bar',
            xAxisField: '',
            yAxisField: '',
            aggregation: 'count'
          }
        }
      ]
      
      const { error: viewError } = await supabase
        .from('views')
        .insert(defaultViews as any)
      
      if (viewError) console.error('Error creating default views:', viewError)
      
      setNewTableName('')
      setSelectedFolderId(null)
      setShowTableDialog(false)
    } catch (error) {
      console.error('Error creating dataset:', error)
      alert('Failed to create dataset')
    }
  }

  const handleRename = async () => {
    if (!renamingItem) return
    
    try {
      if (renamingItem.type === 'folder') {
        // Update in Supabase
        const { error } = await (supabase as any)
          .from('folders')
          .update({ name: renamingItem.name, updated_at: new Date().toISOString() })
          .eq('id', renamingItem.id)
        
        if (error) throw error
        
        // Update local state
        setSupabaseFolders(supabaseFolders.map(f => 
          f.id === renamingItem.id ? { ...f, name: renamingItem.name } : f
        ))
        
        // Update local store
        updateFolder(renamingItem.id, { name: renamingItem.name })
      } else {
        // Update in Supabase
        const { error } = await (supabase as any)
          .from('tables')
          .update({ name: renamingItem.name, updated_at: new Date().toISOString() })
          .eq('id', renamingItem.id)
        
        if (error) throw error
        
        // Update local state
        setSupabaseTables(supabaseTables.map(t => 
          t.id === renamingItem.id ? { ...t, name: renamingItem.name } : t
        ))
        
        // Update local store
        updateTable(renamingItem.id, { name: renamingItem.name })
      }
      
      setRenameDialogOpen(false)
      setRenamingItem(null)
    } catch (error) {
      console.error('Error renaming:', error)
      alert('Failed to rename. Please try again.')
    }
  }

  const handleMoveToFolder = () => {
    if (!movingTableId || selectedFolderId === undefined) return
    moveTableToFolder(movingTableId, selectedFolderId)
    setMoveToFolderDialog(false)
    setMovingTableId(null)
    setSelectedFolderId(null)
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // Shared folder handlers
  const handleCreateSharedFolder = async () => {
    if (!newSharedFolderName.trim()) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('shared_folders')
        .insert({
          user_id: user.id,
          name: newSharedFolderName
        })
        .select()
        .single()
      
      if (error) throw error
      
      setSharedFolders([data, ...sharedFolders])
      setNewSharedFolderName('')
      setShowSharedFolderDialog(false)
    } catch (error) {
      console.error('Error creating shared folder:', error)
      alert('Failed to create folder')
    }
  }

  const handleMoveSharedToFolder = async (tableId: string, folderId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (folderId) {
        // Add to folder
        const { error } = await supabase
          .from('shared_folder_items')
          .upsert({
            folder_id: folderId,
            table_id: tableId,
            user_id: user.id
          })
        
        if (error) throw error
        
        // Update local state
        const newMap = new Map(sharedFolderItems)
        newMap.set(tableId, folderId)
        setSharedFolderItems(newMap)
      } else {
        // Remove from folder
        const { error } = await supabase
          .from('shared_folder_items')
          .delete()
          .eq('table_id', tableId)
          .eq('user_id', user.id)
        
        if (error) throw error
        
        // Update local state
        const newMap = new Map(sharedFolderItems)
        newMap.delete(tableId)
        setSharedFolderItems(newMap)
      }
    } catch (error) {
      console.error('Error moving shared dataset:', error)
      alert('Failed to move dataset')
    }
  }

  const handleDeleteSharedFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('shared_folders')
        .delete()
        .eq('id', folderId)
      
      if (error) throw error
      
      setSharedFolders(sharedFolders.filter(f => f.id !== folderId))
      
      // Remove folder items from map
      const newMap = new Map(sharedFolderItems)
      sharedFolderItems.forEach((folId, tableId) => {
        if (folId === folderId) newMap.delete(tableId)
      })
      setSharedFolderItems(newMap)
    } catch (error) {
      console.error('Error deleting shared folder:', error)
      alert('Failed to delete folder')
    }
  }

  // Supabase-aware delete handlers
  const handleDeleteFolder = async (folderId: string) => {
    if (supabaseFolders.length > 0) {
      // Delete from Supabase
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
      
      if (error) {
        console.error('Error deleting folder:', error)
        alert('Failed to delete folder')
        return
      }
      
      // Update local state
      setSupabaseFolders(supabaseFolders.filter(f => f.id !== folderId))
    } else {
      // Use local store
      deleteFolder(folderId)
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (supabaseTables.length > 0) {
      // Delete from Supabase
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)
      
      if (error) {
        console.error('Error deleting table:', error)
        alert('Failed to delete dataset')
        return
      }
      
      // Update local state
      setSupabaseTables(supabaseTables.filter(t => t.id !== tableId))
    } else {
      // Use local store
      deleteTable(tableId)
    }
  }

  // Use Supabase data if available, otherwise fall back to local store
  // Map Supabase data to match local store format
  const displayFolders = supabaseFolders.length > 0 ? supabaseFolders : folders
  const displayTables = supabaseTables.length > 0 
    ? supabaseTables.map(t => ({
        ...t,
        folderId: t.folder_id,
        updatedAt: t.updated_at,
        createdAt: t.created_at
      }))
    : tables

  // Filter tables and folders based on search
  const filteredFolders = displayFolders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTables = displayTables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get tables not in any folder
  const uncategorizedTables = filteredTables.filter((t) => !(t as any).folder_id && !(t as any).folderId)
  
  // Helper function to get tables for a folder
  const getFolderTablesHelper = (folderId: string) => {
    return filteredTables.filter(t => (t as any).folder_id === folderId || (t as any).folderId === folderId)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search datasets and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        {currentPath !== 'root' && (
          <div className="mb-6">
            <button
              onClick={() => setCurrentPath('root')}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to all folders
            </button>
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setCurrentPath('root')}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                My Workspace
              </button>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-gray-900 dark:text-white font-medium">
                {supabaseFolders.find(f => f.id === currentPath)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('my-workspace')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-workspace'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                My Workspace
                <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {displayTables.length + displayFolders.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'shared'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Shared with Me
                <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {sharedTables.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Page Title and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'shared' 
                ? 'Shared with Me'
                : currentPath === 'root' 
                  ? 'My Workspace' 
                  : supabaseFolders.find(f => f.id === currentPath)?.name || 'Folder'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'shared'
                ? `${sharedTables.length} ${sharedTables.length === 1 ? 'dataset' : 'datasets'} shared with you`
                : currentPath === 'root'
                  ? `${displayTables.length} ${displayTables.length === 1 ? 'dataset' : 'datasets'} · ${displayFolders.length} ${displayFolders.length === 1 ? 'folder' : 'folders'}`
                  : `${getFolderTablesHelper(currentPath).length} ${getFolderTablesHelper(currentPath).length === 1 ? 'dataset' : 'datasets'}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Organize your datasets into folders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Folder Name</label>
                    <Input
                      placeholder="e.g., Projects, Clients, Analytics"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewFolderColor(color.value)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            newFolderColor === color.value
                              ? 'ring-2 ring-offset-2 ring-primary scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateFolder} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Dataset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dataset</DialogTitle>
                  <DialogDescription>
                    Create a new table to organize your data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dataset Name</label>
                    <Input
                      placeholder="e.g., Customer List, Inventory, Tasks"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateTable()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Folder (Optional)</label>
                    <Select
                      value={selectedFolderId || 'none'}
                      onValueChange={(v) => setSelectedFolderId(v === 'none' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Folder</SelectItem>
                        {displayFolders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateTable} className="w-full">
                    Create Dataset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Folders Section - Only show at root in My Workspace */}
        {activeTab === 'my-workspace' && currentPath === 'root' && filteredFolders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FolderPlus className="h-5 w-5 mr-2" />
              Folders
            </h2>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8"
              : "space-y-2 mb-8"
            }>
              {filteredFolders.map((folder) => {
                const folderTables = getFolderTablesHelper(folder.id).filter((table) =>
                  table.name.toLowerCase().includes(searchQuery.toLowerCase())
                )

                return (
                  <FolderCard
                    key={folder.id}
                    folder={{
                      id: folder.id,
                      name: folder.name,
                      color: folder.color,
                      createdAt: (folder as SupabaseFolder).created_at || new Date().toISOString()
                    }}
                    tableCount={folderTables.length}
                    onClick={() => setCurrentPath(folder.id)}
                    onRename={() => {
                      setRenamingItem({ type: 'folder', id: folder.id, name: folder.name })
                      setRenameDialogOpen(true)
                    }}
                    onDelete={() => {
                      if (confirm(`Delete folder "${folder.name}"? Datasets will not be deleted.`)) {
                        handleDeleteFolder(folder.id)
                      }
                    }}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Datasets Section - Show folder contents OR uncategorized datasets (My Workspace only) */}
        {activeTab === 'my-workspace' && (
          <section>
            {currentPath !== 'root' ? (
            // Inside a folder - show folder's datasets
            <>
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-2"
              }>
                {getFolderTablesHelper(currentPath).map((table) => {
                  const tableViews = views.filter((v) => v.tableId === table.id)
                  const colorRulesCount = tableViews.reduce((acc, v) => acc + v.colorRules.length, 0)
                  const filtersCount = tableViews.reduce((acc, v) => acc + v.filters.length, 0)

                  return (
                    <DatasetCard
                      key={table.id}
                      table={table}
                      colorRulesCount={colorRulesCount}
                      filtersCount={filtersCount}
                      viewMode={viewMode}
                      onClick={() => window.open(`/workspace/${table.id}`, '_blank')}
                      onRename={() => {
                        setRenamingItem({ type: 'table', id: table.id, name: table.name })
                        setRenameDialogOpen(true)
                      }}
                      onDelete={() => {
                        if (confirm(`Delete dataset "${table.name}"? This cannot be undone.`)) {
                          handleDeleteTable(table.id)
                        }
                      }}
                      onMoveToFolder={() => {
                        setMovingTableId(table.id)
                        setMoveToFolderDialog(true)
                      }}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            // At root - show uncategorized datasets
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Grid3x3 className="h-5 w-5 mr-2" />
                {uncategorizedTables.length === filteredTables.length ? 'All Datasets' : 'Uncategorized Datasets'}
              </h2>
              {uncategorizedTables.length > 0 ? (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-2"
            }>
              {uncategorizedTables.map((table) => {
                const tableViews = views.filter((v) => v.tableId === table.id)
                const colorRulesCount = tableViews.reduce((acc, v) => acc + v.colorRules.length, 0)
                const filtersCount = tableViews.reduce((acc, v) => acc + v.filters.length, 0)

                return (
                  <DatasetCard
                    key={table.id}
                    table={table}
                    colorRulesCount={colorRulesCount}
                    filtersCount={filtersCount}
                    viewMode={viewMode}
                    onClick={() => window.open(`/workspace/${table.id}`, '_blank')}
                    onRename={() => {
                      setRenamingItem({ type: 'table', id: table.id, name: table.name })
                      setRenameDialogOpen(true)
                    }}
                    onDelete={() => {
                      if (confirm(`Delete dataset "${table.name}"? This cannot be undone.`)) {
                        handleDeleteTable(table.id)
                      }
                    }}
                    onMoveToFolder={() => {
                      setMovingTableId(table.id)
                      setMoveToFolderDialog(true)
                    }}
                  />
                )
              })}
            </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery ? 'No datasets found' : 'No datasets yet'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowTableDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Dataset
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
          </section>
        )}

        {/* Shared with Me Section */}
        {activeTab === 'shared' && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Shared with Me
            </h2>
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-2"
            }>
              {sharedTables.map((table) => {
                const tableViews = views.filter((v) => v.tableId === table.id)
                const colorRulesCount = tableViews.reduce((acc, v) => acc + v.colorRules.length, 0)
                const filtersCount = tableViews.reduce((acc, v) => acc + v.filters.length, 0)

                return (
                  <DatasetCard
                    key={table.id}
                    table={{
                      id: table.id,
                      name: table.name,
                      rows: table.rows,
                      updatedAt: table.updated_at
                    }}
                    colorRulesCount={colorRulesCount}
                    filtersCount={filtersCount}
                    viewMode={viewMode}
                    onClick={() => window.open(`/workspace/${table.id}`, '_blank')}
                    onRename={undefined}
                    onDelete={undefined}
                    onMoveToFolder={undefined}
                  />
                )
              })}
            </div>
            {sharedTables.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No datasets shared with you yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  When someone shares a dataset with your email, it will appear here
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renamingItem?.type === 'folder' ? 'Folder' : 'Dataset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={renamingItem?.name || ''}
              onChange={(e) =>
                setRenamingItem(renamingItem ? { ...renamingItem, name: e.target.value } : null)
              }
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            />
            <Button onClick={handleRename} className="w-full">
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveToFolderDialog} onOpenChange={setMoveToFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
            <DialogDescription>
              Choose a folder for this dataset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedFolderId || 'none'}
              onValueChange={(v) => setSelectedFolderId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder</SelectItem>
                {displayFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleMoveToFolder} className="w-full">
              Move
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
