import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const { tx_ref } = await request.json()

    if (!tx_ref) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    // Verify payment with Flutterwave
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${tx_ref}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok || data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const payment = data.data

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if payment is successful
    if (payment.status !== 'successful') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      )
    }

    // Update payment record
    const adminClient = createAdminClient()
    await adminClient
      .from('payment_attempts')
      .update({
        status: 'successful',
        flutterwave_tx_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('tx_ref', tx_ref)

    // Create subscription
    const planId = payment.meta?.plan_id || 'monthly'
    const subscriptionData = {
      user_id: user.id,
      plan_id: planId,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      created_at: new Date().toISOString(),
    }

    await adminClient
      .from('user_subscriptions')
      .upsert(subscriptionData)

    // Deactivate trial if exists
    await adminClient
      .from('user_trials')
      .update({ is_active: false })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
