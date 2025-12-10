import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find subscription marked for cancellation
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('cancel_at_period_end', true)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'No subscription scheduled for cancellation found' },
        { status: 404 }
      )
    }

    // Reactivate subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error reactivating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to reactivate subscription' },
        { status: 500 }
      )
    }

    // Update profile subscription status
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    console.log('✅ Subscription reactivated:', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated',
    })
  } catch (error: any) {
    console.error('❌ Reactivation Error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription', details: error.message },
      { status: 500 }
    )
  }
}
