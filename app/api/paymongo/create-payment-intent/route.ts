import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'PHP', description, plan } = body

    // Validate amount
    if (!amount || amount < 100) {
      console.error('❌ Validation Error: Amount too low:', amount)
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
      console.error('❌ Config Error: PayMongo secret key not found')
      console.error('Environment:', process.env.NODE_ENV)
      console.error('Available keys:', {
        hasProductionKey: !!process.env.PAYMONGO_SECRET_KEY,
        hasTestKey: !!process.env.PAYMONGO_SECRET_KEY_TEST,
      })
      return NextResponse.json(
        { error: 'PayMongo API key not configured. Please add PAYMONGO_SECRET_KEY_TEST to your .env.local file.' },
        { status: 500 }
      )
    }

    console.log('✅ Creating Payment Link (HPP)...')
    console.log('Amount:', amount, 'centavos (PHP', amount / 100, ')')
    console.log('Plan:', plan)
    console.log('Using key:', secretKey.substring(0, 15) + '...')

    // Create Payment Link (Hosted Payment Page)
    const response = await axios.post(
      'https://api.paymongo.com/v1/links',
      {
        data: {
          attributes: {
            amount: amount, // in centavos (PHP 12.00 = 1200)
            description: description || `DataMotionPro ${plan || 'Subscription'}`,
            remarks: `${plan} Plan Subscription`,
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
          'accept': 'application/json',
        },
      }
    )

    console.log('✅ Payment Link created successfully')
    console.log('Checkout URL:', response.data.data.attributes.checkout_url)

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('❌ PayMongo API Error:')
    console.error('Status:', error.response?.status)
    console.error('Error Details:', JSON.stringify(error.response?.data, null, 2))
    console.error('Full Error:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment link',
        details: error.response?.data || error.message,
        status: error.response?.status,
      },
      { status: error.response?.status || 500 }
    )
  }
}
