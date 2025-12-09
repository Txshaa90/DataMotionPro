import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()
    
    console.log('PayMongo Webhook Event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data)
        break
      
      case 'payment_intent.processing':
        console.log('Payment processing:', event.data.id)
        break
      
      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    const { id, attributes } = paymentData
    const { amount, currency, metadata } = attributes
    
    console.log('Payment succeeded:', {
      id,
      amount,
      currency,
      plan: metadata?.plan,
    })

    // TODO: Update user subscription in Supabase
    // You'll need to extract user_id from metadata or a custom field
    if (metadata?.user_id) {
      const { error } = await (supabase as any)
        .from('subscriptions')
        .upsert({
          user_id: metadata.user_id,
          plan: metadata.plan || 'plus',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Failed to update subscription:', error)
      } else {
        console.log('Subscription updated successfully for user:', metadata.user_id)
      }
    }
  } catch (error: any) {
    console.error('Error handling payment success:', error.message)
  }
}

async function handlePaymentFailed(paymentData: any) {
  try {
    const { id, attributes } = paymentData
    
    console.log('Payment failed:', {
      id,
      amount: attributes.amount,
      last_payment_error: attributes.last_payment_error,
    })

    // TODO: Notify user of failed payment
    // Send email or update UI
  } catch (error: any) {
    console.error('Error handling payment failure:', error.message)
  }
}
