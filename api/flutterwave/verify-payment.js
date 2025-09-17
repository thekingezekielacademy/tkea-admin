// Dynamic imports for Vercel serverless functions

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://app.thekingezekielacademy.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Dynamic import for Vercel serverless functions
    const axios = (await import('axios')).default;
    
    const { reference, transaction_id } = req.body;
    
    console.log('📝 Verifying Flutterwave payment:', { reference, transaction_id });
    console.log('🔧 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      FLUTTERWAVE_SECRET_KEY_EXISTS: !!process.env.FLUTTERWAVE_SECRET_KEY,
      FLUTTERWAVE_SECRET_KEY_PREFIX: process.env.FLUTTERWAVE_SECRET_KEY?.substring(0, 10) + '...'
    });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      console.error('❌ FLUTTERWAVE_SECRET_KEY not found in environment variables');
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    if (!reference) {
      console.error('❌ No reference provided for payment verification');
      return res.status(400).json({ success: false, message: 'Payment reference is required' });
    }

    // Verify payment via Flutterwave API
    console.log('🔍 Calling Flutterwave API for verification...');
    console.log('🔗 API URL:', `https://api.flutterwave.com/v3/transactions/${reference}/verify`);
    
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('📊 Flutterwave API response status:', response.status);
    console.log('📊 Flutterwave API response data:', JSON.stringify(response.data, null, 2));
    const result = response.data;

    if (result.status === 'success' && result.data) {
      const paymentData = result.data;
      
      // Check if payment was actually successful
      if (paymentData.status === 'successful' && paymentData.amount >= 0) {
        console.log('✅ Payment verified successfully:', {
          reference: paymentData.reference,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status
        });
        
        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: paymentData
        });
      } else {
        console.log('❌ Payment not successful:', {
          status: paymentData.status,
          amount: paymentData.amount
        });
        
        res.status(400).json({
          success: false,
          message: `Payment was not successful. Status: ${paymentData.status}`
        });
      }
    } else {
      console.log('❌ Flutterwave API returned error:', result.message);
      res.status(400).json({
        success: false,
        message: result.message || 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave payment verification error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Provide more specific error messages
    let errorMessage = 'Payment verification failed. Please try again.';
    
    if (error.response?.status === 404) {
      errorMessage = 'Payment reference not found. Please check your payment details.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please contact support.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Invalid payment reference.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
}
