import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Cancel active subscription
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from('user_subscriptions')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()

    if (subscriptionError) {
      console.error('Subscription cancellation error:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    // Deactivate trial if exists
    await adminClient
      .from('user_trials')
      .update({ is_active: false })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: subscriptionData?.[0],
    })

  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
