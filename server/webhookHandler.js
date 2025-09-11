const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MTQ1NSwiZXhwIjoyMDcwMjQ3NDU1fQ.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw'
);

class PaystackWebhookHandler {
  // Handle webhook events from Paystack
  static async handleWebhook(event) {
    try {
      console.log('🔄 Processing Paystack webhook:', event.event);

      switch (event.event) {
        case 'charge.success':
          await this.handlePaymentSuccess(event.data);
          break;
        
        case 'subscription.create':
          await this.handleSubscriptionCreated(event.data);
          break;
        
        case 'subscription.disable':
          await this.handleSubscriptionDisabled(event.data);
          break;
        
        case 'subscription.enable':
          await this.handleSubscriptionEnabled(event.data);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data);
          break;
        
        case 'invoice.payment_success':
          await this.handlePaymentSuccess(event.data);
          break;
        
        default:
          console.log('⚠️ Unhandled webhook event:', event.event);
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      throw error;
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(data) {
    try {
      const { transaction, customer } = data;
      console.log('💰 Processing successful payment:', transaction.reference);
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found for payment:', customer.email);
        return;
      }

      // Save payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userData.id,
          paystack_transaction_id: transaction.id.toString(),
          paystack_reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'success',
          payment_method: transaction.channel,
          paid_at: transaction.paid_at,
        });

      if (paymentError) {
        console.error('❌ Error saving payment:', paymentError);
      } else {
        console.log('✅ Payment saved successfully for user:', userData.id);
      }
    } catch (error) {
      console.error('❌ Error handling payment success:', error);
    }
  }

  // Handle subscription creation
  static async handleSubscriptionCreated(data) {
    try {
      const { subscription, customer } = data;
      console.log('📅 Processing subscription creation:', subscription.subscription_code);
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found for subscription:', customer.email);
        return;
      }

      // Save subscription record
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userData.id,
          paystack_subscription_id: subscription.subscription_code,
          paystack_customer_code: customer.customer_code,
          plan_name: subscription.plan.name,
          status: subscription.status,
          amount: subscription.plan.amount,
          currency: subscription.plan.currency,
          start_date: subscription.start,
          end_date: subscription.next_payment_date,
          next_payment_date: subscription.next_payment_date,
        });

      if (subscriptionError) {
        console.error('❌ Error saving subscription:', subscriptionError);
      } else {
        console.log('✅ Subscription saved successfully for user:', userData.id);
      }
    } catch (error) {
      console.error('❌ Error handling subscription creation:', error);
    }
  }

  // Handle subscription disabled
  static async handleSubscriptionDisabled(data) {
    try {
      const { subscription } = data;
      console.log('🚫 Processing subscription disabled:', subscription.subscription_code);
      
      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('paystack_subscription_id', subscription.subscription_code);

      if (error) {
        console.error('❌ Error updating subscription status:', error);
      } else {
        console.log('✅ Subscription disabled successfully:', subscription.subscription_code);
      }
    } catch (error) {
      console.error('❌ Error handling subscription disabled:', error);
    }
  }

  // Handle subscription enabled
  static async handleSubscriptionEnabled(data) {
    try {
      const { subscription } = data;
      console.log('✅ Processing subscription enabled:', subscription.subscription_code);
      
      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('paystack_subscription_id', subscription.subscription_code);

      if (error) {
        console.error('❌ Error updating subscription status:', error);
      } else {
        console.log('✅ Subscription enabled successfully:', subscription.subscription_code);
      }
    } catch (error) {
      console.error('❌ Error handling subscription enabled:', error);
    }
  }

  // Handle payment failure
  static async handlePaymentFailed(data) {
    try {
      const { transaction, customer } = data;
      console.log('💸 Processing failed payment:', transaction.reference);
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found for failed payment:', customer.email);
        return;
      }

      // Save failed payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userData.id,
          paystack_transaction_id: transaction.id.toString(),
          paystack_reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'failed',
          payment_method: transaction.channel,
        });

      if (paymentError) {
        console.error('❌ Error saving failed payment:', paymentError);
      } else {
        console.log('✅ Failed payment saved for user:', userData.id);
      }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
    }
  }
}

module.exports = { PaystackWebhookHandler };
