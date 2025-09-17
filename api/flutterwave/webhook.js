// Flutterwave Webhook Handler
// This endpoint receives webhook notifications from Flutterwave

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Flutterwave webhook received:', req.body);

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];
    
    if (webhookSecret && signature) {
      // Verify the webhook signature here
      // This is a basic example - implement proper signature verification
      console.log('🔐 Webhook signature verification:', signature);
    }

    const { event, data } = req.body;
    
    console.log('📊 Webhook event:', event);
    console.log('📊 Webhook data:', data);

    // Handle different webhook events
    switch (event) {
      case 'charge.completed':
        await handlePaymentCompleted(data);
        break;
      
      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      
      default:
        console.log('⚠️ Unknown webhook event:', event);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook received successfully' 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
}

// Handle successful payment
async function handlePaymentCompleted(data) {
  console.log('✅ Payment completed:', data);
  
  try {
    // Extract payment details
    const {
      id,
      reference,
      amount,
      currency,
      status,
      customer: { email, name, phone_number },
      created_at,
      paid_at
    } = data;

    console.log('📊 Payment details:', {
      id,
      reference,
      amount,
      currency,
      status,
      email,
      name,
      phone_number
    });

    // Here you can:
    // - Update user subscription status in Supabase
    // - Send confirmation emails
    // - Update database records
    // - Trigger other business logic
    
    // Example: Update subscription status in database
    // await updateSubscriptionStatus(email, 'active', {
    //   reference,
    //   amount,
    //   currency,
    //   paid_at
    // });

    console.log('✅ Payment processing completed successfully');
  } catch (error) {
    console.error('❌ Error processing payment completion:', error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(data) {
  console.log('🚀 Subscription created:', data);
  
  // Here you can:
  // - Create user subscription record
  // - Send welcome emails
  // - Set up recurring billing
}

// Handle subscription updates
async function handleSubscriptionUpdated(data) {
  console.log('🔄 Subscription updated:', data);
  
  // Here you can:
  // - Update subscription details
  // - Handle plan changes
  // - Update billing information
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(data) {
  console.log('❌ Subscription cancelled:', data);
  
  // Here you can:
  // - Update subscription status to cancelled
  // - Send cancellation confirmation
  // - Handle refunds if needed
}
