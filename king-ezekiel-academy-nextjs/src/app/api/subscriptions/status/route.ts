import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
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

    // Check subscription status
    const { data: subscriptionData } = await adminClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Check if subscription is expired
    if (subscriptionData && new Date(subscriptionData.end_date) < new Date()) {
      // Deactivate expired subscription
      await adminClient
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionData.id)

      subscriptionData.is_active = false
    }

    return NextResponse.json({
      user_id: user.id,
      subscription: subscriptionData,
      has_access: !!(subscriptionData?.is_active),
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
