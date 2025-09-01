import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check environment variables
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    const envVars = {
      hasSecretKey: !!paystackSecretKey,
      hasPublicKey: !!paystackPublicKey,
      secretKeyPrefix: paystackSecretKey ? paystackSecretKey.substring(0, 10) + '...' : 'NOT_SET',
      publicKeyPrefix: paystackPublicKey ? paystackPublicKey.substring(0, 10) + '...' : 'NOT_SET',
      allPaystackVars: Object.keys(process.env).filter(key => key.includes('PAYSTACK'))
    };

    console.log('🔧 Test API Route Debug:', envVars);

    return res.status(200).json({
      success: true,
      message: 'Paystack environment check',
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test API error:', error);
    
    return res.status(500).json({
      error: 'Test API error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
