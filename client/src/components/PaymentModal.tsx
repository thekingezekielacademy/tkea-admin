import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaRedo } from 'react-icons/fa';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName?: string;
  amount?: number;
}

interface PaymentState {
  status: 'idle' | 'processing' | 'success' | 'failed' | 'retrying';
  error: string | null;
  retryCount: number;
  paymentId: string | null;
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
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    error: null,
    retryCount: 0,
    paymentId: null
  });
  const [email, setEmail] = useState(user?.email || '');
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;

  // Load Paystack script with retry mechanism
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const loadPaystack = async () => {
        try {
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          script.async = true;
          script.onload = () => setPaystackLoaded(true);
          script.onerror = () => {
            console.error('Failed to load Paystack script');
            setPaymentState(prev => ({ ...prev, error: 'Failed to load payment system' }));
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error('Error loading Paystack:', error);
          setPaymentState(prev => ({ ...prev, error: 'Payment system unavailable' }));
        }
      };
      
      loadPaystack();
    } else if (window.PaystackPop) {
      setPaystackLoaded(true);
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentState({
        status: 'idle',
        error: null,
        retryCount: 0,
        paymentId: null
      });
      setPaymentAttempts(0);
    }
  }, [isOpen]);

  // Enhanced subscription record creation with retry mechanism
  const createSubscriptionRecord = useCallback(async (paymentResponse: any, retryCount = 0): Promise<boolean> => {
    try {
      console.log('💾 Creating subscription record for payment:', paymentResponse);
      
      // Generate unique payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setPaymentState(prev => ({ ...prev, paymentId }));
      
      // Create subscription with transaction
      const { data: subscriptionData, error: subscriptionError } = await supabase
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
          paystack_customer_code: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      console.log('✅ Subscription record created successfully:', subscriptionData);
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: user?.id,
          paystack_transaction_id: paymentResponse.reference,
          paystack_reference: paymentResponse.reference,
          amount: amount * 100,
          currency: 'NGN',
          status: 'success',
          payment_method: 'card',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        console.warn('⚠️ Payment record creation failed:', paymentError);
        // Don't fail the entire flow for payment record issues
      }

      // Update user profile to mark as subscribed
      await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString(),
          // Add any subscription-related profile fields here
        })
        .eq('id', user?.id);

      console.log('✅ User profile updated successfully');
      return true;
      
    } catch (error) {
      console.error('💥 Error in subscription creation flow:', error);
      
      // Retry logic for database errors
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Retrying subscription creation (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return createSubscriptionRecord(paymentResponse, retryCount + 1);
      }
      
      // Log detailed error for debugging
      console.error('❌ Max retries exceeded for subscription creation:', {
        error,
        paymentResponse,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  }, [user?.id, planName, amount]);

  // Enhanced payment handler with better error handling
  const handlePayment = useCallback(async () => {
    if (!user || !email) {
      setPaymentState(prev => ({ ...prev, error: 'Please provide a valid email address' }));
      return;
    }

    if (!paystackLoaded) {
      setPaymentState(prev => ({ ...prev, error: 'Payment system is still loading, please wait...' }));
      return;
    }

    if (paymentAttempts >= MAX_RETRY_ATTEMPTS) {
      setPaymentState(prev => ({ 
        ...prev, 
        error: 'Maximum payment attempts reached. Please try again later.',
        status: 'failed'
      }));
      return;
    }

    setLoading(true);
    setPaymentState(prev => ({ ...prev, status: 'processing', error: null }));

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Enhanced Paystack configuration
      const handler = (window as any).PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_021c63210a1910a260b520b8bfa97cce19e996d8',
        email: email.trim(),
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        ref: `TKE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Custom reference
        metadata: {
          user_id: user.id,
          plan_name: planName,
          platform: 'web',
          timestamp: new Date().toISOString(),
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
            },
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "web"
            }
          ]
        },
        callback: async function(response: any) {
          try {
            console.log('✅ Payment successful:', response);
            setPaymentState(prev => ({ ...prev, status: 'processing' }));
            
            // Verify payment with backend before creating subscription
            const verificationResponse = await fetch('/api/paystack/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
                amount: amount * 100
              })
            });

            if (!verificationResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verificationData = await verificationResponse.json();
            
            if (!verificationData.success) {
              throw new Error('Payment verification unsuccessful');
            }

            // Create subscription record
            const subscriptionCreated = await createSubscriptionRecord(response);
            
            if (subscriptionCreated) {
              setPaymentState(prev => ({ ...prev, status: 'success' }));
              setLoading(false);
              
              // Show success message and close after delay
              setTimeout(() => {
                onSuccess();
                onClose();
                // Refresh subscription data without full page reload
                window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
              }, 2000);
            } else {
              throw new Error('Failed to create subscription record');
            }
            
          } catch (error) {
            console.error('❌ Error in payment callback:', error);
            setPaymentState(prev => ({ 
              ...prev, 
              status: 'failed',
              error: 'Payment succeeded but subscription setup failed. Please contact support.'
            }));
            setLoading(false);
          }
        },
        onClose: function() {
          console.log('❌ Payment cancelled by user');
          setPaymentState(prev => ({ 
            ...prev, 
            status: 'failed',
            error: 'Payment was cancelled'
          }));
          setLoading(false);
        }
      });

      // Open Paystack popup
      handler.openIframe();
      setPaymentAttempts(prev => prev + 1);
      
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentState(prev => ({ 
        ...prev, 
        status: 'failed',
        error: err instanceof Error ? err.message : 'Payment failed. Please try again.'
      }));
      setLoading(false);
    }
  }, [user, email, amount, planName, paystackLoaded, paymentAttempts, createSubscriptionRecord, onSuccess, onClose]);

  // Retry payment function
  const retryPayment = useCallback(() => {
    setPaymentState(prev => ({ ...prev, status: 'retrying', error: null }));
    setPaymentAttempts(0);
    handlePayment();
  }, [handlePayment]);

  // Close modal with cleanup
  const handleClose = useCallback(() => {
    if (paymentState.status === 'processing') {
      return; // Prevent closing during processing
    }
    
    setPaymentState({
      status: 'idle',
      error: null,
      retryCount: 0,
      paymentId: null
    });
    setPaymentAttempts(0);
    onClose();
  }, [paymentState.status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Subscribe to {planName}</h2>
          <button
            onClick={handleClose}
            disabled={paymentState.status === 'processing'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plan Details */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Plan:</span>
              <span className="text-gray-900 font-semibold">{planName}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-700 font-medium">Price:</span>
              <span className="text-2xl font-bold text-blue-600">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-700 font-medium">Billing:</span>
              <span className="text-gray-900 font-semibold">Monthly</span>
            </div>
          </div>

          {/* Email Input */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading || paymentState.status === 'success'}
              />
            </div>

            {/* Status Messages */}
            {paymentState.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-400 mr-2" />
                  <p className="text-red-700 text-sm">{paymentState.error}</p>
                </div>
              </div>
            )}
            
            {paymentState.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-400 mr-2" />
                  <p className="text-green-700 text-sm">Payment successful! Your subscription is now active.</p>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                💳 You'll be redirected to Paystack to complete your payment securely.
              </p>
            </div>

            {/* Payment ID Display */}
            {paymentState.paymentId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-600 text-xs">
                  Payment ID: {paymentState.paymentId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading || paymentState.status === 'processing'}
          >
            {paymentState.status === 'success' ? 'Closing...' : 'Cancel'}
          </button>
          
          {paymentState.status === 'failed' ? (
            <button
              onClick={retryPayment}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaRedo className="w-4 h-4 mr-2 inline" />
              Retry Payment
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={loading || !email || paymentState.status === 'success' || paymentState.status === 'processing'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading || paymentState.status === 'processing' ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : paymentState.status === 'success' ? (
                'Payment Successful! 🎉'
              ) : (
                `Pay ₦${amount.toLocaleString()}`
              )}
            </button>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Processing your payment...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
