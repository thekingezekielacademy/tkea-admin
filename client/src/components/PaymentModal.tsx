import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paystackService } from '../services/paystackService';
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
  const [email, setEmail] = useState(user?.email || '');

  const handlePayment = async () => {
    if (!user || !email) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Initialize payment
      const paymentInit = await paystackService.initializePayment(email, amount, {
        user_id: user.id,
        plan_name: planName,
      });

      if (paymentInit.success) {
        // Step 2: Open Paystack in a popup window
        const popup = window.open(
          paymentInit.authorization_url,
          'paystack_payment',
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no'
        );

        // Check if popup was blocked
        if (!popup) {
          setError('Popup blocked! Please allow popups and try again.');
          return;
        }

        // Monitor popup for completion
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Payment completed, refresh subscription status
            onSuccess();
          }
        }, 1000);

        // Close modal after opening popup
        onClose();
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
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
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || !email}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
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
