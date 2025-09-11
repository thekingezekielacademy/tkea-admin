// Test endpoint to verify Flutterwave configuration
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Check environment variables
    const config = {
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY ? 'SET' : 'MISSING',
      FLUTTERWAVE_PLAN_ID: process.env.FLUTTERWAVE_PLAN_ID ? 'SET' : 'MISSING',
      REACT_APP_FLUTTERWAVE_SECRET_KEY: process.env.REACT_APP_FLUTTERWAVE_SECRET_KEY ? 'SET' : 'MISSING',
      REACT_APP_FLUTTERWAVE_PLAN_ID: process.env.REACT_APP_FLUTTERWAVE_PLAN_ID ? 'SET' : 'MISSING',
    };

    // Check if keys have proper format
    const secretKeyValid = process.env.FLUTTERWAVE_SECRET_KEY?.startsWith('FLWSECK');
    const planIdValid = process.env.FLUTTERWAVE_PLAN_ID?.length > 0;

    return res.status(200).json({
      success: true,
      message: 'Configuration check completed',
      config,
      validation: {
        secretKeyValid,
        planIdValid,
        allValid: secretKeyValid && planIdValid
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Configuration test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Configuration test failed',
      error: error.message
    });
  }
}
