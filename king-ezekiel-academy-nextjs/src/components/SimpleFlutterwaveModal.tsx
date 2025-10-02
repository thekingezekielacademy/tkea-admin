import React, { useState, useEffect } from 'react';
import { FaTimes, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface SimpleFlutterwaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: any;
  planName: string;
  amount: number;
}

const SimpleFlutterwaveModal: React.FC<SimpleFlutterwaveModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  planName, 
  amount 
}) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    error?: string;
  }>({ status: 'idle' });

  // Set email from user when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    // Simple validation
    const validEmail = email.trim() || user?.email?.trim();
    if (!validEmail) {
      setPaymentState({ status: 'error', error: 'Please enter your email address' });
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setPaymentState({ 
        status: 'error', 
        error: 'Please enter a valid phone number (at least 10 digits)' 
      });
      return;
    }

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Disable Flutterwave fingerprinting globally to prevent errors
      if (typeof window !== 'undefined') {
        (window as any).FlutterwaveDisableFingerprinting = true;
        // Also disable other fingerprinting services
        (window as any).FlutterwaveDisableTracking = true;
        (window as any).FlutterwaveDisableAnalytics = true;
      }

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL || ''
        : '';

      // Get fresh session for authentication with retry logic
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      let currentSession = null;
      let sessionError = null;
      
      // First attempt: Get current session
      const { data: sessionData, error: initialSessionError } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        currentSession = sessionData.session;
      } else {
        // Second attempt: Try to refresh the session
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            currentSession = refreshData.session;
          } else {
            sessionError = refreshError || new Error('Failed to refresh session');
          }
        } catch (refreshErr) {
          sessionError = refreshErr;
        }
      }
      
      // If we still don't have a session, check if user is logged in via context
      if (!currentSession && !sessionError && user?.id) {
        try {
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          if (currentUser && !userError) {
            // Create a minimal session-like object for the API call
            currentSession = {
              access_token: 'context-auth',
              user: currentUser
            };
          } else {
            sessionError = userError || new Error('No valid user found');
          }
        } catch (userErr) {
          sessionError = userErr;
        }
      }
      
      if (!currentSession || sessionError) {
        throw new Error('Authentication failed. Please refresh the page and try again.');
      }

      const response = await fetch(`${baseUrl}/api/payments/flutterwave/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentSession.access_token && currentSession.access_token !== 'context-auth' 
            ? { 'Authorization': `Bearer ${currentSession.access_token}` }
            : {}
          ),
        },
        body: JSON.stringify({
          email: validEmail,
          amount: amount,
          plan_name: planName,
          user_id: user?.id,
          customer_name: user?.display_name || user?.email?.split('@')[0],
          phone_number: phoneNumber.trim()
        })
      });

      const result = await response.json();
      
      if (result.payment_url || (result.success && result.data?.link)) {
        // Store transaction reference
        if (result.data.tx_ref) {
          localStorage.setItem('pending_payment_tx_ref', result.data.tx_ref);
        }
        
        // Redirect to Flutterwave payment page
        // Flutterwave hosted links should be accessed via GET, not POST
        window.location.href = result.payment_url || result.data?.link;
        
        return;
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error.message || 'Payment failed. Please try again.' 
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FaCreditCard className="mr-2 text-blue-600" />
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-900">{planName}</p>
                <p className="text-sm text-blue-600">Monthly Subscription</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  ₦{amount.toLocaleString()}
                </p>
                <p className="text-xs text-blue-500">per month</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08012345678"
                required
              />
            </div>

            {/* Error Message */}
            {paymentState.status === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-600 text-sm">{paymentState.error}</p>
              </div>
            )}

            {/* Success Message */}
            {paymentState.status === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-green-600 text-sm">Payment processed successfully!</p>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading || paymentState.status === 'processing'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading || paymentState.status === 'processing' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay ₦${amount.toLocaleString()} with Flutterwave`
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure payment powered by Flutterwave
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFlutterwaveModal;
