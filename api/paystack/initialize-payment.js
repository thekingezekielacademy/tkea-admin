// Vercel Function for Paystack Payment Initialization
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, amount, metadata = {} } = req.body;

    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and amount are required' 
      });
    }

    console.log(`🚀 Initializing Paystack payment for: ${email}, Amount: ${amount}`);

    // Paystack Configuration - Use environment variables for security
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.REACT_APP_PAYSTACK_SECRET_KEY;
    const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE || process.env.REACT_APP_PAYSTACK_PLAN_CODE;
    const PAYSTACK_BASE_URL = 'https://api.paystack.co';

    // Validate required environment variables
    if (!PAYSTACK_SECRET_KEY) {
      console.error('❌ CRITICAL: PAYSTACK_SECRET_KEY environment variable is required');
      return res.status(500).json({
        success: false,
        message: 'Paystack configuration error: Secret key not found'
      });
    }

    if (!PAYSTACK_PLAN_CODE) {
      console.error('❌ CRITICAL: PAYSTACK_PLAN_CODE environment variable is required');
      return res.status(500).json({
        success: false,
        message: 'Paystack configuration error: Plan code not found'
      });
    }

    // Call Paystack API to initialize payment
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        callback_url: `${req.headers.origin}/payment/verify`,
        metadata: {
          ...metadata,
          plan_code: PAYSTACK_PLAN_CODE
        }
      })
    });

    const result = await response.json();
    console.log('📡 Paystack API Response Status:', response.status);

    if (!response.ok) {
      console.error('❌ Paystack API Error Response:', result);
      return res.status(response.status).json({
        success: false,
        message: `Paystack API error: ${result.message || response.statusText}`,
        error: result
      });
    }

    console.log('✅ Paystack payment initialized successfully:', result);

    // Return success response with authorization URL
    return res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: result.data.authorization_url,
        reference: result.data.reference,
        access_code: result.data.access_code
      }
    });

  } catch (error) {
    console.error('❌ Error initializing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
}
