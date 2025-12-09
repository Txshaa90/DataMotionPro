import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'PHP', description, plan } = body

    // Validate amount
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least PHP 1.00 (100 centavos)' },
        { status: 400 }
      )
    }

    // Use test or live key based on environment
    const secretKey = process.env.NODE_ENV === 'production'
      ? process.env.PAYMONGO_SECRET_KEY
      : process.env.PAYMONGO_SECRET_KEY_TEST

    if (!secretKey) {
      return NextResponse.json(
        { error: 'PayMongo API key not configured' },
        { status: 500 }
      )
    }

    // Create payment intent
    const response = await axios.post(
      'https://api.paymongo.com/v1/payment_intents',
      {
        data: {
          attributes: {
            amount: amount, // in centavos (PHP 12.00 = 1200)
            currency: currency,
            payment_method_allowed: ['card', 'gcash', 'paymaya'],
            description: description || `DataMotionPro ${plan || 'Payment'}`,
            statement_descriptor: 'DataMotionPro',
            metadata: {
              plan: plan,
              timestamp: new Date().toISOString(),
            },
          },
        },
      },
      {
        auth: {
          username: secretKey,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('PayMongo API Error:', error.response?.data || error.message)
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}
