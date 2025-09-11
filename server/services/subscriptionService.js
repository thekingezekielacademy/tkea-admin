const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MTQ1NSwiZXhwIjoyMDcwMjQ3NDU1fQ.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw'
);

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const subscriptionCache = new Map();
const userCache = new Map();

class SubscriptionService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Get subscription by Paystack ID with caching
   */
  async getSubscriptionByPaystackId(paystackId) {
    const cacheKey = `paystack_${paystackId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('paystack_subscription_id', paystackId)
        .single();

      if (error) {
        throw error;
      }

      // Cache the result
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching subscription by Paystack ID:', error);
      throw error;
    }
  }

  /**
   * Get user's active subscription with caching
   */
  async getUserActiveSubscription(userId) {
    const cacheKey = `user_active_${userId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Cache the result (including null for no subscription)
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching user active subscription:', error);
      throw error;
    }
  }

  /**
   * Create new subscription with transaction
   */
  async createSubscription(userId, paystackData) {
    try {
      // Start transaction
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
        user_id: userId,
          paystack_subscription_id: paystackData.subscription_code || paystackData.reference,
          paystack_customer_code: paystackData.customer_code || userId,
          plan_name: paystackData.plan_name || 'Monthly Membership',
          status: 'active',
          amount: paystackData.amount || 250000, // 2500 NGN in kobo
          currency: 'NGN',
          start_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (subError) {
        throw subError;
      }

      // Create payment record
      await this.createPaymentRecord(userId, paystackData, subscription.id);

      // Clear user cache
      this.clearUserCache(userId);

      console.log('✅ Subscription created successfully:', subscription.id);
      return subscription;
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Create payment record
   */
  async createPaymentRecord(userId, paystackData, subscriptionId) {
    try {
      const { error } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userId,
          paystack_transaction_id: paystackData.reference || paystackData.subscription_code,
          paystack_reference: paystackData.reference || paystackData.subscription_code,
          amount: paystackData.amount || 250000,
          currency: 'NGN',
          status: 'success',
          payment_method: 'card',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('⚠️ Payment record creation failed:', error);
        // Don't fail the entire flow for payment record issues
      } else {
        console.log('✅ Payment record created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating payment record:', error);
      // Don't fail the entire flow for payment record issues
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(subscriptionId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear related caches
      this.clearSubscriptionCache(subscriptionId);
      if (data.user_id) {
        this.clearUserCache(data.user_id);
      }

      console.log('✅ Subscription status updated:', subscriptionId);
      return data;
    } catch (error) {
      console.error('❌ Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason = 'User cancelled') {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear related caches
      this.clearSubscriptionCache(subscriptionId);
      if (data.user_id) {
        this.clearUserCache(data.user_id);
      }

      console.log('✅ Subscription cancelled:', subscriptionId);
      return data;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching subscription history:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', userId)
        .order('paid_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId) {
    try {
      const subscription = await this.getUserActiveSubscription(userId);
      return !!subscription;
    } catch (error) {
      console.error('❌ Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      // Get total subscriptions
      const { count: totalSubscriptions, error: totalError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get active subscriptions
      const { count: activeSubscriptions, error: activeError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('user_subscriptions')
        .select('amount')
        .eq('status', 'active');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData.reduce((sum, sub) => sum + (sub.amount || 0), 0);

      return {
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue: totalRevenue / 100, // Convert from kobo to NGN
        conversionRate: totalSubscriptions > 0 ? (activeSubscriptions / totalSubscriptions) * 100 : 0
      };
    } catch (error) {
      console.error('❌ Error fetching subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk update subscription statuses
   */
  async bulkUpdateSubscriptionStatuses(updates) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert(updates.map(update => ({
          ...update,
          updated_at: new Date().toISOString()
        })))
        .select();

      if (error) {
        throw error;
      }

      // Clear all caches
      this.clearAllCaches();

      console.log('✅ Bulk subscription updates completed:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error in bulk subscription updates:', error);
      throw error;
    }
  }

  /**
   * Clean up expired subscriptions
   */
  async cleanupExpiredSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .lt('next_payment_date', new Date().toISOString())
        .eq('status', 'active')
        .select();

      if (error) {
        throw error;
      }

      if (data.length > 0) {
        console.log(`✅ Cleaned up ${data.length} expired subscriptions`);
        // Clear all caches
        this.clearAllCaches();
      }

      return data;
    } catch (error) {
      console.error('❌ Error cleaning up expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Cache management methods
   */
  setCache(key, value) {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  isCacheValid(key) {
    const timestamp = this.cacheTimestamps.get(key);
    return timestamp && (Date.now() - timestamp) < CACHE_TTL;
  }

  clearSubscriptionCache(subscriptionId) {
    // Clear all caches related to this subscription
    for (const [key] of this.cache) {
      if (key.includes(subscriptionId)) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  clearUserCache(userId) {
    // Clear all caches related to this user
    for (const [key] of this.cache) {
      if (key.includes(userId)) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  clearAllCaches() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheHits: this.cacheTimestamps.size,
      cacheTTL: CACHE_TTL
    };
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        status: 'healthy',
        database: 'connected',
        cache: this.getCacheStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
module.exports = new SubscriptionService();
