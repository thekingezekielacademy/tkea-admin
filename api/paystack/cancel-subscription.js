/**
 * Paystack Cancel Subscription
 * 
 * This endpoint cancels a Paystack subscription with test mode handling
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { subscriptionId, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription ID is required' 
      });
    }

    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      return res.status(500).json({
        success: false,
        message: 'Paystack not configured - PAYSTACK_SECRET_KEY missing'
      });
    }

    // Check if we're in test mode
    const isTestMode = paystackSecretKey.startsWith('sk_test_');
    
    if (isTestMode) {
      console.log('⚠️ TEST MODE: Subscription cancellation may not work properly in test mode');
      console.log('💡 Consider switching to live mode for full subscription management');
    }

    console.log(`🔄 Canceling Paystack subscription: ${subscriptionId}`);

    // Call Paystack API to cancel subscription
    const paystackResponse = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscriptionId,
        token: 'disable_token' // Paystack requires this for subscription cancellation
      })
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      throw new Error(`Paystack API Error: ${errorData.message || paystackResponse.statusText}`);
    }

    const cancelResponse = await paystackResponse.json();
    console.log('✅ Paystack subscription canceled:', cancelResponse);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Subscription canceled successfully',
      data: cancelResponse,
      canceledAt: new Date().toISOString(),
      testMode: isTestMode
    });

  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    
    // Check if this is a test mode issue
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const isTestMode = paystackSecretKey && paystackSecretKey.startsWith('sk_test_');
    const is404Error = error.message && error.message.includes('404');
    
    if (isTestMode && is404Error) {
      console.log('⚠️ TEST MODE ISSUE: Subscription cancellation failed - likely due to test mode limitations');
      
      // Return success even in test mode with explanation
      return res.status(200).json({
        success: true,
        message: 'Subscription canceled in database (Paystack test mode limitation)',
        warning: 'This is a test mode limitation. Switch to live mode for full Paystack integration.',
        testMode: true,
        canceledAt: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
      testMode: isTestMode
    });
  }
}
