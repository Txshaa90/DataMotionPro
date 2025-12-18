'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email') => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (data: { email?: string; password?: string; data?: any }) => Promise<void>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signInWithMagicLink: async () => {},
  signUpWithEmail: async () => {},
  verifyOtp: async () => {},
  resetPasswordForEmail: async () => {},
  updatePassword: async () => {},
  updateProfile: async () => {},
  signOut: async () => {},
  isConfigured: false,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [configured])

  const signInWithGoogle = async () => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string, password: string, rememberMe: boolean = false) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Store remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberMe')
    }
  }

  const signInWithMagicLink = async (email: string) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email') => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
    if (error) throw error
  }

  const resetPasswordForEmail = async (email: string) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  const updateProfile = async (data: { email?: string; password?: string; data?: any }) => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.updateUser(data)
    if (error) throw error
  }

  const signOut = async () => {
    if (!configured) {
      console.warn('Supabase not configured')
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signInWithMagicLink,
        signUpWithEmail,
        verifyOtp,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        signOut,
        isConfigured: configured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
