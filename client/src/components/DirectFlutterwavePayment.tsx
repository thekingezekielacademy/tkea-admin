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
        
        // Open payment in new tab
        const paymentWindow = window.open(
          result.data.link,
          'flutterwave_payment',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (paymentWindow) {
          // Monitor the payment window
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              // Assume payment was completed or cancelled
              onSuccess({ 
                success: true, 
                message: 'Payment window closed. Please check your subscription status.' 
              });
              onClose();
            }
          }, 1000);

          // Close this modal
          onClose();
        } else {
          throw new Error('Unable to open payment window. Please check your popup blocker settings.');
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
