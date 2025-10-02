import React, { useState, useEffect, useRef } from 'react';

interface InlineFlutterwavePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  user?: any;
  planName: string;
  amount: number;
}

const InlineFlutterwavePayment: React.FC<InlineFlutterwavePaymentProps> = ({
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
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const paymentFormRef = useRef<HTMLDivElement>(null);

  // Initialize payment data when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
      setPhoneNumber(user.phone || '');
      initializePayment();
    }
  }, [isOpen, user]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

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
          email: user?.email || email,
          amount: amount,
          plan_name: planName,
          user_id: user?.id,
          customer_name: user?.name || user?.email?.split('@')[0],
          phone_number: user?.phone || phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData) {
      setError('Payment data not available. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a simple payment form that redirects to Flutterwave
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.link;
      form.target = '_blank';
      form.style.display = 'none';

      // Add any required fields
      const emailField = document.createElement('input');
      emailField.type = 'hidden';
      emailField.name = 'email';
      emailField.value = user?.email || email;
      form.appendChild(emailField);

      const amountField = document.createElement('input');
      amountField.type = 'hidden';
      amountField.name = 'amount';
      amountField.value = amount.toString();
      form.appendChild(amountField);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Close modal after redirect
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  const handleDirectPayment = () => {
    if (paymentData?.link) {
      // Open payment in new tab
      window.open(paymentData.link, '_blank');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan
              </label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">{planName}</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₦{amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
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
                Phone Number
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleDirectPayment}
                disabled={loading || !paymentData}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Pay with Flutterwave'}
              </button>

              <button
                onClick={handlePayment}
                disabled={loading || !paymentData}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Alternative Payment Method'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Secure payment powered by Flutterwave
              </p>
              <p className="text-xs text-gray-400 mt-1">
                You will be redirected to a secure payment page
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineFlutterwavePayment;
