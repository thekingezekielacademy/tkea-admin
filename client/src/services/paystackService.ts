// Paystack Service - Secure Subscription Management
import { supabase } from '../lib/supabase';

// Paystack configuration - TEMPORARILY HARDCODED
const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_021c63210a1910a260b520b8bfa97cce19e996d8';
const PAYSTACK_PLAN_CODE = process.env.REACT_APP_PAYSTACK_PLAN_CODE || 'PLN_fx0dayx3idr67x1';

export interface PaystackTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  customer: {
    email: string;
    customer_code: string;
  };
  metadata: {
    subscription_id?: string;
    plan_name?: string;
  };
}

export interface SubscriptionData {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  plan_name: string;
  amount: number;
  currency: string;
  start_date: string;
  next_payment_date: string;
  paystack_subscription_id: string;
  paystack_customer_code: string;
}

class PaystackService {
  // Initialize Paystack payment
  async initializePayment(email: string, amount: number, metadata: any = {}) {
    try {
      console.log('🚀 Initializing Paystack payment via server endpoint');
      
      // Call our server endpoint instead of Paystack directly
      const response = await fetch('/api/paystack/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount,
          metadata
        })
      });

      console.log('📡 Server API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment initialized successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          authorization_url: result.data.authorization_url,
          reference: result.data.reference,
        };
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('💥 Paystack payment initialization error:', error);
      throw error;
    }
  }

  // Create recurring subscription
  async createSubscription(email: string, customerCode: string) {
    try {
      const response = await fetch('https://api.paystack.co/subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerCode,
          plan: PAYSTACK_PLAN_CODE,
          start_date: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (result.status) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('Paystack subscription creation error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
        },
      });

      const result = await response.json();
      
      if (result.status && result.data.status === 'success') {
        return {
          success: true,
          transaction: result.data,
        };
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`https://api.paystack.co/subscription/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
        },
      });

      const result = await response.json();
      
      if (result.status) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Paystack subscription fetch error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`https://api.paystack.co/subscription/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: subscriptionId,
        }),
      });

      const result = await response.json();
      
      if (result.status) {
        return {
          success: true,
          message: 'Subscription cancelled successfully',
        };
      } else {
        throw new Error(result.message || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('Paystack subscription cancellation error:', error);
      throw error;
    }
  }

  // Save subscription to database
  async saveSubscriptionToDatabase(userId: string, paystackData: any) {
    try {
      console.log('💾 Saving subscription to database:', { userId, paystackData });
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          paystack_subscription_id: paystackData.subscription_code || paystackData.id,
          paystack_customer_code: paystackData.customer?.customer_code || userId,
          plan_name: paystackData.plan?.plan_name || 'Monthly Membership',
          status: paystackData.status || 'active',
          amount: paystackData.plan?.amount || 250000,
          currency: paystackData.plan?.currency || 'NGN',
          billing_cycle: 'monthly',
          start_date: paystackData.created_at || new Date().toISOString(),
          next_payment_date: paystackData.next_payment_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Database subscription save error:', error);
        throw error;
      }
      
      console.log('✅ Subscription saved to database:', data);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('💥 Database subscription save error:', error);
      throw error;
    }
  }

  // Save payment to database
  async savePaymentToDatabase(userId: string, transactionData: any) {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userId,
          paystack_transaction_id: transactionData.id,
          paystack_reference: transactionData.reference,
          amount: transactionData.amount,
          currency: transactionData.currency,
          status: transactionData.status,
          paid_at: transactionData.paid_at,
        });

      if (error) throw error;
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Database payment save error:', error);
      throw error;
    }
  }
}

export const paystackService = new PaystackService();
export default paystackService;
