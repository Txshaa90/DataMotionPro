'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Mail, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  Palette, 
  CreditCard, 
  MessageSquare, 
  Trash2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import Link from 'next/link'

type Theme = 'light' | 'dark' | 'system'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile, updatePassword, signOut, isConfigured } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'upgrade' | 'contact' | 'trash'>('account')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [theme, setTheme] = useState<Theme>('system')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    setEmail(user.email || '')
    setName(user.user_metadata?.name || '')
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateProfile({
        data: { name },
      })
      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await updatePassword(newPassword)
      setSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    setSuccess('Theme updated successfully!')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign out')
    }
  }

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    alert('Account deletion will be implemented soon')
    setShowDeleteConfirm(false)
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-4">Supabase Not Configured</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Profile management requires Supabase configuration.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'account'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                Account
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Palette className="h-5 w-5 mr-3" />
                Appearance
              </button>

              <button
                onClick={() => setActiveTab('upgrade')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'upgrade'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Upgrade
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'contact'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Contact Sales
              </button>

              <button
                onClick={() => setActiveTab('trash')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'trash'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Trash2 className="h-5 w-5 mr-3" />
                Trash
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          value={email}
                          disabled
                          className="pl-10 bg-gray-50 dark:bg-gray-700"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Account created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Last sign in:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </div>

                {/* Change Password */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <Lock className="h-6 w-6 text-primary mr-2" />
                    <h2 className="text-xl font-semibold">Change Password</h2>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>

                    <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>

                {/* Sign Out */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign out from this device
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Customize how DataMotionPro looks on your device
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Light Theme */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`p-6 border-2 rounded-xl transition-all ${
                        theme === 'light'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                      <p className="font-medium">Light</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Bright and clear
                      </p>
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`p-6 border-2 rounded-xl transition-all ${
                        theme === 'dark'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                      <p className="font-medium">Dark</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Easy on the eyes
                      </p>
                    </button>

                    {/* System Theme */}
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`p-6 border-2 rounded-xl transition-all ${
                        theme === 'system'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Monitor className="h-8 w-8 mx-auto mb-3 text-gray-500" />
                      <p className="font-medium">System</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Match device
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Tab */}
            {activeTab === 'upgrade' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Upgrade Your Plan</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Unlock more features and capabilities with a premium plan
                </p>

                <div className="space-y-4">
                  {/* Current Plan */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600 dark:text-green-400">Current Plan</p>
                        <p className="text-2xl font-bold mt-1">Free</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  {/* Available Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                      <h3 className="text-lg font-semibold mb-2">Plus</h3>
                      <p className="text-3xl font-bold mb-4">₱1,200<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span></p>
                      <ul className="space-y-2 mb-6 text-sm">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Unlimited seats
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          50,000 records
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          20 GB storage
                        </li>
                      </ul>
                      <Link href="/pricing">
                        <Button className="w-full">Upgrade to Plus</Button>
                      </Link>
                    </div>

                    <div className="p-6 border-2 border-green-500 rounded-xl relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          POPULAR
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Business</h3>
                      <p className="text-3xl font-bold mb-4">₱2,400<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span></p>
                      <ul className="space-y-2 mb-6 text-sm">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Unlimited seats
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          300,000 records
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          100 GB storage
                        </li>
                      </ul>
                      <Link href="/pricing">
                        <Button className="w-full bg-green-600 hover:bg-green-700">Upgrade to Business</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <Link href="/pricing" className="text-green-600 dark:text-green-400 hover:underline">
                      View all plans and features →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Sales Tab */}
            {activeTab === 'contact' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Contact Sales</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Need help with enterprise features or have questions? Our sales team is here to help.
                </p>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4">Enterprise Solutions</h3>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span>Custom pricing and volume discounts</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span>On-premise deployment options</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span>Priority support and SLA</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Mail className="h-6 w-6 text-green-600 mb-2" />
                      <p className="font-medium mb-1">Email Us</p>
                      <a href="mailto:sales@datamotionpro.com" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                        sales@datamotionpro.com
                      </a>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-green-600 mb-2" />
                      <p className="font-medium mb-1">Schedule a Call</p>
                      <a href="#" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                        Book a demo
                      </a>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Sales Team
                  </Button>
                </div>
              </div>
            )}

            {/* Trash Tab */}
            {activeTab === 'trash' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
                <div className="flex items-center mb-6">
                  <Trash2 className="h-6 w-6 text-red-600 mr-2" />
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 mb-3" />
                    <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      Once you delete your account, there is no going back. This action cannot be undone.
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      All your data will be permanently deleted, including:
                    </p>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 mb-4 ml-4">
                      <li>• All datasets and tables</li>
                      <li>• All folders and organization</li>
                      <li>• All views and customizations</li>
                      <li>• Account information and settings</li>
                    </ul>
                  </div>

                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-xl font-bold">Delete Account?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All your data, folders, and datasets will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
