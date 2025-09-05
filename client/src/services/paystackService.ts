// Paystack Service - Secure Subscription Management
import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';
import { logInfo, logError, logApiCall } from '../utils/performanceLogger';

// API Configuration - Use secure server-side endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://app.thekingezekielacademy.com/api';
const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;

// Validate required environment variables
if (!PAYSTACK_PUBLIC_KEY) {
  console.error('❌ CRITICAL: REACT_APP_PAYSTACK_PUBLIC_KEY environment variable is required');
}

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
    const startTime = performance.now();
    
    try {
      logInfo('Initializing Paystack payment via secure server endpoint', { email, amount }, 'PaystackService', 'initializePayment');
      
      // Use secure API endpoint
      const response = await fetch(`${API_BASE_URL}/paystack/secure-payment/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount,
          reference: `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: {
            ...metadata,
            source: 'king-ezekiel-academy',
            timestamp: new Date().toISOString()
          }
        })
      });

      const duration = performance.now() - startTime;
      logApiCall('POST', '/paystack/secure-payment/initialize', response.status, duration);
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('Secure API Error Response', { status: response.status, error: errorText }, 'PaystackService', 'initializePayment');
        throw new Error(`Secure API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logInfo('Payment initialized successfully via secure server', { success: result.success }, 'PaystackService', 'initializePayment');
      
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
      ErrorHandler.handleApiError(error, {
        component: 'PaystackService',
        action: 'initializePayment',
        metadata: { email, amount }
      });
      throw error;
    }
  }

  // Create recurring subscription via server endpoint
  async createSubscription(email: string, customerCode: string) {
    try {
      console.log('🚀 Creating subscription via server endpoint');
      
      // Use the correct API endpoint for both dev and production
      const apiEndpoint = process.env.NODE_ENV === 'production' 
        ? '/api/paystack/create-subscription'
        : 'http://localhost:5000/api/paystack/create-subscription';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerCode,
          email,
          userId: (await supabase.auth.getUser()).data.user?.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription created successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('💥 Paystack subscription creation error:', error);
      throw error;
    }
  }

  // Verify payment via server endpoint
  async verifyPayment(reference: string) {
    try {
      console.log('🔍 Verifying payment via server endpoint');
      
      // Use the correct API endpoint for both dev and production
      const apiEndpoint = process.env.NODE_ENV === 'production' 
        ? '/api/paystack/verify-payment'
        : 'http://localhost:5000/api/paystack/verify-payment';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment verified successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          transaction: result.data,
        };
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('💥 Paystack payment verification error:', error);
      throw error;
    }
  }

  // Get subscription details via server endpoint
  async getSubscription(subscriptionId: string) {
    try {
      console.log('📊 Fetching subscription via server endpoint');
      
      // Use the correct API endpoint for both dev and production
      const apiEndpoint = process.env.NODE_ENV === 'production' 
        ? `/api/paystack/subscription/${subscriptionId}`
        : `http://localhost:5000/api/paystack/subscription/${subscriptionId}`;
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription fetched successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Failed to fetch subscription');
      }
    } catch (error) {
      console.error('💥 Paystack subscription fetch error:', error);
      throw error;
    }
  }

  // Cancel subscription via secure server endpoint
  async cancelSubscription(subscriptionId: string) {
    try {
      console.log('🚫 Cancelling subscription via secure server endpoint');
      
      const response = await fetch(`${API_BASE_URL}/paystack/secure-payment/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_code: subscriptionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Secure API Error Response:', errorText);
        throw new Error(`Secure API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription cancelled successfully via secure server:', result);
      
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Subscription cancelled successfully',
        };
      } else {
        throw new Error(result.message || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('💥 Paystack subscription cancellation error:', error);
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
