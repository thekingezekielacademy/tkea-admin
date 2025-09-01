import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, paystackSubscriptionId } = req.body;

    // Validate input
    if (!subscriptionId || !paystackSubscriptionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: subscriptionId and paystackSubscriptionId' 
      });
    }

    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('PAYSTACK')));
      return res.status(500).json({ 
        error: 'Server configuration error. PAYSTACK_SECRET_KEY not found.',
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('PAYSTACK'))
      });
    }

    console.log('🔧 API Route Debug:', {
      subscriptionId,
      paystackSubscriptionId,
      hasSecretKey: !!paystackSecretKey,
      secretKeyPrefix: paystackSecretKey?.substring(0, 10) + '...'
    });

    // Call Paystack API to cancel subscription
    const paystackResponse = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: paystackSubscriptionId, // Paystack expects 'token' not 'code'
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error('Paystack API error:', errorData);
      
      return res.status(paystackResponse.status).json({
        error: `Paystack API error: ${paystackResponse.status}`,
        details: errorData.message || 'Unknown error',
        subscriptionId,
        paystackSubscriptionId
      });
    }

    const paystackResult = await paystackResponse.json();
    
    if (paystackResult.status) {
      // Successfully cancelled in Paystack
      return res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        subscriptionId,
        paystackSubscriptionId,
        paystackResponse: paystackResult
      });
    } else {
      // Paystack returned an error
      return res.status(400).json({
        error: 'Failed to cancel subscription in Paystack',
        details: paystackResult.message || 'Unknown error',
        subscriptionId,
        paystackSubscriptionId
      });
    }

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
