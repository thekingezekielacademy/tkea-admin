const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SubscriptionService {
  
  // Update subscription status in Supabase based on Paystack response
  static async updateSubscriptionStatus(subscriptionId, paystackData) {
    try {
      console.log(`🔄 Updating Supabase subscription: ${subscriptionId}`);
      
      const updateData = {
        status: this.mapPaystackStatus(paystackData.status),
        paystack_subscription_id: paystackData.subscription_code || paystackData.code,
        updated_at: new Date().toISOString(),
        // Map Paystack fields to our database
        next_billing_date: paystackData.next_payment_date,
        cancel_at_period_end: paystackData.cancelled || false,
        amount: paystackData.amount || 2500,
        currency: paystackData.currency || 'NGN'
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select();

      if (error) {
        console.error('❌ Error updating Supabase subscription:', error);
        throw error;
      }

      console.log('✅ Supabase subscription updated successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ SubscriptionService.updateSubscriptionStatus error:', error);
      throw error;
    }
  }

  // Create new subscription in Supabase based on Paystack response
  static async createSubscription(userId, paystackData) {
    try {
      console.log(`🔄 Creating new Supabase subscription for user: ${userId}`);
      
      const subscriptionData = {
        user_id: userId,
        paystack_subscription_id: paystackData.subscription_code,
        paystack_customer_code: paystackData.customer.customer_code,
        plan_name: 'Premium Monthly Plan',
        status: this.mapPaystackStatus(paystackData.status),
        amount: paystackData.amount || 2500,
        currency: paystackData.currency || 'NGN',
        billing_cycle: 'monthly',
        start_date: paystackData.created_at || new Date().toISOString(),
        end_date: paystackData.next_payment_date || this.calculateEndDate(),
        next_billing_date: paystackData.next_payment_date || this.calculateEndDate(),
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating Supabase subscription:', error);
        throw error;
      }

      console.log('✅ New Supabase subscription created:', data);
      return data;
      
    } catch (error) {
      console.error('❌ SubscriptionService.createSubscription error:', error);
      throw error;
    }
  }

  // Cancel subscription in Supabase
  static async cancelSubscription(subscriptionId, reason) {
    try {
      console.log(`🔄 Canceling Supabase subscription: ${subscriptionId}`);
      
      const updateData = {
        status: 'canceled',
        cancel_at_period_end: true,
        cancel_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select();

      if (error) {
        console.error('❌ Error canceling Supabase subscription:', error);
        throw error;
      }

      console.log('✅ Supabase subscription canceled:', data);
      return data;
      
    } catch (error) {
      console.error('❌ SubscriptionService.cancelSubscription error:', error);
      throw error;
    }
  }

  // Map Paystack status to our database status
  static mapPaystackStatus(paystackStatus) {
    const statusMap = {
      'active': 'active',
      'inactive': 'canceled',
      'cancelled': 'canceled',
      'expired': 'expired',
      'trialing': 'trialing'
    };
    
    return statusMap[paystackStatus] || 'active';
  }

  // Calculate end date (30 days from now)
  static calculateEndDate() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    return endDate.toISOString();
  }

  // Get subscription by Paystack ID
  static async getSubscriptionByPaystackId(paystackId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('paystack_subscription_id', paystackId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching subscription by Paystack ID:', error);
      throw error;
    }
  }

  // Get subscription by user ID
  static async getSubscriptionByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching subscription by user ID:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionService;
