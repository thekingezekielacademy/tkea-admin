import React, { useState, useEffect } from 'react';
import { FaTimes, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface FlutterwavePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: any;
  planName: string;
  amount: number;
}

// Extend Window interface for Flutterwave
declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

const FlutterwavePaymentModal: React.FC<FlutterwavePaymentModalProps> = ({ isOpen, onClose, onSuccess, user, planName, amount }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);
  const [paymentState, setPaymentState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    error?: string;
  }>({ status: 'idle' });

  // Load Flutterwave script
  useEffect(() => {
    if (isOpen && !window.FlutterwaveCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.onload = () => setFlutterwaveLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Flutterwave script');
        setPaymentState(prev => ({ ...prev, error: 'Payment system unavailable' }));
      };
      document.head.appendChild(script);
    } else if (window.FlutterwaveCheckout) {
      setFlutterwaveLoaded(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    if (!email.trim()) {
      setPaymentState({ status: 'error', error: 'Please enter your email address' });
      return;
    }

    if (!flutterwaveLoaded) {
      setPaymentState({ status: 'error', error: 'Payment system is loading, please wait...' });
      return;
    }

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Use environment variable for Flutterwave public key
      const flutterwavePublicKey = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-d2eaf30b37947d8ee178a7f56417d6ef-X';
      
      // Validate Flutterwave key format
      if (!flutterwavePublicKey || !flutterwavePublicKey.startsWith('FLWPUBK_')) {
        console.error('❌ Invalid Flutterwave public key format:', flutterwavePublicKey);
        throw new Error('Invalid Flutterwave public key format');
      }
      
      console.log('🔧 Flutterwave Payment Modal - Using key:', flutterwavePublicKey?.substring(0, 20) + '...');
      console.log('🔧 Flutterwave Payment Modal - Full key length:', flutterwavePublicKey?.length);
      console.log('🔧 Flutterwave Payment Modal - Key starts with:', flutterwavePublicKey?.substring(0, 10));
      console.log('🔧 Flutterwave Payment Modal - Mode:', process.env.REACT_APP_FLUTTERWAVE_MODE || 'test');

      const tx_ref = `TKE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref: tx_ref,
        amount: amount,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        redirect_url: `${window.location.origin}/payment-verification?tx_ref=${tx_ref}`,
        customer: {
          email: email.trim(),
          name: user?.full_name || user?.email || 'Customer',
        },
        customizations: {
          title: 'King Ezekiel Academy',
          description: `Subscription for ${planName}`,
          logo: `${window.location.origin}/img/logo.png`,
        },
        meta: {
          user_id: user?.id || 'anonymous',
          plan_name: planName,
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
        callback: function(response: any) {
          console.log('✅ Flutterwave payment successful:', response);
          setPaymentState({ status: 'success' });
          
          // Call onSuccess if provided
          if (onSuccess) {
            onSuccess();
          }
          
          // Close modal after success
          setTimeout(() => {
            onClose();
          }, 2000);
        },
        onclose: function() {
          console.log('❌ Flutterwave payment cancelled by user');
          setPaymentState({ status: 'idle' });
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Flutterwave payment error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error.message || 'Payment failed. Please try again.' 
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              placeholder="Enter your email"
              disabled={true}
              readOnly
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span>{planName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>₦{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {!flutterwaveLoaded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mr-2"></div>
                <span className="text-sm text-yellow-700">Loading payment system...</span>
              </div>
            </div>
          )}

          {paymentState.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{paymentState.error}</span>
              </div>
            </div>
          )}

          {paymentState.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-green-700">Payment successful!</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !email.trim() || !flutterwaveLoaded}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaCreditCard className="w-4 h-4 mr-2" />
                  Pay ₦{amount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlutterwavePaymentModal;
