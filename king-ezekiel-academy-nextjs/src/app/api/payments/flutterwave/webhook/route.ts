import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('verif-hash')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing verification hash' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.FLUTTERWAVE_HASH)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const data = JSON.parse(body)
    const { event, data: paymentData } = data

    if (event !== 'charge.completed') {
      return NextResponse.json({ message: 'Event not handled' })
    }

    // Process successful payment
    if (paymentData.status === 'successful') {
      const adminClient = createAdminClient()

      // Update payment record
      await adminClient
        .from('payment_attempts')
        .update({
          status: 'successful',
          flutterwave_tx_id: paymentData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('tx_ref', paymentData.tx_ref)

      // Create or update subscription with correct schema
      const subscriptionData = {
        user_id: paymentData.meta?.user_id,
        flutterwave_subscription_id: paymentData.tx_ref || paymentData.id,
        flutterwave_customer_code: paymentData.customer?.customer_code || paymentData.meta?.user_id,
        flutterwave_tx_id: paymentData.id,
        flutterwave_tx_ref: paymentData.tx_ref,
        plan_name: 'Monthly Membership',
        status: 'active',
        amount: Math.round(paymentData.amount * 100), // Convert to kobo
        currency: paymentData.currency || 'NGN',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      }

      const { error: subscriptionError } = await adminClient
        .from('user_subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })

      if (subscriptionError) {
        console.error('Webhook subscription creation error:', subscriptionError)
      }

      // Also create payment record
      const paymentRecord = {
        user_id: paymentData.meta?.user_id,
        flutterwave_transaction_id: paymentData.id,
        flutterwave_reference: paymentData.tx_ref,
        flutterwave_tx_id: paymentData.id,
        flutterwave_tx_ref: paymentData.tx_ref,
        amount: Math.round(paymentData.amount * 100), // Convert to kobo
        currency: paymentData.currency || 'NGN',
        status: 'success',
        payment_method: 'card',
        paid_at: paymentData.created_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      const { error: paymentError } = await adminClient
        .from('subscription_payments')
        .insert(paymentRecord)

      if (paymentError) {
        console.error('Webhook payment record creation error:', paymentError)
      }

      console.log('Payment processed successfully:', paymentData.tx_ref)
    }

    return NextResponse.json({ message: 'Webhook processed' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
