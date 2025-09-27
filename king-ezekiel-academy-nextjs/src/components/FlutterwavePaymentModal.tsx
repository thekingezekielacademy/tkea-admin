'use client';
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
    FlutterwaveConfig: {
      publicKey: string;
      txRef: string;
      amount: number;
      currency: string;
      country: string;
      email: string;
      phone_number: string;
      name: string;
      disableFingerprinting?: boolean;
      fingerprintingEnabled?: boolean;
    };
    FlutterwaveDisableFingerprinting?: boolean;
    FlutterwaveDisableTracking?: boolean;
    FlutterwaveDisableAnalytics?: boolean;
    FlutterwaveDisableFingerprint?: boolean;
  }
}

const FlutterwavePaymentModal: React.FC<FlutterwavePaymentModalProps> = ({ 
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

  // Disable Flutterwave fingerprinting globally to avoid 400 errors
  useEffect(() => {
    // Disable all Flutterwave tracking and fingerprinting
    window.FlutterwaveDisableFingerprinting = true;
    window.FlutterwaveDisableTracking = true;
    window.FlutterwaveDisableAnalytics = true;
    window.FlutterwaveDisableFingerprint = true;
    
    // Prevent auto-cancel dialogs
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'flutterwave-cancel' || event.data.type === 'cancel-payment')) {
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Load Flutterwave script
  useEffect(() => {
    const loadFlutterwaveScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script already loaded
        if (window.FlutterwaveCheckout) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Flutterwave script loaded successfully');
          resolve(true);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Flutterwave script');
          reject(new Error('Failed to load Flutterwave script'));
        };
        document.head.appendChild(script);
      });
    };

    if (isOpen) {
      loadFlutterwaveScript()
        .then(() => {
          console.log('✅ Flutterwave inline checkout modal initialized');
        })
        .catch((error) => {
          console.error('❌ Flutterwave initialization error:', error);
          setPaymentState({ status: 'error', error: 'Failed to load payment system' });
        });
    }
  }, [isOpen]);

  // Initialize user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email || '');
      setPhoneNumber(user.phone || '');
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    if (!email.trim() || !phoneNumber.trim()) {
      setPaymentState({ status: 'error', error: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Generate unique transaction reference
      const txRef = `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-1234567890abcdef',
        tx_ref: txRef,
        amount: amount,
        currency: 'NGN',
        country: 'NG',
        email: email,
        phone_number: phoneNumber,
        name: user?.full_name || user?.name || 'User',
        meta: {
          plan_name: planName,
          user_id: user?.id || '',
          academy: 'King Ezekiel Academy'
        },
        customizations: {
          title: 'King Ezekiel Academy',
          description: `Payment for ${planName}`,
          logo: 'https://your-logo-url.com/logo.png'
        },
        redirect_url: `${window.location.origin}/payment-verification?tx_ref=${txRef}`,
        callback_url: `${window.location.origin}/api/payment-callback`,
        customer: {
          email: email,
          phone_number: phoneNumber,
          name: user?.full_name || user?.name || 'User'
        }
      };

      console.log('🚀 Initiating Flutterwave payment:', paymentData);

      // Use Flutterwave inline checkout
      window.FlutterwaveCheckout({
        ...paymentData,
        callback: function(response: any) {
          console.log('💳 Flutterwave callback response:', response);
          if (response.status === 'successful') {
            setPaymentState({ status: 'success' });
            onSuccess?.();
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            setPaymentState({ 
              status: 'error', 
              error: response.message || 'Payment failed' 
            });
          }
        },
        onclose: function() {
          console.log('❌ Payment modal closed by user');
          setPaymentState({ status: 'idle' });
        }
      });

    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      setPaymentState({ 
        status: 'error', 
        error: 'Failed to initialize payment. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <FaCreditCard className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <p className="text-sm text-gray-600">{planName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment State Messages */}
          {paymentState.status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <FaCheckCircle className="text-green-600 text-xl" />
              <div>
                <p className="text-green-800 font-semibold">Payment Successful!</p>
                <p className="text-green-600 text-sm">Your subscription is now active.</p>
              </div>
            </div>
          )}

          {paymentState.status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <FaExclamationTriangle className="text-red-600 text-xl" />
              <div>
                <p className="text-red-800 font-semibold">Payment Failed</p>
                <p className="text-red-600 text-sm">{paymentState.error}</p>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {paymentState.status !== 'success' && (
            <div className="space-y-4">
              {/* Amount Display */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">₦{amount.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{planName}</p>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || paymentState.status === 'processing' || !email.trim() || !phoneNumber.trim()}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading || paymentState.status === 'processing' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaCreditCard />
                    <span>Pay ₦{amount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 Your payment is secured by Flutterwave
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlutterwavePaymentModal;
