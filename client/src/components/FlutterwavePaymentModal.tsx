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

  // Load Flutterwave script dynamically
  useEffect(() => {
    if (isOpen) {
      if (window.FlutterwaveCheckout) {
        console.log('✅ Flutterwave script already loaded');
        setFlutterwaveLoaded(true);
      } else {
        console.log('⏳ Loading Flutterwave script...');
        
        // Load Flutterwave script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Flutterwave script loaded successfully');
          
          // Debug Flutterwave SDK
          console.log('🔧 Flutterwave SDK loaded:', typeof window.FlutterwaveCheckout);
          console.log('🔧 Flutterwave SDK methods:', Object.keys(window.FlutterwaveCheckout || {}));
          console.log('🔧 Public key available:', !!process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY);
          console.log('🔧 Public key value:', process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY?.substring(0, 20) + '...');
          
          // Try to set the public key globally for Flutterwave
          if (window.FlutterwaveCheckout && process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY) {
            try {
              // Try different methods to set the public key
              if (typeof window.FlutterwaveCheckout.setPublicKey === 'function') {
                window.FlutterwaveCheckout.setPublicKey(process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY);
                console.log('✅ Flutterwave public key set globally via setPublicKey');
              } else if (typeof window.FlutterwaveCheckout.setPublicKey === 'function') {
                window.FlutterwaveCheckout.setPublicKey(process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY);
                console.log('✅ Flutterwave public key set globally via setPublicKey');
              } else if (window.FlutterwaveCheckout.publicKey !== undefined) {
                window.FlutterwaveCheckout.publicKey = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY;
                console.log('✅ Flutterwave public key set globally via property');
              } else {
                console.log('⚠️ No method found to set Flutterwave public key globally');
                console.log('🔧 Available methods:', Object.getOwnPropertyNames(window.FlutterwaveCheckout));
              }
            } catch (error) {
              console.error('❌ Failed to set Flutterwave public key globally:', error);
            }
          }
          
          setFlutterwaveLoaded(true);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Flutterwave script');
          setPaymentState(prev => ({ 
            ...prev, 
            error: 'Payment system is temporarily unavailable. Please refresh the page and try again.' 
          }));
        };
        document.head.appendChild(script);
        
        // Fallback timeout
        setTimeout(() => {
          if (!window.FlutterwaveCheckout) {
            console.error('❌ Flutterwave script failed to load after 10 seconds');
            setPaymentState(prev => ({ 
              ...prev, 
              error: 'Payment system is temporarily unavailable. Please refresh the page and try again.' 
            }));
          }
        }, 10000);
      }
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
      // Use live key from environment variables
      const flutterwavePublicKey = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-fa262382709276e0900a8d2c6fcbe7ff-X';
      
      // Enhanced Flutterwave key validation
      if (!flutterwavePublicKey) {
        console.error('❌ Flutterwave public key is missing');
        throw new Error('Flutterwave payment system is not configured. Please contact support.');
      }
      
      if (!flutterwavePublicKey.startsWith('FLWPUBK')) {
        console.error('❌ Invalid Flutterwave public key format:', flutterwavePublicKey);
        throw new Error('Invalid Flutterwave public key format. Please contact support.');
      }
      
      // Check if key is properly formatted (should be at least 40 characters)
      if (flutterwavePublicKey.length < 40) {
        console.error('❌ Flutterwave public key is too short:', flutterwavePublicKey);
        throw new Error('Invalid Flutterwave public key. Please contact support.');
      }
      
      console.log('🔧 Flutterwave Payment Modal - Using key:', flutterwavePublicKey?.substring(0, 20) + '...');
      console.log('🔧 Flutterwave Payment Modal - Full key length:', flutterwavePublicKey?.length);
      console.log('🔧 Flutterwave Payment Modal - Key starts with:', flutterwavePublicKey?.substring(0, 10));
      console.log('🔧 Flutterwave Payment Modal - Mode: live');
      console.log('🔧 Flutterwave Payment Modal - Using live key: true');

      const tx_ref = `TKE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Validate required fields with better extraction
      const customerName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Customer';
      const customerEmail = email.trim();
      
      // Ensure customer name is properly formatted and not empty
      const formattedCustomerName = customerName.trim().substring(0, 50) || 'Customer';
      
      console.log('🔧 Flutterwave Payment Modal - Customer details:', {
        name: formattedCustomerName,
        email: customerEmail,
        nameLength: formattedCustomerName.length,
        emailLength: customerEmail.length,
        originalName: customerName
      });

      // Enhanced validation with better error messages
      if (!customerEmail || customerEmail.trim().length < 4) {
        throw new Error('Valid email address is required (minimum 4 characters)');
      }

      if (!formattedCustomerName || formattedCustomerName.trim().length < 2) {
        throw new Error('Customer name is required (minimum 2 characters)');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        throw new Error('Please enter a valid email address');
      }

      const flutterwaveConfig = {
        public_key: flutterwavePublicKey,
        tx_ref: tx_ref,
        amount: Number(amount),
        currency: 'NGN',
        country: 'NG',
        payment_options: 'card,mobilemoney,ussd',
        redirect_url: `${window.location.origin}/payment-verification?tx_ref=${tx_ref}`,
        customer: {
          email: customerEmail,
          name: formattedCustomerName,
          phone_number: user?.phone || '08000000000',
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
        subaccounts: [],
        payment_plan: null,
        integrity_hash: null,
        callback: function(response: any) {
          console.log('🔧 Flutterwave Response:', response);
          
          if (response.status === 'successful') {
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
          } else {
            console.error('❌ Flutterwave payment failed:', response);
            setPaymentState({ 
              status: 'error', 
              error: response.message || 'Payment failed. Please try again.' 
            });
            setLoading(false);
          }
        },
        onclose: function() {
          console.log('❌ Flutterwave payment cancelled by user');
          setPaymentState({ status: 'idle' });
          setLoading(false);
        },
      };

      console.log('🔧 Flutterwave Payment Modal - Full config:', JSON.stringify(flutterwaveConfig, null, 2));

      // Wait a bit for Flutterwave to be fully loaded
      setTimeout(() => {
        try {
          if (!window.FlutterwaveCheckout) {
            throw new Error('Flutterwave payment system is not loaded. Please refresh the page and try again.');
          }
          
          console.log('🚀 Initializing Flutterwave payment with config:', {
            public_key: flutterwavePublicKey?.substring(0, 20) + '...',
            tx_ref: tx_ref,
            amount: amount,
            customer_email: customerEmail,
            customer_name: formattedCustomerName
          });
          
          // Debug the exact config being passed
          console.log('🔧 Full Flutterwave config being passed:', JSON.stringify(flutterwaveConfig, null, 2));
          console.log('🔧 Flutterwave SDK type:', typeof window.FlutterwaveCheckout);
          console.log('🔧 Flutterwave SDK available:', !!window.FlutterwaveCheckout);
          
          // Try different initialization methods
          try {
            // Method 1: Standard initialization
            window.FlutterwaveCheckout(flutterwaveConfig);
          } catch (error) {
            console.error('❌ Standard Flutterwave initialization failed:', error);
            
            // Method 2: Try with explicit public key setting
            try {
              const configWithExplicitKey = {
                ...flutterwaveConfig,
                public_key: flutterwavePublicKey
              };
              window.FlutterwaveCheckout(configWithExplicitKey);
            } catch (error2) {
              console.error('❌ Explicit key Flutterwave initialization failed:', error2);
              
              // Method 3: Try with different key format
              try {
                const configWithFormattedKey = {
                  ...flutterwaveConfig,
                  public_key: flutterwavePublicKey.trim()
                };
                window.FlutterwaveCheckout(configWithFormattedKey);
              } catch (error3) {
                console.error('❌ Formatted key Flutterwave initialization failed:', error3);
                throw new Error('All Flutterwave initialization methods failed');
              }
            }
          }
        } catch (error) {
          console.error('💥 Flutterwave initialization error:', error);
          setPaymentState({ 
            status: 'error', 
            error: error.message || 'Failed to initialize payment. Please try again.' 
          });
          setLoading(false);
        }
      }, 100);

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
