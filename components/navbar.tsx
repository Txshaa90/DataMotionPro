'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Database, User, LogOut, Settings, ChevronDown, ChevronRight, ChevronLeft, Palette, CreditCard, MessageSquare, Trash2, Sun, Moon, Monitor, Check } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false)
  const [theme, setTheme] = useState<Theme>('system')
  const [menuView, setMenuView] = useState<'main' | 'appearance'>('main')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    setMenuView('main')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">DataMotionPro</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/workspace/nocodb" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Workspace
            </Link>
          </div>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                    {menuView === 'main' ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium">{user.user_metadata?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>

                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Account
                        </Link>

                        <button
                          onClick={() => setMenuView('appearance')}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <Palette className="h-4 w-4 mr-3" />
                            Appearance
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <Link
                          href="/pricing"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <CreditCard className="h-4 w-4 mr-3" />
                          Upgrade
                        </Link>

                        <Link
                          href="/profile?tab=contact"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <MessageSquare className="h-4 w-4 mr-3" />
                          Contact Sales
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Dashboard
                        </Link>

                        <Link
                          href="/profile?tab=trash"
                          className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Trash
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => setMenuView('main')}
                            className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Appearance
                          </button>
                        </div>

                        <button
                          onClick={() => handleThemeChange('light')}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <Sun className="h-4 w-4 mr-3" />
                            Light
                          </div>
                          {theme === 'light' && <Check className="h-4 w-4 text-green-600" />}
                        </button>

                        <button
                          onClick={() => handleThemeChange('dark')}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <Moon className="h-4 w-4 mr-3" />
                            Dark
                          </div>
                          {theme === 'dark' && <Check className="h-4 w-4 text-green-600" />}
                        </button>

                        <button
                          onClick={() => handleThemeChange('system')}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <Monitor className="h-4 w-4 mr-3" />
                            Use system setting
                          </div>
                          {theme === 'system' && <Check className="h-4 w-4 text-green-600" />}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
