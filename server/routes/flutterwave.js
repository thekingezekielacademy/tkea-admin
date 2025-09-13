const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Flutterwave configuration - temporarily hardcoded for testing
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-eb50a05e74e4a648510719bfa75dad5b-1993ab9913bvt-X';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-454fa0a1faa931dcccf6672ed71645cd-X';
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY || 'eb50a05e74e459b334aad266';
const FLUTTERWAVE_PLAN_ID = process.env.FLUTTERWAVE_PLAN_ID || '146851';

// Debug environment variables
console.log('🔧 Flutterwave Environment Variables:');
console.log('FLUTTERWAVE_SECRET_KEY:', FLUTTERWAVE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('FLUTTERWAVE_PUBLIC_KEY:', FLUTTERWAVE_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('FLUTTERWAVE_ENCRYPTION_KEY:', FLUTTERWAVE_ENCRYPTION_KEY ? 'SET' : 'NOT SET');
console.log('FLUTTERWAVE_PLAN_ID:', FLUTTERWAVE_PLAN_ID ? 'SET' : 'NOT SET');

// Initialize Flutterwave payment
router.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount, plan_name, user_id, tx_ref, customer_name, phone_number } = req.body;
    
    if (!email || !amount || !plan_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, amount, and plan name are required' 
      });
    }

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'Flutterwave not configured on server' 
      });
    }

    // Generate transaction reference if not provided
    const transactionRef = tx_ref || `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payment data
    const paymentData = {
      tx_ref: transactionRef,
      amount: Number(amount),
      currency: 'NGN',
      redirect_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-verification`,
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: email,
        phone_number: phone_number || '',
        name: customer_name || email.split('@')[0]
      },
      customizations: {
        title: 'King Ezekiel Academy',
        description: `Subscription: ${plan_name}`,
        logo: `${process.env.CLIENT_URL || 'http://localhost:3000'}/favicon.svg`
      },
      meta: {
        user_id: user_id || 'anonymous',
        plan_name: plan_name,
        source: 'king-ezekiel-academy',
        timestamp: new Date().toISOString()
      }
    };

    // Call Flutterwave API to initialize payment
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

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
        message: result.message || 'Payment initialization failed'
      });
    }

  } catch (error) {
    console.error('Flutterwave payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed. Please try again.'
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

// Flutterwave webhook endpoint
router.post('/webhook', async (req, res) => {
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
