'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { resetPasswordForEmail, verifyOtp, updatePassword, isConfigured } = useAuth()
  
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPasswordForEmail(email)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp(email, otp, 'recovery')
      setStep('newPassword')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
          <img src="/logo.png" alt="DataMotionPro logo" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold mb-4">Supabase Not Configured</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Password reset requires Supabase configuration.
          </p>
          <Link href="/auth/signin">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Password Reset Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your password has been updated. Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <img src="/logo.png" alt="DataMotionPro logo" className="h-12 w-12 object-contain" />
            <span className="text-3xl font-bold text-white">DataMotionPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-blue-100/85">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'otp' && 'Enter the code sent to your email'}
            {step === 'newPassword' && 'Create your new password'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <Link href="/auth/signin" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Check your email for the verification code
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Didn't receive the code? Try again
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
