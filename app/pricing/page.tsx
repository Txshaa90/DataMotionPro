'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePayment = async (plan: string, amount: number) => {
    setLoading(plan)
    
    try {
      // Create payment intent
      const response = await fetch('/api/paymongo/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to centavos
          currency: 'PHP',
          description: `DataMotionPro ${plan} Plan`,
          plan: plan,
        }),
      })

      const data = await response.json()

      if (data.error) {
        alert('Payment failed: ' + data.error)
        setLoading(null)
        return
      }

      // Redirect to PayMongo hosted payment page
      const checkoutUrl = data.data.attributes.next_action?.redirect?.url
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        alert('Unable to create payment session')
        setLoading(null)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('An error occurred. Please try again.')
      setLoading(null)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-green-800 bg-green-950/80 backdrop-blur-sm">
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

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-green-200">Choose the plan that's right for you</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Tier */}
            <PricingCard
              name="Free"
              price="₱0"
              period="forever"
              description="For Personal Applications"
              features={[
                { name: "3 Editor seats", included: true },
                { name: "10 Commenter seats", included: true },
                { name: "1,000 records", included: true },
                { name: "1 GB storage", included: true },
                { name: "100 webhook runs / month", included: true },
                { name: "1,000 API calls / month", included: true },
                { name: "1 Extension", included: true },
              ]}
              buttonText="Get Started"
              buttonLink="/auth/signup"
              note="no credit card required"
            />

            {/* Plus Tier */}
            <PricingCard
              name="Plus"
              price="₱1,200"
              period="per month"
              description="For Small Teams"
              features={[
                { name: "Unlimited seats", included: true },
                { name: "Free commenter seats", included: true },
                { name: "50,000 records", included: true },
                { name: "20 GB storage", included: true },
                { name: "10,000 webhook runs / month", included: true },
                { name: "100,000 API calls / month", included: true },
                { name: "Unlimited extensions", included: true },
              ]}
              buttonText={loading === 'plus' ? 'Processing...' : 'Subscribe Now'}
              onPayment={() => handlePayment('plus', 1200)}
              highlighted={true}
              loading={loading === 'plus'}
            />

            {/* Business Tier */}
            <PricingCard
              name="Business"
              price="₱2,400"
              period="per month"
              description="For Scaling Businesses"
              features={[
                { name: "Unlimited seats", included: true },
                { name: "300,000 records", included: true },
                { name: "100 GB storage", included: true },
                { name: "50,000 webhook runs / month", included: true },
                { name: "1,000,000 API calls / month", included: true },
                { name: "10 External database connections", included: true },
                { name: "SAML Single Sign-On", included: true },
              ]}
              buttonText={loading === 'business' ? 'Processing...' : 'Subscribe Now'}
              onPayment={() => handlePayment('business', 2400)}
              loading={loading === 'business'}
            />

            {/* Enterprise Tier */}
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="For Established Organizations"
              features={[
                { name: "Unlimited workspaces", included: true },
                { name: "Unlimited records", included: true },
                { name: "Audit Logs", included: true },
                { name: "On premise installation", included: true },
                { name: "Air gapped installation", included: true },
                { name: "White labelling", included: true },
                { name: "Dedicated support", included: true },
              ]}
              buttonText="Schedule a Call"
              buttonLink="/contact"
            />
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <FAQItem
                question="Can I switch plans later?"
                answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              />
              <FAQItem
                question="What payment methods do you accept?"
                answer="We accept all major credit cards (Visa, MasterCard, American Express) and PayPal."
              />
              <FAQItem
                question="Is there a free trial?"
                answer="Yes! Pro plan comes with a 14-day free trial. No credit card required."
              />
              <FAQItem
                question="What happens if I exceed my limits?"
                answer="We'll notify you when you're approaching your limits. You can upgrade anytime to increase your capacity."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

interface Feature {
  name: string
  included: boolean
}

interface PricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: Feature[]
  buttonText: string
  buttonLink?: string
  onPayment?: () => void
  highlighted?: boolean
  note?: string
  loading?: boolean
}

function PricingCard({ name, price, period, description, features, buttonText, buttonLink, onPayment, highlighted, note, loading }: PricingCardProps) {
  return (
    <div className={`rounded-xl p-6 ${
      highlighted 
        ? 'bg-green-600 border-2 border-green-400 shadow-2xl scale-105' 
        : 'bg-green-800/50 border border-green-700'
    }`}>
      {highlighted && (
        <div className="text-center mb-4">
          <span className="bg-green-400 text-green-900 px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <p className="text-green-200 text-sm mb-2">{description}</p>
        <h3 className="text-2xl font-bold mb-3">{name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">{price}</span>
        </div>
        {period && <p className="text-green-200 text-sm">{period}</p>}
        {note && <p className="text-green-300 text-xs mt-2 italic">({note})</p>}
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-300 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-green-700 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-white' : 'text-green-300 line-through'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {onPayment ? (
        <Button 
          onClick={onPayment}
          disabled={loading}
          className={`w-full ${
            highlighted 
              ? 'bg-white text-green-600 hover:bg-green-50' 
              : 'bg-green-600 hover:bg-green-500'
          }`}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      ) : buttonLink ? (
        <Link href={buttonLink}>
          <Button 
            className={`w-full ${
              highlighted 
                ? 'bg-white text-green-600 hover:bg-green-50' 
                : 'bg-green-600 hover:bg-green-500'
            }`}
            size="lg"
          >
            {buttonText}
          </Button>
        </Link>
      ) : null}
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-green-800/50 p-6 rounded-lg border border-green-700">
      <h3 className="text-xl font-semibold mb-2 text-white">{question}</h3>
      <p className="text-green-100">{answer}</p>
    </div>
  )
}
