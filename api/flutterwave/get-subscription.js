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
    
    const { subscription_id } = req.body;
    
    console.log('📝 Getting Flutterwave subscription:', { subscription_id });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    // Get subscription via Flutterwave API
    const response = await axios.get(`https://api.flutterwave.com/v3/subscriptions/${subscription_id}`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      res.json({
        success: true,
        message: 'Subscription retrieved successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to retrieve subscription'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave subscription retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve subscription. Please try again.' 
    });
  }
}
