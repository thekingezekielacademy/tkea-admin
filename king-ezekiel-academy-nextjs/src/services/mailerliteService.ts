import axios, { AxiosResponse } from 'axios';
import { env } from '@/lib/env';

export interface MailerLiteSubscriber {
  email: string;
  fields?: {
    name?: string;
    [key: string]: any;
  };
  groups?: string[];
}

export interface MailerLiteResponse {
  id: string;
  email: string;
  fields: Record<string, any>;
  groups: string[];
  type: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MailerLiteError {
  message: string;
  errors?: Record<string, string[]>;
}

class MailerLiteService {
  private apiKey: string;
  private groupId: string;
  private baseUrl = 'https://connect.mailerlite.com/api';

  constructor() {
    this.apiKey = env.MAILERLITE_API_KEY || '';
    this.groupId = env.MAILERLITE_GROUP_ID || '';
    
    if (!this.apiKey) {
      console.warn('MailerLite API key not configured');
    }
    
    if (!this.groupId) {
      console.warn('MailerLite Group ID not configured');
    }
  }

  /**
   * Subscribe a user to MailerLite
   */
  async subscribe(subscriber: MailerLiteSubscriber): Promise<MailerLiteResponse> {
    if (!this.apiKey) {
      throw new Error('MailerLite API key not configured');
    }

    if (!this.groupId) {
      throw new Error('MailerLite Group ID not configured');
    }

    try {
      const payload = {
        email: subscriber.email,
        fields: subscriber.fields || {},
        groups: subscriber.groups || [this.groupId]
      };

      const response: AxiosResponse<MailerLiteResponse> = await axios.post(
        `${this.baseUrl}/subscribers`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as MailerLiteError;
        
        // Handle specific MailerLite error cases
        if (error.response?.status === 422) {
          // Validation error - subscriber already exists
          throw new Error(`Email ${subscriber.email} is already subscribed`);
        } else if (error.response?.status === 401) {
          throw new Error('Invalid MailerLite API key');
        } else if (error.response?.status === 404) {
          throw new Error('MailerLite group not found');
        } else {
          throw new Error(errorData?.message || 'Failed to subscribe to newsletter');
        }
      }
      
      throw new Error('Network error occurred while subscribing');
    }
  }

  /**
   * Get subscriber by email
   */
  async getSubscriber(email: string): Promise<MailerLiteResponse | null> {
    if (!this.apiKey) {
      throw new Error('MailerLite API key not configured');
    }

    try {
      const response: AxiosResponse<MailerLiteResponse> = await axios.get(
        `${this.baseUrl}/subscribers/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // Subscriber not found
      }
      
      throw new Error('Failed to check subscriber status');
    }
  }

  /**
   * Update subscriber fields
   */
  async updateSubscriber(email: string, fields: Record<string, any>): Promise<MailerLiteResponse> {
    if (!this.apiKey) {
      throw new Error('MailerLite API key not configured');
    }

    try {
      const response: AxiosResponse<MailerLiteResponse> = await axios.put(
        `${this.baseUrl}/subscribers/${encodeURIComponent(email)}`,
        { fields },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as MailerLiteError;
        throw new Error(errorData?.message || 'Failed to update subscriber');
      }
      
      throw new Error('Network error occurred while updating subscriber');
    }
  }

  /**
   * Unsubscribe a user from MailerLite
   */
  async unsubscribe(email: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('MailerLite API key not configured');
    }

    try {
      await axios.delete(
        `${this.baseUrl}/subscribers/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as MailerLiteError;
        throw new Error(errorData?.message || 'Failed to unsubscribe');
      }
      
      throw new Error('Network error occurred while unsubscribing');
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.groupId);
  }
}

// Export singleton instance
export const mailerLiteService = new MailerLiteService();
