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
  }
}

const FlutterwavePaymentModal: React.FC<FlutterwavePaymentModalProps> = ({ isOpen, onClose, onSuccess, user, planName, amount }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    error?: string;
  }>({ status: 'idle' });

  // Initialize payment modal
  useEffect(() => {
    if (isOpen) {
      console.log('✅ Flutterwave hosted payment modal initialized');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    // Enhanced validation - check both email state and user email
    const validEmail = email.trim() || user?.email?.trim();
    if (!validEmail) {
      setPaymentState({ status: 'error', error: 'Please ensure you are logged in with a valid email address' });
      return;
    }

    // No need to check flutterwaveLoaded since we're using hosted payments

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Professional Flutterwave Configuration - Using new fresh keys
      const flutterwavePublicKey = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-454fa0a1faa931dcccf6672ed71645cd-X';
      
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
      const customerEmail = user?.email || email.trim();
      const customerName = user?.full_name || user?.name || user?.email?.split('@')[0] || customerEmail?.split('@')[0] || 'Customer';
      
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
        console.error('❌ Customer email validation failed:', { customerEmail, userEmail: user?.email, emailState: email });
        throw new Error('Valid email address is required. Please ensure you are logged in or enter your email address.');
      }

      if (!formattedCustomerName || formattedCustomerName.trim().length < 2) {
        throw new Error('Customer name is required (minimum 2 characters)');
      }

      // Validate phone number with better fallback
      const finalPhoneNumber = phoneNumber?.trim() || user?.phone?.trim() || '08000000000';
      if (!finalPhoneNumber || finalPhoneNumber.trim().length < 10) {
        throw new Error('Valid phone number is required (minimum 10 digits). Please enter a Nigerian phone number like 08012345678.');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Skip API test - causes CORS issues, will test through payment flow
      console.log('🚀 Proceeding with Flutterwave payment initialization...');

      // PRECISE DEBUGGING - Check for empty values before sending
      console.log('🔍 DEBUGGING VALUES BEFORE SENDING TO SERVER:');
      console.log('tx_ref:', tx_ref, 'Length:', tx_ref.length);
      console.log('email:', customerEmail, 'Length:', customerEmail.length);
      console.log('customer_name:', formattedCustomerName, 'Length:', formattedCustomerName.length);
      console.log('phone_number:', finalPhoneNumber, 'Length:', finalPhoneNumber.length);
      console.log('amount:', amount, 'Type:', typeof amount);
      
      // CRITICAL VALIDATION - Ensure no empty values
      if (!tx_ref || tx_ref.length < 4) {
        throw new Error(`Invalid tx_ref: "${tx_ref}" (length: ${tx_ref?.length || 0})`);
      }
      if (!customerEmail || customerEmail.length < 4) {
        throw new Error(`Invalid email: "${customerEmail}" (length: ${customerEmail?.length || 0})`);
      }
      if (!formattedCustomerName || formattedCustomerName.length < 4) {
        throw new Error(`Invalid customer_name: "${formattedCustomerName}" (length: ${formattedCustomerName?.length || 0}). Customer name must be at least 4 characters long.`);
      }
      if (!finalPhoneNumber || finalPhoneNumber.length < 10) {
        throw new Error(`Invalid phone_number: "${finalPhoneNumber}" (length: ${finalPhoneNumber?.length || 0})`);
      }
      
      console.log('✅ ALL VALUES VALIDATED - No empty values detected');

      // FLUTTERWAVE HOSTED PAYMENT SOLUTION - BYPASS FINGERPRINTING
      console.log('🚀 Using Flutterwave hosted payment solution to bypass fingerprinting...');
      
      // Use server-side initialization to get hosted payment link
      console.log('🚀 Making request to Flutterwave API endpoint...');
      try {
        const response = await fetch('/api/flutterwave/initialize-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customerEmail,
            amount: Number(amount),
            plan_name: planName,
            user_id: user?.id,
            tx_ref: tx_ref,
            customer_name: formattedCustomerName,
            phone_number: finalPhoneNumber,
          }),
        });

        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Server-side Flutterwave initialization successful:', result.data);
          
          // Use the server-generated payment link directly (hosted payment)
          if (result.data.link) {
            console.log('🚀 Redirecting to Flutterwave hosted payment page:', result.data.link);
            
            // Open in new tab to avoid fingerprinting issues
            const paymentWindow = window.open(result.data.link, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!paymentWindow) {
              // Fallback to same window if popup blocked
              window.location.href = result.data.link;
            } else {
              // Monitor the payment window
              const checkClosed = setInterval(() => {
                if (paymentWindow.closed) {
                  clearInterval(checkClosed);
                  // Payment window closed, redirect to verification
                  window.location.href = '/payment-verification';
                }
              }, 1000);
            }
            return;
          } else if (result.data.authorization_url) {
            console.log('🚀 Redirecting to Flutterwave authorization URL:', result.data.authorization_url);
            
            // Open in new tab to avoid fingerprinting issues
            const paymentWindow = window.open(result.data.authorization_url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!paymentWindow) {
              // Fallback to same window if popup blocked
              window.location.href = result.data.authorization_url;
            } else {
              // Monitor the payment window
              const checkClosed = setInterval(() => {
                if (paymentWindow.closed) {
                  clearInterval(checkClosed);
                  // Payment window closed, redirect to verification
                  window.location.href = '/payment-verification';
                }
              }, 1000);
            }
            return;
          } else {
            throw new Error('No payment link received from server');
          }
          
        } else {
          throw new Error(result.message || 'Server-side Flutterwave initialization failed');
        }
        
      } catch (error) {
        console.error('❌ Server-side Flutterwave initialization failed:', error);
        throw new Error('Payment initialization failed. Please try again.');
      }

    } catch (error) {
      console.error('Flutterwave payment error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error.message || 'Payment failed. Please try again.' 
      });
      setLoading(false);
    } finally {
      // Ensure loading is always reset
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="08012345678"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for payment verification. Nigerian number format (08012345678)
            </p>
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
              disabled={loading || !email.trim() || !phoneNumber.trim()}
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

          {/* Helpful message when button is disabled */}
          {(!phoneNumber.trim() || !email.trim()) && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                {!phoneNumber.trim() ? 'Please enter your phone number to continue' : 
                 !email.trim() ? 'Please enter your email to continue' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlutterwavePaymentModal;
