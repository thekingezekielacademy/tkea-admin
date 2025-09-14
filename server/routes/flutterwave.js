const express = require('express');
const router = express.Router();
const crypto = require('crypto');

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
      redirect_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-verification`,
      payment_options: isMobile ? 'card,mobilemoney,ussd,banktransfer' : 'card,mobilemoney,ussd',
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
        timestamp: new Date().toISOString(),
        device_type: isMobile ? 'mobile' : 'desktop'
      }
    };

    // Call Flutterwave API to initialize payment with retry logic for mobile
    console.log('🚀 Calling Flutterwave API...');
    let response;
    let result;
    let retryCount = 0;
    const maxRetries = isMobile ? 3 : 1; // More retries for mobile
    
    while (retryCount <= maxRetries) {
      try {
        response = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'King-Ezekiel-Academy/1.0'
          },
          body: JSON.stringify(paymentData)
        });

        console.log(`📡 Flutterwave API response status (attempt ${retryCount + 1}):`, response.status);
        result = await response.json();
        console.log(`📡 Flutterwave API response (attempt ${retryCount + 1}):`, JSON.stringify(result, null, 2));
        
        // If successful, break out of retry loop
        if (result.status === 'success') {
          break;
        }
        
        // If not successful and we have retries left, wait and retry
        if (retryCount < maxRetries) {
          console.log(`⚠️ Flutterwave API failed, retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          break;
        }
      } catch (fetchError) {
        console.error(`❌ Flutterwave API fetch error (attempt ${retryCount + 1}):`, fetchError);
        if (retryCount < maxRetries) {
          console.log(`⚠️ Fetch error, retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          throw fetchError;
        }
      }
    }

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
      const errorMessage = isMobile 
        ? `Mobile payment initialization failed: ${result.message || 'Please try again or use a different payment method'}`
        : `Payment initialization failed: ${result.message || 'Please try again'}`;
      
      res.status(400).json({
        success: false,
        message: errorMessage,
        device_type: isMobile ? 'mobile' : 'desktop',
        retry_count: retryCount
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave payment initialization error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    const errorMessage = isMobile 
      ? `Mobile payment initialization failed: ${error.message}. Please try again or contact support.`
      : `Payment initialization failed: ${error.message}. Please try again.`;
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      device_type: isMobile ? 'mobile' : 'desktop',
      error_code: error.code || 'UNKNOWN_ERROR'
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
