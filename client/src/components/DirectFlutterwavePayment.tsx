import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

interface DirectFlutterwavePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  user?: any;
  planName: string;
  amount: number;
}

const DirectFlutterwavePayment: React.FC<DirectFlutterwavePaymentProps> = ({
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
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
      setPhoneNumber(user.phone || '');
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pre-open a blank tab synchronously to avoid popup blockers
      const preOpenedWindow = window.open('about:blank', '_blank');

      // Validate inputs
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number (minimum 10 digits)');
      }

      // Initialize payment
      const response = await fetch(`${API_BASE}/flutterwave/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount,
          plan_name: planName,
          user_id: user?.id,
          customer_name: user?.name || email.split('@')[0],
          phone_number: phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.link) {
        setPaymentUrl(result.data.link);
        
        // Navigate the pre-opened tab to the payment URL
        let paymentWindow: Window | null = null;
        if (preOpenedWindow && !preOpenedWindow.closed) {
          preOpenedWindow.location.href = result.data.link;
          paymentWindow = preOpenedWindow;
        } else {
          paymentWindow = window.open(result.data.link, '_blank') as Window | null;
        }

        if (paymentWindow) {
          // Monitor the payment window and verify payment
          const checkClosed = setInterval(async () => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              
              // Wait a moment for webhook to process
              setTimeout(async () => {
                try {
                  // Try verification with retries
                  let verifyResult = null;
                  let retryCount = 0;
                  const maxRetries = 3;
                  
                  while (retryCount < maxRetries && !verifyResult?.success) {
                    console.log(`🔄 Attempting payment verification (attempt ${retryCount + 1}/${maxRetries})`);
                    
                    const verifyResponse = await fetch(`${API_BASE}/flutterwave/verify-payment`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        reference: result.data.tx_ref,
                        transaction_id: result.data.tx_ref
                      }),
                    });

                    verifyResult = await verifyResponse.json();
                    console.log('🔍 Verification response:', verifyResult);
                    
                    if (verifyResult.success) {
                      break;
                    }
                    
                    retryCount++;
                    if (retryCount < maxRetries) {
                      // Wait before retry
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                  }
                  
                  if (verifyResult?.success) {
                    onSuccess({ 
                      success: true, 
                      message: 'Payment verified successfully! Your subscription is now active.',
                      data: verifyResult.data
                    });
                  } else {
                    // If verification fails, show a message asking user to check their subscription status
                    onSuccess({ 
                      success: false, 
                      message: 'Payment verification is taking longer than expected. Please check your subscription status in a few minutes. If payment was deducted but subscription is not active, please contact support.',
                      error: true
                    });
                  }
                } catch (verifyError) {
                  console.error('Payment verification error:', verifyError);
                  onSuccess({ 
                    success: false, 
                    message: 'Payment verification failed. Please check your subscription status in a few minutes. If payment was deducted but subscription is not active, please contact support.',
                    error: true
                  });
                }
                onClose();
              }, 5000); // Wait 5 seconds for webhook processing
            }
          }, 1000);

          // Close this modal
          onClose();
        } else {
          // As a last resort, redirect current tab
          window.location.href = result.data.link;
          return;
        }
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectRedirect = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">{planName}</h3>
              <p className="text-2xl font-bold text-blue-600">
                ₦{amount.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Monthly recurring payment • Billed every month
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Payment Method Notice */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Payment Method Notice
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>⚠️ Card transfers are currently not working. Please use <strong>Bank Transfer</strong> for payment.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Pay with Flutterwave'
                )}
              </button>

              {paymentUrl && (
                <button
                  onClick={handleDirectRedirect}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Open Payment Page
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                🔒 Secure payment powered by Flutterwave
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Payment will open in a new window
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectFlutterwavePayment;
