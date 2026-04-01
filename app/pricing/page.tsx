'use client'

import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-blue-900 text-white">
      <nav className="border-b border-blue-800/40 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">DataMotionPro</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Everything Included</h1>
            <p className="text-xl text-blue-100/85">DataMotionPro currently runs without subscription billing</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard
              name="Core Workspace"
              status="Included"
              description="Spreadsheet-style collaboration without upgrade gates"
              features={[
                'Excel and CSV imports',
                'Multi-sheet workspaces',
                'Spreadsheet editing',
                'Filters, sorting, and views',
                'Supabase-backed storage',
                'Shared datasets',
              ]}
              buttonText="Create Account"
              buttonLink="/auth/signup"
              highlighted
            />

            <FeatureCard
              name="Built for Growth"
              status="Optimized"
              description="Large-sheet handling focused on import and browsing performance"
              features={[
                'Batch row inserts',
                'Dedicated sheet row storage',
                'Lazy sheet loading',
                'Paginated sheet viewing',
                'Bulk row operations',
                'CSV and Excel export',
              ]}
              buttonText="Open Dashboard"
              buttonLink="/dashboard"
            />
          </div>

          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <FAQItem
                question="Do I need a paid plan to use DataMotionPro?"
                answer="No. The current app flow does not include checkout, subscriptions, or billing management."
              />
              <FAQItem
                question="Can I still import large Excel or CSV files?"
                answer="Yes. The product keeps XLSX and CSV imports while improving how sheet data is loaded into the workspace."
              />
              <FAQItem
                question="Why is this page still here?"
                answer="It now works as a simple product overview for anyone visiting an old pricing link."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  name,
  status,
  description,
  features,
  buttonText,
  buttonLink,
  highlighted,
}: {
  name: string
  status: string
  description: string
  features: string[]
  buttonText: string
  buttonLink: string
  highlighted?: boolean
}) {
  return (
    <div className={`rounded-xl p-6 ${highlighted ? 'bg-blue-600 border-2 border-blue-400 shadow-2xl' : 'bg-blue-950/30 border border-blue-800/40'}`}>
      <div className="text-center mb-6">
        <p className="text-blue-100/80 text-sm mb-2">{description}</p>
        <h3 className="text-2xl font-bold mb-3">{name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">{status}</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-blue-300 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-white">{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={buttonLink}>
        <Button
          className={`w-full ${highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 hover:bg-blue-500'}`}
          size="lg"
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-blue-950/30 p-6 rounded-lg border border-blue-800/40">
      <h3 className="text-xl font-semibold mb-2 text-white">{question}</h3>
      <p className="text-blue-100/85">{answer}</p>
    </div>
  )
}
