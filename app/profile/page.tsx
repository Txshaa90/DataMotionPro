'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Lock,
  Mail,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  User,
} from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'
type SettingsTab = 'account' | 'appearance' | 'trash'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile, updatePassword, signOut, isConfigured } = useAuth()

  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [theme, setTheme] = useState<Theme>('system')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    setEmail(user.email || '')
    setName(user.user_metadata?.name || '')
    setProfilePicture(user.user_metadata?.avatar_url || '')

    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab && ['account', 'appearance', 'trash'].includes(tab)) {
      setActiveTab(tab as SettingsTab)
    }
  }, [user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateProfile({ data: { name } })
      setSuccess('Profile updated successfully.')
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
      setSuccess('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (nextTheme: Theme) => {
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }

    setSuccess('Theme updated successfully.')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign out')
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setUploadingPicture(true)
    setError('')

    try {
      const preview = await readFileAsDataUrl(file)
      setProfilePicture(preview)
      await updateProfile({ data: { name, avatar_url: preview } })
      setSuccess('Profile picture updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture')
    } finally {
      setUploadingPicture(false)
    }
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
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {error && <MessageBanner tone="error" message={error} />}
        {success && <MessageBanner tone="success" message={success} />}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<User className="h-5 w-5 mr-3" />} label="Account" />
              <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette className="h-5 w-5 mr-3" />} label="Appearance" />
              <TabButton active={activeTab === 'trash'} onClick={() => setActiveTab('trash')} icon={<Trash2 className="h-5 w-5 mr-3" />} label="Trash" danger />
            </nav>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-6">Account Overview</h2>

                  <div className="flex items-start space-x-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer shadow-lg">
                        <Camera className="h-4 w-4" />
                        <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" disabled={uploadingPicture} />
                      </label>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{name || 'User'}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{email}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Account created</p>
                      <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Last sign in</p>
                      <p className="font-medium">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-6">Edit Profile</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input type="email" value={email} disabled className="pl-10 bg-gray-50 dark:bg-gray-700" />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                  </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <Lock className="h-6 w-6 text-primary mr-2" />
                    <h2 className="text-xl font-semibold">Change Password</h2>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} />
                    </div>
                    <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sign out from this device</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Customize how DataMotionPro looks on your device</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ThemeCard active={theme === 'light'} onClick={() => handleThemeChange('light')} icon={<Sun className="h-8 w-8 mx-auto mb-3 text-yellow-500" />} label="Light" description="Bright and clear" />
                  <ThemeCard active={theme === 'dark'} onClick={() => handleThemeChange('dark')} icon={<Moon className="h-8 w-8 mx-auto mb-3 text-blue-500" />} label="Dark" description="Easy on the eyes" />
                  <ThemeCard active={theme === 'system'} onClick={() => handleThemeChange('system')} icon={<Monitor className="h-8 w-8 mx-auto mb-3 text-gray-500" />} label="System" description="Match device" />
                </div>
              </div>
            )}

            {activeTab === 'trash' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
                <div className="flex items-center mb-6">
                  <Trash2 className="h-6 w-6 text-red-600 mr-2" />
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 mb-3" />
                  <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Once you delete your account, there is no going back. This action cannot be undone.
                  </p>
                  <Button variant="destructive" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold">Delete account?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Account deletion is not yet implemented. This dialog remains as a safeguard for future work.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Close</Button>
              <Button variant="destructive" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Understood</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  danger,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
        active
          ? danger
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ThemeCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 border-2 rounded-xl transition-all ${
        active
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      <p className="font-medium">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
    </button>
  )
}

function MessageBanner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  const base =
    tone === 'success'
      ? 'mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 flex items-center'
      : 'mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400'

  return (
    <div className={base}>
      {tone === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
      {message}
    </div>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}
