const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    'https://app.thekingezekielacademy.com',
    'https://thekingezekielacademy.com',
    'http://localhost:3000', // For development
    'http://localhost:3001'  // For development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'King Ezekiel Academy API is running',
    paymentProvider: 'Flutterwave'
  });
});

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

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

  if (!secretHash) {
    console.log('⚠️ Flutterwave webhook secret not configured - skipping signature verification');
    return next();
  }

  const signature = req.headers['verif-hash'];

  if (!signature) {
    return res.status(401).json({ success: false, error: 'Missing webhook signature' });
  }

  const hash = crypto
    .createHmac('sha256', secretHash)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    console.log('❌ Invalid webhook signature');
    return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
  }

  console.log('✅ Webhook signature verified');
  next();
};

// Flutterwave payment initialization endpoint
app.post('/api/flutterwave/initialize-payment', validatePaymentInput, async (req, res) => {
  try {
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
});

// Flutterwave webhook endpoint
app.post('/api/flutterwave/webhook', verifyWebhookSignature, async (req, res) => {
  try {
    const event = req.body;
    console.log('✅ Webhook event received:', event.event, event.data?.tx_ref);

    switch (event.event) {
      case 'charge.completed':
        const payment = event.data;
        console.log('✅ Payment completed:', payment.tx_ref);
        // TODO: Update user subscription in database
        break;
      case 'charge.failed':
        const failedPayment = event.data;
        console.log('❌ Payment failed:', failedPayment.tx_ref);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Create Flutterwave subscription endpoint
app.post('/api/flutterwave/create-subscription', async (req, res) => {
  try {
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
});

// Verify Flutterwave payment endpoint
app.post('/api/flutterwave/verify-payment', async (req, res) => {
  try {
    const { reference, transaction_id } = req.body;
    
    console.log('📝 Verifying Flutterwave payment:', { reference, transaction_id });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    // Verify payment via Flutterwave API
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed. Please try again.' 
    });
  }
});

// Get Flutterwave subscription endpoint
app.post('/api/flutterwave/get-subscription', async (req, res) => {
  try {
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
});

// Get Flutterwave billing history endpoint
app.get('/api/flutterwave/billing-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;
    
    console.log('📝 Getting Flutterwave billing history:', { userId, format });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    // Get transactions for the user
    const response = await axios.get('https://api.flutterwave.com/v3/transactions', {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
        to: new Date().toISOString().split('T')[0], // Today
        page: 1,
        per_page: 100
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      const transactions = result.data || [];
      
      if (format === 'csv') {
        // Generate CSV format
        const csvHeader = 'Date,Reference,Amount,Currency,Status,Description\n';
        const csvRows = transactions.map(tx => 
          `${tx.created_at?.split('T')[0] || ''},${tx.tx_ref || ''},${tx.amount || 0},${tx.currency || 'NGN'},${tx.status || ''},${tx.narration || ''}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-history-${userId}.csv"`);
        res.send(csvHeader + csvRows);
      } else {
        res.json({
          success: true,
          message: 'Billing history retrieved successfully',
          data: transactions
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to retrieve billing history'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave billing history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve billing history. Please try again.' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

module.exports = app;
