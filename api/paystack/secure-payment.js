// =====================================================
// SECURE PAYSTACK PAYMENT API
// Handles all Paystack operations server-side to protect secret keys
// =====================================================

const express = require('express');
const router = express.Router();

// Environment variables (server-side only)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE;

// Validate required environment variables
if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ CRITICAL: PAYSTACK_SECRET_KEY environment variable is required');
}

if (!PAYSTACK_PUBLIC_KEY) {
  console.error('❌ CRITICAL: PAYSTACK_PUBLIC_KEY environment variable is required');
}

// =====================================================
// 1. INITIALIZE PAYMENT
// =====================================================
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, reference, metadata = {} } = req.body;

    if (!email || !amount || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Email, amount, and reference are required'
      });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        metadata: {
          ...metadata,
          source: 'king-ezekiel-academy',
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();

    if (result.status) {
      res.json({
        success: true,
        data: {
          authorization_url: result.data.authorization_url,
          access_code: result.data.access_code,
          reference: result.data.reference
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment initialization failed'
      });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// =====================================================
// 2. VERIFY PAYMENT
// =====================================================
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required'
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// =====================================================
// 3. CREATE SUBSCRIPTION
// =====================================================
router.post('/create-subscription', async (req, res) => {
  try {
    const { customer_code, plan_code, start_date } = req.body;

    if (!customer_code || !plan_code) {
      return res.status(400).json({
        success: false,
        message: 'Customer code and plan code are required'
      });
    }

    const response = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customer_code,
        plan: plan_code,
        start_date: start_date || new Date().toISOString()
      })
    });

    const result = await response.json();

    if (result.status) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription creation failed'
      });
    }
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// =====================================================
// 4. CANCEL SUBSCRIPTION
// =====================================================
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscription_code } = req.body;

    if (!subscription_code) {
      return res.status(400).json({
        success: false,
        message: 'Subscription code is required'
      });
    }

    const response = await fetch(`https://api.paystack.co/subscription/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: subscription_code,
        token: 'dummy_token' // Paystack requires this field
      })
    });

    const result = await response.json();

    if (result.status) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription cancellation failed'
      });
    }
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// =====================================================
// 5. GET SUBSCRIPTION DETAILS
// =====================================================
router.get('/subscription/:subscription_code', async (req, res) => {
  try {
    const { subscription_code } = req.params;

    const response = await fetch(`https://api.paystack.co/subscription/${subscription_code}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const result = await response.json();

    if (result.status) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to fetch subscription'
      });
    }
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// =====================================================
// 6. HEALTH CHECK
// =====================================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Paystack API is running',
    timestamp: new Date().toISOString(),
    environment: {
      hasSecretKey: !!PAYSTACK_SECRET_KEY,
      hasPublicKey: !!PAYSTACK_PUBLIC_KEY,
      hasPlanCode: !!PAYSTACK_PLAN_CODE
    }
  });
});

module.exports = router;
