const express = require('express');
const axios = require('axios');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for webhook endpoints
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 webhook requests per minute
  message: {
    success: false,
    message: 'Too many webhook requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validatePaymentInput = (req, res, next) => {
  const { email, amount, plan_name, phone_number } = req.body;
  
  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email address is required'
    });
  }
  
  // Amount validation
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required'
    });
  }
  
  // Plan name validation
  if (!plan_name || plan_name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Valid plan name is required'
    });
  }
  
  // Phone number validation (if provided)
  if (phone_number && phone_number.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Phone number must be at least 10 digits'
    });
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
    return res.status(401).json({ 
      success: false,
      error: 'Missing webhook signature' 
    });
  }
  
  const hash = crypto
    .createHmac('sha256', secretHash)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== signature) {
    console.log('❌ Invalid webhook signature');
    return res.status(401).json({ 
      success: false,
      error: 'Invalid webhook signature' 
    });
  }
  
  console.log('✅ Webhook signature verified');
  next();
};

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-eb50a05e74e4a648510719bfa75dad5b-1993ab9913bvt-X';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-454fa0a1faa931dcccf6672ed71645cd-X';
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY || 'eb50a05e74e459b334aad266';
const FLUTTERWAVE_PLAN_ID = process.env.FLUTTERWAVE_PLAN_ID || '146851';

// Check if Flutterwave is configured
console.log('✅ Flutterwave configured with credentials');
console.log('🔑 Secret Key:', FLUTTERWAVE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('🔑 Public Key:', FLUTTERWAVE_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('🔑 Encryption Key:', FLUTTERWAVE_ENCRYPTION_KEY ? 'SET' : 'NOT SET');
console.log('🔑 Plan ID:', FLUTTERWAVE_PLAN_ID);

// Initialize Flutterwave payment
router.post('/initialize-payment', paymentLimiter, validatePaymentInput, async (req, res) => {
  try {
    console.log('🔧 Flutterwave Environment Variables:');
    console.log('FLUTTERWAVE_SECRET_KEY:', FLUTTERWAVE_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('FLUTTERWAVE_PUBLIC_KEY:', FLUTTERWAVE_PUBLIC_KEY ? 'SET' : 'NOT SET');
    console.log('FLUTTERWAVE_ENCRYPTION_KEY:', FLUTTERWAVE_ENCRYPTION_KEY ? 'SET' : 'NOT SET');
    console.log('FLUTTERWAVE_PLAN_ID:', FLUTTERWAVE_PLAN_ID ? 'SET' : 'NOT SET');
    
    const { email, amount, plan_name, user_id, tx_ref, customer_name, phone_number } = req.body;
    
    console.log('📝 Payment request received:', { email, amount, plan_name, user_id });
    
    if (!email || !amount || !plan_name) {
      console.log('❌ Missing required fields:', { email: !!email, amount: !!amount, plan_name: !!plan_name });
      return res.status(400).json({ 
        success: false, 
        message: 'Email, amount, and plan name are required' 
      });
    }

    if (!FLUTTERWAVE_SECRET_KEY) {
      console.log('❌ Flutterwave not configured on server');
      return res.status(500).json({ 
        success: false, 
        message: 'Flutterwave not configured on server' 
      });
    }

    // Generate transaction reference if not provided
    const transactionRef = tx_ref || `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Detect if request is from mobile
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    console.log('📱 Device detection:', { userAgent, isMobile });
    
    // Ensure production URLs are always used in production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.thekingezekielacademy.com'
      : (process.env.CLIENT_URL || 'http://localhost:3000');

    // Prepare payment data with mobile-optimized settings
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
      // Disable fingerprinting to prevent errors
      disable_fingerprint: true,
      disable_tracking: true,
      disable_analytics: true,
      // Additional parameters to ensure proper configuration
      init_url: `${baseUrl}/payment-verification`,
      callback_url: `${baseUrl}/payment-verification`,
      // Force disable all tracking and fingerprinting
      fingerprinting: false,
      tracking: false,
      analytics: false,
      // Add cache busting to prevent cached fingerprinting scripts
      _t: Date.now(),
      _v: '1.0.0'
    };

    // Simple Flutterwave API call using axios
    console.log('🚀 Calling Flutterwave API...');
    console.log('📡 Payment Data:', JSON.stringify(paymentData, null, 2));
    
    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentData, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Flutterwave API response status:', response.status);
    const result = response.data;
    console.log('📡 Flutterwave API response:', JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      console.log('✅ Flutterwave payment initialized successfully:', result.data.tx_ref);
      
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
      console.error('❌ Flutterwave payment initialization failed:', result.message);
      res.status(400).json({
        success: false,
        message: result.message || 'Payment initialization failed. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave payment initialization error:', error);
    
    let errorMessage = 'Payment initialization failed. Please try again.';
    if (error.response) {
      // Server responded with error status
      errorMessage = `Payment initialization failed: ${error.response.data?.message || error.message}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Payment initialization failed: Network error. Please check your connection.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Verify Flutterwave payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { tx_ref } = req.body;
    
    if (!tx_ref) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction reference is required' 
      });
    }

    // Call Flutterwave API to verify payment
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${tx_ref}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.status === 'success' && result.data.status === 'successful') {
      // Payment is successful
      const paymentData = {
        tx_ref: result.data.tx_ref,
        amount: result.data.amount,
        currency: result.data.currency,
        customerEmail: result.data.customer.email,
        status: result.data.status,
        paidAt: result.data.created_at,
        metadata: result.data.meta
      };
      
      console.log('✅ Payment verified successfully:', paymentData.tx_ref);
      
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: paymentData
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Payment not successful',
        data: result.data
      });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment' 
    });
  }
});

// Create Flutterwave subscription
router.post('/create-subscription', paymentLimiter, async (req, res) => {
  try {
    const { customerCode, email, userId, planId } = req.body;
    
    if (!customerCode || !email || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer code, email, and user ID are required' 
      });
    }

    // Create subscription via Flutterwave API
    const subscriptionData = {
      customer: customerCode,
      plan: planId || FLUTTERWAVE_PLAN_ID,
      start_date: new Date().toISOString()
    };

    const response = await axios.post('https://api.flutterwave.com/v3/subscriptions', subscriptionData, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      console.log('✅ Flutterwave subscription created successfully:', result.data.id);
      
      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscription_id: result.data.id,
          customer_code: customerCode,
          status: result.data.status,
          created_at: result.data.created_at
        }
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
      message: 'Failed to create subscription. Please try again.'
    });
  }
});

// Cancel Flutterwave subscription
router.post('/cancel-subscription', paymentLimiter, async (req, res) => {
  try {
    const { subscriptionId, reason = 'User requested cancellation' } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription ID is required' 
      });
    }

    // Cancel subscription via Flutterwave API
    const response = await axios.put(`https://api.flutterwave.com/v3/subscriptions/${subscriptionId}/cancel`, {
      reason: reason
    }, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      console.log('✅ Flutterwave subscription cancelled successfully:', subscriptionId);
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription_id: subscriptionId,
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription cancellation failed'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription. Please try again.'
    });
  }
});

// Get Flutterwave subscription details
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    if (!subscriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription ID is required' 
      });
    }

    // Get subscription details via Flutterwave API
    const response = await axios.get(`https://api.flutterwave.com/v3/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      console.log('✅ Flutterwave subscription details retrieved:', subscriptionId);
      
      res.json({
        success: true,
        message: 'Subscription details retrieved successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to retrieve subscription details'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription details. Please try again.'
    });
  }
});

// List Flutterwave subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const { customer_email, status, page = 1, per_page = 20 } = req.query;
    
    let url = 'https://api.flutterwave.com/v3/subscriptions?';
    const params = new URLSearchParams();
    
    if (customer_email) params.append('customer_email', customer_email);
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('per_page', per_page);
    
    url += params.toString();

    // Get subscriptions via Flutterwave API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      console.log('✅ Flutterwave subscriptions retrieved successfully');
      
      res.json({
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to retrieve subscriptions'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave subscriptions list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscriptions. Please try again.'
    });
  }
});

// Flutterwave webhook endpoint
router.post('/webhook', webhookLimiter, verifyWebhookSignature, async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature (optional but recommended)
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (secretHash) {
      const hash = crypto
        .createHmac('sha256', secretHash)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== req.headers['verif-hash']) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Handle different webhook events
    switch (event.event) {
      case 'charge.completed':
        // Payment was successful
        const payment = event.data;
        console.log('✅ Payment completed:', payment.tx_ref);
        
        // TODO: Update user subscription in database
        // await processSuccessfulPayment(payment);
        break;
        
      case 'charge.failed':
        // Payment failed
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

module.exports = router;
