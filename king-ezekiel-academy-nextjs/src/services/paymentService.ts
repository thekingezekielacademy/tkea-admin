interface PaymentData {
  amount: number
  email: string
  name: string
  plan_id?: string
}

interface PaymentResponse {
  payment_url: string
  tx_ref: string
}

interface VerificationResponse {
  success: boolean
  subscription?: any
  error?: string
}

class PaymentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || ''
      : '' // Use relative URLs in development
  }

  async initializePayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/flutterwave/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      return result
    } catch (error) {
      console.error('Payment initialization error:', error)
      throw error
    }
  }

  async verifyPayment(tx_ref: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/flutterwave/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx_ref }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Payment verification failed'
        }
      }

      return result
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        error: 'Payment verification failed'
      }
    }
  }

  async getSubscriptionStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/subscriptions/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get subscription status')
      }

      return result
    } catch (error) {
      console.error('Subscription status error:', error)
      throw error
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Subscription cancellation failed')
      }

      return result.success
    } catch (error) {
      console.error('Subscription cancellation error:', error)
      throw error
    }
  }

  // Format amount for display
  formatAmount(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Get plan details
  getPlanDetails(planId: string) {
    const plans = {
      monthly: {
        id: 'monthly',
        name: 'Monthly Plan',
        price: 5000,
        currency: 'NGN',
        duration: '30 days',
        features: ['Access to all courses', 'Progress tracking', 'Certificate of completion']
      },
      yearly: {
        id: 'yearly',
        name: 'Yearly Plan',
        price: 50000,
        currency: 'NGN',
        duration: '365 days',
        features: ['Access to all courses', 'Progress tracking', 'Certificate of completion', 'Priority support']
      }
    }

    return plans[planId as keyof typeof plans] || plans.monthly
  }
}

export const paymentService = new PaymentService()
export default paymentService
