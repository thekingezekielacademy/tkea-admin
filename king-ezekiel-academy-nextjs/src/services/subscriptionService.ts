/**
 * Subscription Service
 * 
 * Handles subscription-related operations including cancellation
 * through secure backend endpoints.
 */

import { supabase } from '@/lib/supabase';

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
  flutterwave_subscription_id: string;
  flutterwave_customer_code: string;
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
    // Use Next.js API routes
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || ''
      : ''; // Use relative URLs in development
  }

  /**
   * Cancel a subscription
   * @param subscriptionId - The subscription ID to cancel
   * @param flutterwaveSubscriptionId - The Flutterwave subscription code
   * @returns Promise<CancelSubscriptionResponse>
   */
  async cancelSubscription(subscriptionId: string, flutterwaveSubscriptionId: string): Promise<CancelSubscriptionResponse> {
    try {
      console.log('🚫 Cancelling subscription via secure backend API');
      
      // Use Next.js API route for subscription cancellation
      const response = await fetch(`${this.baseUrl}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          subscriptionId: flutterwaveSubscriptionId,
          reason: 'User requested cancellation',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Subscription cancelled successfully via backend API');
        return {
          success: true,
          message: result.message || 'Subscription cancelled successfully',
          subscription: result.subscription,
        };
      }

      // Handle API errors gracefully
      const errorText = await response.text();
      console.error('❌ Backend API error:', response.status, errorText);
      
      return {
        success: false,
        message: `Failed to cancel subscription: ${response.status} - ${errorText}`,
      };
    } catch (error) {
      console.error('💥 Error in subscription service:', error);
      return {
        success: false,
        message: 'Failed to cancel subscription. Please contact support.',
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
