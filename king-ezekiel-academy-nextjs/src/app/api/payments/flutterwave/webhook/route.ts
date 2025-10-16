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

      // Create or update subscription
      const planId = paymentData.meta?.plan_id || 'monthly'
      const subscriptionData = {
        user_id: paymentData.meta?.user_id,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_id: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        created_at: new Date().toISOString(),
      }

      await adminClient
        .from('user_subscriptions')
        .upsert(subscriptionData)

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
