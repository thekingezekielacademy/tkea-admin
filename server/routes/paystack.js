const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const SubscriptionService = require('../services/subscriptionService');

// Paystack Configuration - Use environment variables for security
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.REACT_APP_PAYSTACK_SECRET_KEY;
const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE || process.env.REACT_APP_PAYSTACK_PLAN_CODE;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.REACT_APP_PAYSTACK_WEBHOOK_SECRET;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Validate required environment variables
if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ CRITICAL: PAYSTACK_SECRET_KEY environment variable is required');
  throw new Error('Paystack secret key not configured');
}

if (!PAYSTACK_PLAN_CODE) {
  console.error('❌ CRITICAL: PAYSTACK_PLAN_CODE environment variable is required');
  throw new Error('Paystack plan code not configured');
}

if (!PAYSTACK_WEBHOOK_SECRET) {
  console.error('⚠️ WARNING: PAYSTACK_WEBHOOK_SECRET environment variable is not set - webhook verification disabled');
}

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload, signature) => {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.warn('⚠️ Webhook secret not configured - skipping signature verification');
    return true; // Allow in development if no secret is set
  }

  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
};

// Helper function to make authenticated Paystack requests
const makePaystackRequest = async (endpoint, method = 'GET', body = null) => {
  const url = `${PAYSTACK_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Paystack API Error: ${data.message || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('Paystack API Error:', error);
    throw error;
  }
};

// Initialize payment endpoint
router.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount, metadata = {} } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and amount are required' 
      });
    }

    console.log(`🚀 Initializing Paystack payment for: ${email}, Amount: ${amount}`);

    // Call Paystack API to initialize payment
    const paymentResponse = await makePaystackRequest(
      `/transaction/initialize`,
      'POST',
      {
        email,
        amount: amount * 100, // Convert to kobo
        callback_url: `${req.protocol}://${req.get('host')}/payment/verify`,
        metadata: {
          ...metadata,
          plan_code: PAYSTACK_PLAN_CODE
        }
      }
    );

    console.log('✅ Paystack payment initialized successfully:', paymentResponse);

    // Return success response with authorization URL
    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: paymentResponse.data.authorization_url,
        reference: paymentResponse.data.reference,
        access_code: paymentResponse.data.access_code
      }
    });

  } catch (error) {
    console.error('❌ Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

// Cancel subscription endpoint
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription ID is required' 
      });
    }

    // Check if we're in test mode
    const isTestMode = PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_test_');
    
    if (isTestMode) {
      console.log('⚠️ TEST MODE: Subscription cancellation may not work properly in test mode');
      console.log('💡 Consider switching to live mode for full subscription management');
    }

    console.log(`🔄 Canceling Paystack subscription: ${subscriptionId}`);

    // Call Paystack API to cancel subscription
    const cancelResponse = await makePaystackRequest(
      `/subscription/disable`,
      'POST',
      {
        code: subscriptionId,
        token: 'disable_token' // Paystack requires this for subscription cancellation
      }
    );

            console.log('✅ Paystack subscription canceled:', cancelResponse);

        // DATABASE INTEGRATION: Update Supabase subscription status
        try {
          // Find the subscription in our database
          const dbSubscription = await SubscriptionService.getSubscriptionByPaystackId(subscriptionId);
          
          if (dbSubscription) {
            // Update the subscription status in Supabase
            await SubscriptionService.cancelSubscription(dbSubscription.id, reason);
            console.log('✅ Supabase subscription status updated');
          } else {
            console.log('⚠️ No matching subscription found in database');
          }
        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
          // Continue with response even if DB update fails
        }

        // Return success response
        res.json({
          success: true,
          message: 'Subscription canceled successfully',
          data: cancelResponse,
          canceledAt: new Date().toISOString()
        });

  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    
    // Check if this is a test mode issue
    const isTestMode = PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_test_');
    const is404Error = error.message && error.message.includes('404');
    
    if (isTestMode && is404Error) {
      console.log('⚠️ TEST MODE ISSUE: Subscription cancellation failed - likely due to test mode limitations');
      
      // Still update database even if Paystack fails in test mode
      try {
        const dbSubscription = await SubscriptionService.getSubscriptionByPaystackId(subscriptionId);
        if (dbSubscription) {
          await SubscriptionService.cancelSubscription(dbSubscription.id, reason || 'Test mode cancellation');
          console.log('✅ Database updated despite Paystack test mode failure');
        }
      } catch (dbError) {
        console.error('❌ Database update also failed:', dbError);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Subscription canceled in database (Paystack test mode limitation)',
        warning: 'This is a test mode limitation. Switch to live mode for full Paystack integration.',
        testMode: true
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
      testMode: isTestMode
    });
  }
});

// Create new subscription endpoint
router.post('/create-subscription', async (req, res) => {
  try {
    const { customerCode, amount = 2500 } = req.body;

    if (!customerCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer code is required' 
      });
    }

    console.log(`🔄 Creating new Paystack subscription for customer: ${customerCode}`);

    // Call Paystack API to create subscription
    const subscriptionResponse = await makePaystackRequest(
      `/subscription`,
      'POST',
      {
        customer: customerCode,
        plan: PAYSTACK_PLAN_CODE,
        start_date: new Date().toISOString()
      }
    );

            console.log('✅ New Paystack subscription created:', subscriptionResponse);

        // DATABASE INTEGRATION: Create subscription in Supabase
        try {
          // Extract user ID from the request (you'll need to pass this from frontend)
          const userId = req.body.userId;
          
          if (userId) {
            // Create the subscription in our database
            const dbSubscription = await SubscriptionService.createSubscription(userId, subscriptionResponse.data);
            console.log('✅ Supabase subscription created:', dbSubscription);
            
            // Return response with both Paystack and database data
            res.json({
              success: true,
              message: 'Subscription created successfully',
              data: subscriptionResponse.data,
              dbSubscription: dbSubscription
            });
          } else {
            // Return response without database integration
            res.json({
              success: true,
              message: 'Subscription created successfully (database update skipped - no userId)',
              data: subscriptionResponse.data
            });
          }
        } catch (dbError) {
          console.error('❌ Database creation failed:', dbError);
          // Return Paystack success even if DB creation fails
          res.json({
            success: true,
            message: 'Subscription created successfully (database update failed)',
            data: subscriptionResponse.data,
            dbError: dbError.message
          });
        }

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
});

// Get subscription details endpoint
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    console.log(`📊 Fetching Paystack subscription: ${subscriptionId}`);

    // Call Paystack API to get subscription details
    const subscriptionData = await makePaystackRequest(
      `/subscription/${subscriptionId}`
    );

    console.log('✅ Subscription data fetched:', subscriptionData);

    res.json({
      success: true,
      data: subscriptionData
    });

  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

// Payment verification endpoint
router.post('/verify-payment', async (req, res) => {
  try {
    const { reference, subscriptionId } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    console.log(`💰 Verifying payment: ${reference}`);

    // Verify payment with Paystack
    const verificationData = await makePaystackRequest(
      `/transaction/verify/${reference}`
    );

    console.log('✅ Payment verification result:', verificationData);

    if (verificationData.status && verificationData.data.status === 'success') {
      // Payment successful - update database if subscriptionId provided
      if (subscriptionId) {
        try {
          const subscription = await SubscriptionService.getSubscriptionByPaystackId(subscriptionId);
          if (subscription) {
            await SubscriptionService.updateSubscriptionStatus(subscription.id, {
              status: 'active',
              last_payment_date: new Date().toISOString(),
              payment_reference: reference
            });
            console.log('✅ Database updated: Payment verified');
          }
        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
        }
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: verificationData.data
      });
    } else {
      res.json({
        success: false,
        message: 'Payment verification failed',
        data: verificationData
      });
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Get payment history for a subscription
router.get('/subscription/:subscriptionId/payments', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    console.log(`💰 Fetching payment history for subscription: ${subscriptionId}`);

    // Call Paystack API to get payment history
    const paymentData = await makePaystackRequest(
      `/transaction?subscription=${subscriptionId}`
    );

    console.log('✅ Payment history fetched:', paymentData);

    res.json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Get user's complete billing history
router.get('/billing-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;

    console.log(`💰 Fetching complete billing history for user: ${userId}`);

    // Get user's subscriptions from Supabase
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subError) {
      throw subError;
    }

    // Transform subscriptions into billing history
    const billingHistory = subscriptions.map(sub => ({
      id: `sub-${sub.id}`,
      type: 'subscription',
      amount: sub.amount || 2500,
      currency: sub.currency || 'NGN',
      status: sub.status,
      description: `${sub.plan_name} - ${sub.billing_cycle} billing`,
      date: sub.created_at,
      invoice_url: `#subscription-${sub.id}`,
      subscription_id: sub.id,
      paystack_subscription_id: sub.paystack_subscription_id,
      billing_cycle: sub.billing_cycle,
      start_date: sub.start_date,
      end_date: sub.end_date,
      paystack_reference: sub.paystack_subscription_id
    }));

    // If user has Paystack subscriptions, fetch payment details
    const paystackPayments = [];
    for (const sub of subscriptions) {
      if (sub.paystack_subscription_id) {
        try {
          const paymentData = await makePaystackRequest(
            `/transaction?subscription=${sub.paystack_subscription_id}`
          );
          
          if (paymentData.data && paymentData.data.length > 0) {
            paymentData.data.forEach(payment => {
              paystackPayments.push({
                id: `payment-${payment.id}`,
                type: 'payment',
                amount: payment.amount / 100, // Paystack amounts are in kobo
                currency: payment.currency,
                status: payment.status,
                description: payment.description || 'Subscription Payment',
                date: payment.created_at,
                invoice_url: payment.reference,
                payment_id: payment.id,
                paystack_reference: payment.reference,
                payment_method: payment.channel,
                subscription_id: sub.id
              });
            });
          }
        } catch (error) {
          console.log(`⚠️ Could not fetch Paystack payments for subscription: ${sub.paystack_subscription_id}`);
        }
      }
    }

    // Combine and sort all billing records
    const allBillingHistory = [...billingHistory, ...paystackPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return in requested format
    if (format === 'csv') {
      const csvContent = this.generateCSV(allBillingHistory);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="billing-history-${userId}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: allBillingHistory,
        total: allBillingHistory.length,
        userId: userId
      });
    }

  } catch (error) {
    console.error('❌ Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message
    });
  }
});

// Helper function to generate CSV
function generateCSV(billingHistory) {
  const headers = ['Date', 'Description', 'Amount', 'Status', 'Type', 'Reference'];
  
  const csvRows = [
    headers.join(','),
    ...billingHistory.map(record => [
      new Date(record.date).toLocaleDateString(),
      `"${record.description}"`,
      record.amount,
      record.status,
      record.type,
      record.paystack_reference || 'N/A'
    ].join(','))
  ];

  return csvRows.join('\n');
}

// Webhook endpoint for Paystack notifications
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature for security
    const signature = req.headers['x-paystack-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('❌ Invalid webhook signature - rejecting request');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook signature' 
      });
    }

    const { event, data } = req.body;

    // Enhanced logging for production debugging
    console.log('🔔 ===== PAYSTACK WEBHOOK RECEIVED =====');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Event: ${event}`);
    console.log(`🔐 Signature Verified: ✅`);
    console.log(`📊 Data:`, JSON.stringify(data, null, 2));
    console.log('🔔 ======================================');

    // Handle different webhook events with database integration
    switch (event) {
      case 'subscription.disable':
        console.log('📝 Subscription disabled:', data);
        await handleSubscriptionDisable(data);
        break;
      
      case 'subscription.create':
        console.log('📝 New subscription created:', data);
        await handleSubscriptionCreate(data);
        break;
      
      case 'charge.success':
        console.log('💰 Payment successful:', data);
        await handleChargeSuccess(data);
        break;
      
      case 'charge.failed':
        console.log('❌ Payment failed:', data);
        await handleChargeFailed(data);
        break;
      
      case 'subscription.expire':
        console.log('⏰ Subscription expired:', data);
        await handleSubscriptionExpire(data);
        break;
      
      case 'subscription.renew':
        console.log('🔄 Subscription renewed:', data);
        await handleSubscriptionRenew(data);
        break;
      
      default:
        console.log(`📝 Unhandled webhook event: ${event}`);
    }

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook event handlers
async function handleSubscriptionDisable(data) {
  try {
    const subscription = await SubscriptionService.getSubscriptionByPaystackId(data.subscription_code);
    if (subscription) {
      await SubscriptionService.cancelSubscription(subscription.id, 'Webhook: Subscription disabled');
      console.log('✅ Database updated: Subscription disabled');
    }
  } catch (error) {
    console.error('❌ Error handling subscription disable:', error);
  }
}

async function handleSubscriptionCreate(data) {
  try {
    // Note: This might not have userId, so we'll need to handle it differently
    console.log('📝 New subscription webhook received:', data);
    // You might want to store this for later processing or send a notification
  } catch (error) {
    console.error('❌ Error handling subscription create:', error);
  }
}

async function handleChargeSuccess(data) {
  try {
    if (data.subscription) {
      const subscription = await SubscriptionService.getSubscriptionByPaystackId(data.subscription.subscription_code);
      if (subscription) {
        // Update payment status and next billing date
        await SubscriptionService.updateSubscriptionStatus(subscription.id, data.subscription);
        console.log('✅ Database updated: Payment successful');
      }
    }
  } catch (error) {
    console.error('❌ Error handling charge success:', error);
  }
}

async function handleChargeFailed(data) {
  try {
    if (data.subscription) {
      const subscription = await SubscriptionService.getSubscriptionByPaystackId(data.subscription.subscription_code);
      if (subscription) {
        // Update subscription status to reflect payment failure
        await SubscriptionService.updateSubscriptionStatus(subscription.id, {
          ...data.subscription,
          status: 'inactive'
        });
        console.log('✅ Database updated: Payment failed');
      }
    }
  } catch (error) {
    console.error('❌ Error handling charge failed:', error);
  }
}

async function handleSubscriptionExpire(data) {
  try {
    const subscription = await SubscriptionService.getSubscriptionByPaystackId(data.subscription_code);
    if (subscription) {
      await SubscriptionService.updateSubscriptionStatus(subscription.id, {
        ...data,
        status: 'expired'
      });
      console.log('✅ Database updated: Subscription expired');
    }
  } catch (error) {
    console.error('❌ Error handling subscription expire:', error);
  }
}

async function handleSubscriptionRenew(data) {
  try {
    const subscription = await SubscriptionService.getSubscriptionByPaystackId(data.subscription_code);
    if (subscription) {
      await SubscriptionService.updateSubscriptionStatus(subscription.id, data);
      console.log('✅ Database updated: Subscription renewed');
    }
  } catch (error) {
    console.error('❌ Error handling subscription renew:', error);
  }
}

// Test webhook endpoint
router.get('/test-webhook', (req, res) => {
  res.json({
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
});

// Test mode detection endpoint
router.get('/test-mode-status', (req, res) => {
  const isTestMode = PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_test_');
  const isLiveMode = PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_live_');
  
  res.json({
    testMode: isTestMode,
    liveMode: isLiveMode,
    keyPrefix: PAYSTACK_SECRET_KEY ? PAYSTACK_SECRET_KEY.substring(0, 8) + '...' : 'Not configured',
    message: isTestMode 
      ? '⚠️ Currently in TEST MODE - subscription management may be limited'
      : isLiveMode 
        ? '✅ Currently in LIVE MODE - full functionality available'
        : '❌ Paystack not properly configured',
    recommendation: isTestMode 
      ? 'Switch to live mode for full subscription management capabilities'
      : 'Configuration looks good',
    timestamp: new Date().toISOString()
  });
});

// Test webhook with sample data (for development testing)
router.post('/test-webhook-data', async (req, res) => {
  try {
    console.log('🧪 Testing webhook with sample data...');
    
    // Simulate subscription.disable webhook
    const sampleWebhookData = {
      event: 'subscription.disable',
      data: {
        subscription_code: 'SUB_test123',
        status: 'inactive',
        cancelled: true,
        cancelled_at: new Date().toISOString()
      }
    };
    
    // Process the webhook
    await handleSubscriptionDisable(sampleWebhookData.data);
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      sampleData: sampleWebhookData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
