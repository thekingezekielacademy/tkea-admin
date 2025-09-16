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
  origin: process.env.CLIENT_URL || 'https://app.thekingezekielacademy.com',
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

    const paymentData = {
      tx_ref: transactionRef,
      amount: Number(amount),
      currency: 'NGN',
      redirect_url: `${process.env.CLIENT_URL || 'https://app.thekingezekielacademy.com'}/payment-verification`,
      webhook_url: `${process.env.CLIENT_URL || 'https://app.thekingezekielacademy.com'}/api/flutterwave/webhook`,
      payment_options: isMobile ? 'card,mobilemoney,ussd,banktransfer' : 'card,mobilemoney,ussd',
      customer: {
        email: email,
        phone_number: phone_number || '',
        name: customer_name || email.split('@')[0]
      },
      customizations: {
        title: 'King Ezekiel Academy',
        description: `Subscription: ${plan_name}`,
        logo: `${process.env.CLIENT_URL || 'https://app.thekingezekielacademy.com'}/favicon.svg`
      },
      meta: {
        user_id: user_id || 'anonymous',
        plan_name: plan_name,
        source: 'king-ezekiel-academy',
        timestamp: new Date().toISOString(),
        device_type: isMobile ? 'mobile' : 'desktop'
      },
      disable_fingerprint: true,
      disable_tracking: true,
      disable_analytics: true
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

module.exports = app;
