const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

// Import routes
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Paystack webhook secret (get this from your Paystack dashboard)
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Verify webhook signature
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-paystack-signature'];
  
  if (!signature) {
    return res.status(401).json({ error: 'No signature provided' });
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// Paystack webhook endpoint
app.post('/api/webhooks/paystack', verifyWebhookSignature, async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log('📨 Paystack webhook received:', event);

    // Import the webhook handler
    const { PaystackWebhookHandler } = require('./webhookHandler');
    
    // Process the webhook
    await PaystackWebhookHandler.handleWebhook({ event, data });
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment verification endpoint
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    
    if (!reference || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reference and userId are required' 
      });
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      },
    });

    const result = await response.json();
    
    if (result.status && result.data.status === 'success') {
      console.log('✅ Payment verified successfully:', result.data);
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: result.data 
      });
    } else {
      console.log('❌ Payment verification failed:', result.message);
      res.json({ 
        success: false, 
        message: result.message || 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed' 
    });
  }
});

// Contact routes
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Paystack webhook server is running'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Paystack webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhooks/paystack`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
