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
    
    const { customerCode, email, userId } = req.body;
    
    console.log('📝 Creating Flutterwave subscription:', { customerCode, email, userId });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    // Create subscription via Flutterwave API
    const subscriptionData = {
      customer: customerCode,
      plan: process.env.FLUTTERWAVE_PLAN_ID || '146829', // Default plan ID
      start_date: new Date().toISOString().split('T')[0] // Today's date
    };

    const response = await axios.post('https://api.flutterwave.com/v3/subscriptions', subscriptionData, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription creation failed'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave subscription creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Subscription creation failed. Please try again.' 
    });
  }
}
