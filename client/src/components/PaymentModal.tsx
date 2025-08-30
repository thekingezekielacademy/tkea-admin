import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName?: string;
  amount?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planName = 'Monthly Membership',
  amount = 2500
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [email, setEmail] = useState(user?.email || '');
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Load Paystack script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => setPaystackLoaded(true);
      document.head.appendChild(script);
    } else if (window.PaystackPop) {
      setPaystackLoaded(true);
    }
  }, []);

  // Create subscription record in database
  const createSubscriptionRecord = async (paymentResponse: any) => {
    try {
      console.log('💾 Creating subscription record for payment:', paymentResponse);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user?.id,
          status: 'active',
          plan_name: planName,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          billing_cycle: 'monthly',
          start_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paystack_subscription_id: paymentResponse.reference,
          paystack_customer_code: user?.id
        });

      if (error) {
        console.error('❌ Error creating subscription record:', error);
        throw error;
      }

      console.log('✅ Subscription record created successfully:', data);
      
      // Also create payment record
      await supabase
        .from('subscription_payments')
        .insert({
          user_id: user?.id,
          paystack_transaction_id: paymentResponse.reference,
          paystack_reference: paymentResponse.reference,
          amount: amount * 100,
          currency: 'NGN',
          status: 'success',
          payment_method: 'card',
          paid_at: new Date().toISOString()
        });

      console.log('✅ Payment record created successfully');
      
    } catch (error) {
      console.error('💥 Error in subscription creation flow:', error);
      // Don't throw error to user - payment succeeded, just log the issue
    }
  };

  const handlePayment = async () => {
    if (!user || !email) {
      setError('Please provide a valid email address');
      return;
    }

    if (!paystackLoaded) {
      setError('Paystack is still loading, please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Paystack directly with popup
      const handler = (window as any).PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_021c63210a1910a260b520b8bfa97cce19e996d8',
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        metadata: {
          user_id: user.id,
          plan_name: planName,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id
            },
            {
              display_name: "Plan Name",
              variable_name: "plan_name", 
              value: planName
            }
          ]
        },
        callback: function(response: any) {
          // Payment successful
          console.log('✅ Payment successful:', response);
          
          // Create subscription record automatically
          createSubscriptionRecord(response);
          
          setLoading(false);
          
          // Show success message before closing
          setError(null);
          setSuccess(true);
          
          // Wait 2 seconds to show success message, then close and refresh
          setTimeout(() => {
            onSuccess();
            onClose();
            // Force page refresh to show updated subscription status
            window.location.reload();
          }, 2000);
        },
        onClose: function() {
          // Payment cancelled
          console.log('❌ Payment cancelled by user');
          setError('Payment was cancelled');
          setLoading(false);
        }
      });

      // Open Paystack popup
      handler.openIframe();
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Subscribe to {planName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Plan:</span>
              <span className="text-gray-900 font-semibold">{planName}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-700 font-medium">Price:</span>
              <span className="text-2xl font-bold text-primary-600">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-700 font-medium">Billing:</span>
              <span className="text-gray-900 font-semibold">Monthly</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">Payment successful! Your subscription is now active.</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                💳 You'll be redirected to Paystack to complete your payment securely.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading || success}
          >
            {success ? 'Closing...' : 'Cancel'}
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || !email || success}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : success ? (
              'Payment Successful! 🎉'
            ) : (
              `Pay ₦${amount.toLocaleString()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
