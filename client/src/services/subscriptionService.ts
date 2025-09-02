/**
 * Subscription Service
 * 
 * Handles subscription-related operations including cancellation
 * through secure backend endpoints.
 */

import { supabase } from '../lib/supabase';

export interface SubscriptionData {
  id: string;
  status: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  next_billing_date: string;
  paystack_subscription_id: string;
  paystack_customer_code: string;
  created_at: string;
  updated_at: string;
  cancel_at_period_end: boolean;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: SubscriptionData;
}

class SubscriptionService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to a secure endpoint
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://app.thekingezekielacademy.com/api';
  }

  /**
   * Cancel a subscription
   * @param subscriptionId - The subscription ID to cancel
   * @param paystackSubscriptionId - The Paystack subscription code
   * @returns Promise<CancelSubscriptionResponse>
   */
  async cancelSubscription(subscriptionId: string, paystackSubscriptionId: string): Promise<CancelSubscriptionResponse> {
    try {
      // First, try to cancel through our backend API
      const response = await fetch(`${this.baseUrl}/paystack/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          subscriptionId: paystackSubscriptionId, // The endpoint expects subscriptionId
          reason: 'User requested cancellation', // Add required reason parameter
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Subscription cancelled successfully',
          subscription: result.subscription,
        };
      }

      // If backend API fails, try direct Paystack call as fallback
      // (This should be removed once backend is properly set up)
      console.warn('Backend API failed, trying direct Paystack call as fallback');
      console.warn('Backend API response status:', response.status);
      console.warn('Backend API response:', await response.text());
      return await this.cancelSubscriptionDirect(paystackSubscriptionId);
    } catch (error) {
      console.error('Error in subscription service:', error);
      return {
        success: false,
        message: 'Failed to cancel subscription. Please contact support.',
      };
    }
  }

  /**
   * Direct Paystack cancellation (fallback method)
   * @param paystackSubscriptionId - The Paystack subscription code
   * @returns Promise<CancelSubscriptionResponse>
   */
  private async cancelSubscriptionDirect(paystackSubscriptionId: string): Promise<CancelSubscriptionResponse> {
    try {
      // This should only be used as a fallback
      // In production, this should be removed and only backend API used
      const response = await fetch(`https://api.paystack.co/subscription/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PAYSTACK_SECRET_KEY || 'sk_test_...'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: paystackSubscriptionId, // Paystack expects 'code' parameter
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.status) {
        return {
          success: true,
          message: 'Subscription cancelled successfully',
        };
      } else {
        throw new Error(result.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Direct Paystack cancellation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  /**
   * Get authentication token for API calls
   * @returns Promise<string>
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  /**
   * Update subscription status in database
   * @param subscriptionId - The subscription ID to update
   * @param status - The new status
   * @returns Promise<boolean>
   */
  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error updating subscription status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }
  }

  /**
   * Get subscription details
   * @param subscriptionId - The subscription ID
   * @returns Promise<SubscriptionData | null>
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionData | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as SubscriptionData;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
