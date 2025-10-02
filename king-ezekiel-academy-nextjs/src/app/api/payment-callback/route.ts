import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, tx_ref, transaction_id, flw_ref } = body

    console.log('📞 Payment callback received:', { status, tx_ref, transaction_id, flw_ref })

    // Handle successful payment
    if (status === 'successful') {
      // Store payment verification data
      // This could be stored in a database or cache for later verification
      console.log('✅ Payment successful, storing verification data')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment callback processed successfully' 
      })
    }

    // Handle failed payment
    if (status === 'cancelled' || status === 'failed') {
      console.log('❌ Payment failed or cancelled')
      
      return NextResponse.json({ 
        success: false, 
        message: 'Payment callback processed' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment callback received' 
    })

  } catch (error) {
    console.error('❌ Payment callback error:', error)
    return NextResponse.json(
      { error: 'Payment callback processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests (for redirects)
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tx_ref = searchParams.get('tx_ref')
  
  console.log('📞 Payment callback GET:', { status, tx_ref })
  
  if (status === 'successful') {
    return NextResponse.redirect(new URL(`/paybeforesignup?payment_success=true&tx_ref=${tx_ref}`, request.url))
  } else {
    return NextResponse.redirect(new URL(`/paybeforesignup?payment_cancelled=true&tx_ref=${tx_ref}`, request.url))
  }
}
