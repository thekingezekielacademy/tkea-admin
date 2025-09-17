// Dynamic imports for Vercel serverless functions

// Input validation middleware (for payment initialization)
const validatePaymentInput = (req, res, next) => {
  const { email, amount, plan_name, phone_number } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required' });
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  if (!plan_name || plan_name.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Valid plan name is required' });
  }
  if (phone_number && phone_number.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Phone number must be at least 10 digits' });
  }
  next();
};

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

  // Validate input
  validatePaymentInput(req, res, () => {
    handlePaymentInitialization(req, res);
  });
}

async function handlePaymentInitialization(req, res) {
  try {
    // Dynamic import for Vercel serverless functions
    const axios = (await import('axios')).default;
    
    const { email, amount, plan_name, user_id, tx_ref, customer_name, phone_number } = req.body;

    console.log('📝 Payment request received:', { email, amount, plan_name, user_id });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    const transactionRef = tx_ref || `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // Ensure production URLs are always used in production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.thekingezekielacademy.com'
      : (process.env.CLIENT_URL || 'http://localhost:3000');
    
    console.log('🔧 Payment URL Configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      CLIENT_URL: process.env.CLIENT_URL,
      baseUrl: baseUrl,
      redirect_url: `${baseUrl}/payment-verification`,
      webhook_url: `${baseUrl}/api/flutterwave/webhook`,
      logo: `${baseUrl}/favicon.svg`
    });

    const paymentData = {
      tx_ref: transactionRef,
      amount: Number(amount),
      currency: 'NGN',
      redirect_url: `${baseUrl}/payment-verification`,
      webhook_url: `${baseUrl}/api/flutterwave/webhook`,
      payment_options: isMobile ? 'card,mobilemoney,ussd,banktransfer' : 'card,mobilemoney,ussd',
      customer: {
        email: email,
        phone_number: phone_number || '',
        name: customer_name || email.split('@')[0]
      },
      customizations: {
        title: 'King Ezekiel Academy',
        description: `Subscription: ${plan_name}`,
        logo: `${baseUrl}/favicon.svg`
      },
      meta: {
        user_id: user_id || 'anonymous',
        plan_name: plan_name,
        source: 'king-ezekiel-academy',
        timestamp: new Date().toISOString(),
        device_type: isMobile ? 'mobile' : 'desktop',
        cache_bust: Date.now() // Add cache busting
      },
      disable_fingerprint: true,
      disable_tracking: true,
      disable_analytics: true,
      // Additional parameters to ensure proper configuration
      init_url: `${baseUrl}/payment-verification`,
      callback_url: `${baseUrl}/payment-verification`,
      // Force disable all fingerprinting and tracking
      fingerprinting: false,
      tracking: false,
      analytics: false,
      // Prevent auto-cancel dialogs
      auto_close: false,
      close_on_success: false
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentData, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          tx_ref: result.data.tx_ref,
          link: result.data.link,
          authorization_url: result.data.link,
          amount: result.data.amount,
          currency: result.data.currency
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment initialization failed. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave payment initialization error:', error);
    let errorMessage = 'Payment initialization failed. Please try again.';
    if (error.response) {
      errorMessage = `Payment initialization failed: ${error.response.data?.message || error.message}`;
    } else if (error.request) {
      errorMessage = 'Payment initialization failed: Network error. Please check your connection.';
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
}
