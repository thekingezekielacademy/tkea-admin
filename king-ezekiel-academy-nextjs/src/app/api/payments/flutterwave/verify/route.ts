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

    // Create subscription with correct schema
    const subscriptionData = {
      user_id: user.id,
      flutterwave_subscription_id: payment.tx_ref || payment.id,
      flutterwave_customer_code: payment.customer?.customer_code || user.id,
      flutterwave_tx_id: payment.id,
      flutterwave_tx_ref: payment.tx_ref,
      plan_name: 'Monthly Membership',
      status: 'active',
      amount: Math.round(payment.amount * 100), // Convert to kobo
      currency: payment.currency || 'NGN',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      is_active: true,
      created_at: new Date().toISOString(),
    }

    // Try to insert subscription, handle duplicates gracefully
    const { data: subscriptionResult, error: subscriptionError } = await adminClient
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      // Don't fail the entire request if subscription creation fails
      // The payment was successful, so we should still return success
    }

    // Also create payment record
    const paymentRecord = {
      user_id: user.id,
      flutterwave_transaction_id: payment.id,
      flutterwave_reference: payment.tx_ref,
      flutterwave_tx_id: payment.id,
      flutterwave_tx_ref: payment.tx_ref,
      amount: Math.round(payment.amount * 100), // Convert to kobo
      currency: payment.currency || 'NGN',
      status: 'success',
      payment_method: 'card',
      paid_at: payment.created_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    const { error: paymentError } = await adminClient
      .from('subscription_payments')
      .insert(paymentRecord)

    if (paymentError) {
      console.error('Payment record creation error:', paymentError)
    }

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
