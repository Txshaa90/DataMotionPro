'use client'

import { Button } from '@/components/ui/button'
import {
  Plus,
  Upload,
  Database,
  FileCode,
  BarChart3,
  Layers,
} from 'lucide-react'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md transition-all text-left group"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </button>
  )
}

interface OverviewPageProps {
  onCreateTable?: () => void
  onImportData?: () => void
}

export function OverviewPage({ onCreateTable, onImportData }: OverviewPageProps) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get started with DataMotionPro by creating tables, importing data, or exploring features
          </p>
        </div>

        {/* Actions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              icon={<Plus className="h-6 w-6" />}
              title="Create New Table"
              description="Start from scratch."
              onClick={onCreateTable}
            />
            <ActionCard
              icon={<Upload className="h-6 w-6" />}
              title="Import Data"
              description="From files & external sources."
              onClick={onImportData}
            />
            <ActionCard
              icon={<Database className="h-6 w-6" />}
              title="Connect External Data"
              description="In realtime to external databases."
            />
            <ActionCard
              icon={<FileCode className="h-6 w-6" />}
              title="Create Empty Script"
              description="Start from scratch."
            />
            <ActionCard
              icon={<Layers className="h-6 w-6" />}
              title="Scripts by DataMotionPro"
              description="Ready to use scripts by DataMotionPro"
            />
            <ActionCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Create Empty Dashboard"
              description="Start from scratch."
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="text-3xl font-bold text-primary mb-2">
              {/* This would be dynamic */}
              0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Tables
            </div>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="text-3xl font-bold text-primary mb-2">
              0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Records
            </div>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="text-3xl font-bold text-primary mb-2">
              0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Views
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Getting Started
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Create your first table
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Create New Table" to start organizing your data
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Add columns and data
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Define your data structure with different column types
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Create custom views
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use filters, sorts, and colors to visualize your data
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
