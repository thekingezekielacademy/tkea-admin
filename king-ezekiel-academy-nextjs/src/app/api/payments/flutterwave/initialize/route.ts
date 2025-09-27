import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { amount, email, name, plan_id } = await request.json()

    // Check for required environment variables first
    if (!env.FLUTTERWAVE_SECRET_KEY) {
      console.error('❌ FLUTTERWAVE_SECRET_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured',
          details: 'Flutterwave secret key is missing from server configuration'
        },
        { status: 500 }
      )
    }

    if (!amount || !email || !name) {
      return NextResponse.json(
        { error: 'Amount, email, and name are required' },
        { status: 400 }
      )
    }

    // Get user from session  
    let user;
    let authError;
    
    // Debug headers
    const authHeader = request.headers.get('Authorization');
    console.log('🔍 API Route - Auth headers:', {
      authorization: authHeader ? 'Present' : 'Missing',
      authHeaderLength: authHeader?.length,
      authHeaderStart: authHeader ? authHeader.substring(0, 30) + '...' : null,
      cookie: request.headers.get('cookie') ? 'Present' : 'Missing'
    });
    
    // Use standard Supabase server client (handles cookies automatically)
    console.log('🔍 Using standard Supabase server client...');
    const supabase = await createClient();
    
    // Try to get the user from the session
    const sessionResult = await supabase.auth.getUser();
    console.log('🔍 Session Auth Result:', { 
      hasUser: !!sessionResult.data.user,
      userId: sessionResult.data.user?.id,
      error: sessionResult.error?.message 
    });
    
    if (sessionResult.data.user && !sessionResult.error) {
      user = sessionResult.data.user;
      authError = null;
      console.log('✅ Authentication successful via server client');
    } else {
      // If that fails, try the Authorization header approach
      console.log('🔍 Server client failed, trying Authorization header...');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          
          // Use Supabase Admin Client to verify JWT token
          const { createClient: createAdminClient } = await import('@supabase/supabase-js');
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          // Verify the JWT token using admin client
          const { data: { user: verifiedUser }, error: verifyError } = await adminClient.auth.getUser(token);
          
          console.log('🔍 Admin JWT Verification Result:', {
            hasUser: !!verifiedUser,
            userId: verifiedUser?.id,
            error: verifyError?.message
          });
          
          if (verifyError) {
            console.error('❌ Admin token verification error:', verifyError);
            authError = verifyError;
          } else if (verifiedUser) {
            user = verifiedUser;
            authError = null;
            console.log('✅ Admin JWT Auth Success:', { userId: user.id });
          } else {
            authError = new Error('No user found in token');
          }
        } catch (tokenError) {
          console.error('❌ Token processing error:', tokenError);
          authError = new Error('Token processing failed');
        }
      } else {
        authError = new Error('No authentication provided');
      }
    }

    if (authError || !user) {
      console.error('🔍 Final Auth Issue:', { error: authError?.message, hasUser: !!user });
      return NextResponse.json(
        { error: 'Authentication required - please log in again' },
        { status: 401 }
      )
    }

    // Initialize Flutterwave payment
    const paymentData = {
      tx_ref: `KEA_${Date.now()}_${user.id}`,
      amount: amount,
      currency: 'NGN',
      redirect_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment-verification`,
      customer: {
        email: email,
        name: name,
      },
      customizations: {
        title: 'King Ezekiel Academy',
        description: 'Course Subscription Payment',
        logo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/favicon.ico`,
      },
      meta: {
        user_id: user.id,
        plan_id: plan_id || 'monthly',
      },
    }
    
    console.log('🔍 Payment Data prepared:', { 
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      user_id: paymentData.meta.user_id
    });

    console.log('🔍 Making Flutterwave API call...', {
      hasSecretKey: !!env.FLUTTERWAVE_SECRET_KEY,
      paymentData: { ...paymentData, tx_ref: paymentData.tx_ref }
    });

    let data;
    try {
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      console.log('📡 Flutterwave API response status:', response.status);

      data = await response.json()
      console.log('📡 Flutterwave API response data:', data);

      if (!response.ok) {
        console.error('❌ Flutterwave API error:', { status: response.status, data })
        return NextResponse.json(
          { 
            error: 'Payment initialization failed',
            details: data?.message || 'Flutterwave API error'
          },
          { status: 400 }
        )
      }

      if (data.status !== 'success') {
        console.error('❌ Flutterwave API returned non-success:', data)
        return NextResponse.json(
          { 
            error: 'Payment initialization failed',
            details: data.message || 'Flutterwave payment initialization unsuccessful'
          },
          { status: 400 }
        )
      }
    } catch (flutterwaveError) {
      console.error('❌ Flutterwave API network error:', flutterwaveError);
      return NextResponse.json(
        { 
          error: 'Payment initialization failed',
          details: 'Unable to connect to payment gateway'
        },
        { status: 500 }
      )
    }

    // Validate Flutterwave response structure
    if (!data.data || !data.data.link) {
      console.error('❌ Unexpected Flutterwave response structure:', data);
      return NextResponse.json(
        { 
          error: 'Invalid response from payment gateway',
          details: 'Payment link not found in gateway response'
        },
        { status: 400 }
      )
    }

    // Save payment record to database
    try {
      const adminClient = createAdminClient()
      await adminClient
        .from('payment_attempts')
        .insert({
          user_id: user.id,
          tx_ref: paymentData.tx_ref,
          amount: amount,
          currency: 'NGN',
          status: 'pending',
          plan_id: plan_id || 'monthly',
          created_at: new Date().toISOString(),
        })
      
      console.log('✅ Payment attempt recorded in database');
    } catch (dbError) {
      console.warn('⚠️ Failed to record payment attempt in database:', dbError);
      // Don't fail the entire request for database logging issues
    }

    return NextResponse.json({
      payment_url: data.data.link,
      tx_ref: paymentData.tx_ref,
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
