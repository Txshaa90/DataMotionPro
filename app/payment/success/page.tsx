'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-green-800/50 border border-green-700 rounded-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        
        <p className="text-green-200 mb-6">
          Thank you for subscribing to DataMotionPro. Your account has been upgraded successfully.
        </p>

        <div className="bg-green-900/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-300">
            Redirecting to dashboard in <span className="font-bold text-white">{countdown}</span> seconds...
          </p>
        </div>

        <Link href="/dashboard">
          <Button className="w-full bg-green-600 hover:bg-green-500">
            Go to Dashboard Now
          </Button>
        </Link>
      </div>
    </div>
  )
}
