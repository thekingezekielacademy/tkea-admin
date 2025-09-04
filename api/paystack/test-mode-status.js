/**
 * Paystack Test Mode Status Check
 * 
 * This endpoint checks if Paystack is configured in test mode or live mode
 * and provides diagnostic information.
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const paystackPublicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    // Determine mode based on key prefixes
    const isTestMode = paystackSecretKey && paystackSecretKey.startsWith('sk_test_');
    const isLiveMode = paystackSecretKey && paystackSecretKey.startsWith('sk_live_');
    
    // Get key prefix for security (don't expose full key)
    const keyPrefix = paystackSecretKey ? paystackSecretKey.substring(0, 8) + '...' : 'Not configured';
    const publicKeyPrefix = paystackPublicKey ? paystackPublicKey.substring(0, 8) + '...' : 'Not configured';
    
    // Determine status message
    let message, recommendation;
    if (isTestMode) {
      message = '⚠️ Currently in TEST MODE - subscription management may be limited';
      recommendation = 'Switch to live mode for full subscription management capabilities';
    } else if (isLiveMode) {
      message = '✅ Currently in LIVE MODE - full functionality available';
      recommendation = 'Configuration looks good';
    } else {
      message = '❌ Paystack not properly configured';
      recommendation = 'Configure PAYSTACK_SECRET_KEY environment variable';
    }

    // Return diagnostic information
    res.status(200).json({
      success: true,
      testMode: isTestMode,
      liveMode: isLiveMode,
      configured: !!(paystackSecretKey && paystackPublicKey),
      secretKeyPrefix: keyPrefix,
      publicKeyPrefix: publicKeyPrefix,
      message: message,
      recommendation: recommendation,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      // Additional diagnostic info
      diagnostics: {
        hasSecretKey: !!paystackSecretKey,
        hasPublicKey: !!paystackPublicKey,
        secretKeyLength: paystackSecretKey ? paystackSecretKey.length : 0,
        publicKeyLength: paystackPublicKey ? paystackPublicKey.length : 0,
        nodeVersion: process.version,
        platform: process.platform
      }
    });

  } catch (error) {
    console.error('❌ Error checking Paystack mode status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to check Paystack mode status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
