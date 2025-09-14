const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
const FLUTTERWAVE_PLAN_ID = process.env.FLUTTERWAVE_PLAN_ID;

// Check if Flutterwave is configured
if (!FLUTTERWAVE_SECRET_KEY || !FLUTTERWAVE_PUBLIC_KEY || !FLUTTERWAVE_ENCRYPTION_KEY) {
  console.log('⚠️ Flutterwave not configured - using environment variables');
}

// Initialize Flutterwave payment
router.post('/initialize-payment', async (req, res) => {
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
    
    // Prepare payment data with mobile-optimized settings
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
      }
    };

    // Flutterwave V4 API call
    console.log('🚀 Calling Flutterwave V4 API...');
    const response = await fetch('https://api.flutterwave.com/v4/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 Flutterwave API response status:', response.status);
    const result = await response.json();
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
    res.status(500).json({
      success: false,
      message: `Payment initialization failed: ${error.message}. Please try again.`
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

    // Call Flutterwave V4 API to verify payment
    const response = await fetch(`https://api.flutterwave.com/v4/transactions/${tx_ref}/verify`, {
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

// Flutterwave V4 webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('📨 Flutterwave V4 webhook received:', event);
    
    // Verify webhook signature for V4 (recommended)
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (secretHash) {
      const hash = crypto
        .createHmac('sha256', secretHash)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== req.headers['verif-hash']) {
        console.log('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Handle V4 webhook events
    switch (event.event) {
      case 'charge.completed':
        // Payment was successful
        const payment = event.data;
        console.log('✅ Payment completed:', payment.tx_ref);
        console.log('💰 Payment details:', {
          amount: payment.amount,
          currency: payment.currency,
          customer: payment.customer,
          status: payment.status
        });
        
        // Process successful payment
        await processSuccessfulPayment(payment);
        break;
        
      case 'charge.failed':
        // Payment failed
        const failedPayment = event.data;
        console.log('❌ Payment failed:', failedPayment.tx_ref);
        console.log('💸 Failure details:', {
          reason: failedPayment.processor_response,
          status: failedPayment.status
        });
        break;
        
      case 'subscription.created':
        // Subscription created
        const subscription = event.data;
        console.log('📋 Subscription created:', subscription.subscription_id);
        break;
        
      case 'subscription.cancelled':
        // Subscription cancelled
        const cancelledSub = event.data;
        console.log('🚫 Subscription cancelled:', cancelledSub.subscription_id);
        break;
        
      default:
        console.log('📝 Unhandled V4 webhook event:', event.event);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process successful payment and create subscription
async function processSuccessfulPayment(payment) {
  try {
    console.log('🔄 Processing successful payment:', payment.tx_ref);
    
    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payment.customer.email)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found for payment:', payment.customer.email);
      return;
    }

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userData.id,
        flutterwave_subscription_id: payment.tx_ref,
        flutterwave_customer_code: payment.customer.customer_code || payment.customer.email,
        plan_name: 'Monthly Membership',
        status: 'active',
        amount: payment.amount,
        currency: payment.currency,
        start_date: new Date().toISOString(),
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Error creating subscription:', subError);
    } else {
      console.log('✅ Subscription created successfully:', subscription.id);
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: userData.id,
        flutterwave_transaction_id: payment.id.toString(),
        flutterwave_reference: payment.tx_ref,
        amount: payment.amount,
        currency: payment.currency,
        status: 'success',
        payment_method: payment.payment_type,
        paid_at: payment.created_at,
      });

    if (paymentError) {
      console.error('❌ Error saving payment:', paymentError);
    } else {
      console.log('✅ Payment record saved successfully');
    }

  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
  }
}

module.exports = router;
