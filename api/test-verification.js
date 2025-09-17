// Test endpoint for payment verification
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

  try {
    console.log('🧪 Test verification endpoint called');
    
    // Test environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      FLUTTERWAVE_SECRET_KEY_EXISTS: !!process.env.FLUTTERWAVE_SECRET_KEY,
      FLUTTERWAVE_SECRET_KEY_PREFIX: process.env.FLUTTERWAVE_SECRET_KEY?.substring(0, 10) + '...',
      FLUTTERWAVE_PUBLIC_KEY_EXISTS: !!process.env.FLUTTERWAVE_PUBLIC_KEY,
      FLUTTERWAVE_PUBLIC_KEY_PREFIX: process.env.FLUTTERWAVE_PUBLIC_KEY?.substring(0, 10) + '...'
    };

    console.log('🔧 Environment variables check:', envCheck);

    res.json({
      success: true,
      message: 'Test verification endpoint working',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test verification failed',
      error: error.message 
    });
  }
}
