// Flutterwave Service - Secure Subscription Management
import { createClient } from '@/lib/supabase/client';

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

// Professional Flutterwave Configuration - Live Mode
const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_MODE = 'live';

// Log current mode
console.log('🔧 Flutterwave Mode:', FLUTTERWAVE_MODE);
console.log('🔧 Flutterwave Public Key:', FLUTTERWAVE_PUBLIC_KEY?.substring(0, 20) + '...');

// Validate required environment variables
if (!FLUTTERWAVE_PUBLIC_KEY) {
  console.error('❌ CRITICAL: NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY environment variable is required');
}

export interface FlutterwaveTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  tx_ref: string;
  customer: {
    email: string;
    customer_code: string;
  };
  meta: {
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
  flutterwave_subscription_id: string;
  flutterwave_customer_code: string;
}

class FlutterwaveService {
  // Initialize Flutterwave payment
  async initializePayment(email: string, amount: number, metadata: any = {}) {
    try {
      // Enhanced validation
      if (!email || email.trim().length < 4) {
        throw new Error('Valid email address is required (minimum 4 characters)');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Valid amount is required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid email address');
      }
      
      console.log('Initializing Flutterwave payment via secure server endpoint', { email, amount });
      
      // Use centralized API configuration with proper error handling
      const result = await fetch(`${API_BASE}/flutterwave/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          amount,
          metadata: {
            ...metadata,
            source: 'king-ezekiel-academy',
            timestamp: new Date().toISOString()
          }
        })
      });

      const response = await result.json();
      console.log('Payment initialized successfully via secure server', { success: response.success });
      
      if (response.success) {
        return {
          success: true,
          authorization_url: response.data.link,
          reference: response.data.tx_ref,
        };
      } else {
        throw new Error(response.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  }

  // Create recurring subscription via server endpoint
  async createSubscription(email: string, customerCode: string) {
    try {
      console.log('🚀 Creating Flutterwave subscription');
      
      // For development mode, simulate successful subscription creation
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('🔧 Development mode: Simulating successful subscription creation');
        
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Create a mock successful subscription
        const mockSubscription = {
          success: true,
          subscription: {
            id: 'sub_' + Date.now(),
            subscription_code: 'SUB_' + Date.now(),
            customer_code: customerCode,
            plan_id: process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID || '146851',
            amount: 2500,
            currency: 'NGN',
            status: 'active',
            created_at: new Date().toISOString(),
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        console.log('✅ Mock subscription created successfully:', mockSubscription);
        
        // Save to database directly
        await this.saveSubscriptionToDatabase(user.id, mockSubscription.subscription);
        
        return mockSubscription;
      }
      
      // Production subscription creation via API endpoint
      const apiEndpoint = `${API_BASE}/flutterwave/create-subscription`;
      
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
      console.log('✅ Flutterwave subscription created successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('💥 Flutterwave subscription creation error:', error);
      throw error;
    }
  }

  // Verify payment via server endpoint
  async verifyPayment(reference: string, transactionId?: string) {
    try {
      console.log('🔍 Verifying Flutterwave payment', { reference, transactionId });
      
      // For development mode, simulate successful verification
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('🔧 Development mode: Simulating successful payment verification');
        
        // Create a mock successful verification response
        const mockVerification = {
          success: true,
          transaction: {
            id: '9636276', // Use the actual transaction ID from the logs
            amount: 2500,
            currency: 'NGN',
            status: 'successful',
            tx_ref: reference,
            customer: {
              email: 'colourfulrhythmmbe@gmail.com',
              customer_code: 'CUST_' + Date.now()
            },
            created_at: new Date().toISOString(),
            paid_at: new Date().toISOString()
          }
        };
        
        console.log('✅ Mock payment verification successful:', mockVerification);
        return mockVerification;
      }
      
      // Production verification via API endpoint
      const apiEndpoint = `${API_BASE}/flutterwave/verify-payment`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          transaction_id: transactionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Flutterwave payment verified successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          transaction: result.data,
        };
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('💥 Flutterwave payment verification error:', error);
      throw error;
    }
  }

  // Get subscription details via server endpoint
  async getSubscription(subscriptionId: string) {
    try {
      console.log('📊 Fetching Flutterwave subscription via server endpoint');
      
      // Use the API endpoint
      const apiEndpoint = `${API_BASE}/flutterwave/get-subscription`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error Response:', errorText);
        throw new Error(`Server API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Flutterwave subscription fetched successfully via server:', result);
      
      if (result.success) {
        return {
          success: true,
          subscription: result.data,
        };
      } else {
        throw new Error(result.message || 'Failed to fetch subscription');
      }
    } catch (error) {
      console.error('💥 Flutterwave subscription fetch error:', error);
      throw error;
    }
  }

  // Cancel subscription via secure server endpoint
  async cancelSubscription(subscriptionId: string) {
    try {
      console.log('🚫 Cancelling Flutterwave subscription via secure server endpoint');
      
      // Use the secure API endpoint
      const apiEndpoint = '/flutterwave/cancel-subscription';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Secure API Error Response:', errorText);
        throw new Error(`Secure API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Flutterwave subscription cancelled successfully via secure server:', result);
      
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Subscription cancelled successfully',
        };
      } else {
        throw new Error(result.message || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('💥 Flutterwave subscription cancellation error:', error);
      throw error;
    }
  }

  // Save subscription to database
  async saveSubscriptionToDatabase(userId: string, flutterwaveData: any) {
    try {
      console.log('💾 Saving Flutterwave subscription to database:', { userId, flutterwaveData });
      
      // First, check if subscription already exists
      const { data: existingSub, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      let data, error;

      if (existingSub && !checkError) {
        // Update existing subscription (only with columns that exist)
        const { data: updateData, error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            flutterwave_subscription_id: flutterwaveData.subscription_code || flutterwaveData.id,
            flutterwave_customer_code: flutterwaveData.customer_code || userId,
            plan_name: flutterwaveData.plan_name || 'Monthly Membership',
            status: flutterwaveData.status || 'active',
            amount: flutterwaveData.amount || 2500,
            currency: flutterwaveData.currency || 'NGN'
          })
          .eq('user_id', userId)
          .select();

        data = updateData;
        error = updateError;
      } else {
        // Insert new subscription (only with columns that exist)
        const { data: insertData, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            flutterwave_subscription_id: flutterwaveData.subscription_code || flutterwaveData.id,
            flutterwave_customer_code: flutterwaveData.customer_code || userId,
            plan_name: flutterwaveData.plan_name || 'Monthly Membership',
            status: flutterwaveData.status || 'active',
            amount: flutterwaveData.amount || 2500,
            currency: flutterwaveData.currency || 'NGN'
          })
          .select();

        data = insertData;
        error = insertError;
      }

      if (error) {
        console.error('❌ Database subscription save error:', error);
        throw error;
      }
      
      console.log('✅ Flutterwave subscription saved to database:', data);
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
          flutterwave_transaction_id: transactionData.id, // Use existing column
          flutterwave_reference: transactionData.tx_ref, // Use existing column
          amount: transactionData.amount,
          currency: transactionData.currency,
          status: transactionData.status === 'successful' ? 'success' : transactionData.status,
          paid_at: transactionData.created_at || transactionData.paid_at,
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

export const flutterwaveService = new FlutterwaveService();
export default flutterwaveService;
