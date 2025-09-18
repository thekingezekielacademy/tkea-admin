import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, apiCall } from '../config/api';

interface EmbeddedFlutterwaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  user: any;
  planName: string;
  amount: number;
}

const EmbeddedFlutterwaveModal: React.FC<EmbeddedFlutterwaveModalProps> = ({
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
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [iframeError, setIframeError] = useState(false);

  // Initialize user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email || '');
      setPhoneNumber(user.phone || '');
    }
  }, [isOpen, user]);

  // Listen for payment completion messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== 'https://checkout.flutterwave.com' && 
          event.origin !== 'https://api.flutterwave.com') {
        return;
      }

      console.log('📨 Payment message received:', event.data);

      if (event.data.type === 'payment_success') {
        setPaymentState({ status: 'success' });
        onSuccess(event.data.paymentData);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (event.data.type === 'payment_error') {
        setPaymentState({ 
          status: 'error', 
          error: event.data.error || 'Payment failed' 
        });
      } else if (event.data.type === 'payment_cancelled') {
        setPaymentState({ 
          status: 'idle', 
          error: 'Payment was cancelled' 
        });
        setPaymentUrl('');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onClose]);

  const handlePayment = async () => {
    if (!email.trim()) {
      setPaymentState({ 
        status: 'error', 
        error: 'Please enter your email address' 
      });
      return;
    }

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Generate unique transaction reference
      const tx_ref = `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Format customer name
      const formattedCustomerName = user?.user_metadata?.full_name || 
                                   user?.user_metadata?.name || 
                                   user?.email?.split('@')[0] || 
                                   'Customer';

      // Format phone number
      const finalPhoneNumber = phoneNumber.replace(/\D/g, '');
      if (finalPhoneNumber && finalPhoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number (at least 10 digits)');
      }

      console.log('🚀 Initializing embedded Flutterwave payment...');
      
      // Get payment URL from server
      const result = await apiCall(API_ENDPOINTS.FLUTTERWAVE_INITIALIZE_PAYMENT, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          amount: Number(amount),
          plan_name: planName,
          user_id: user?.id,
          tx_ref: tx_ref,
          customer_name: formattedCustomerName,
          phone_number: finalPhoneNumber,
        })
      });

      console.log('📡 Server response:', result);
      
      if (result.success && result.data?.link) {
        console.log('✅ Payment URL received:', result.data.link);
        
        // Store transaction reference
        localStorage.setItem('pending_payment_tx_ref', tx_ref);
        
        // Set payment URL to load in iframe
        setPaymentUrl(result.data.link);
        setPaymentState({ status: 'processing' });
        
        // Set a timeout to detect if iframe fails to load
        const iframeTimeout = setTimeout(() => {
          if (!iframeError) {
            console.log('⏰ Iframe timeout - switching to popup');
            setIframeError(true);
            setPaymentState({ 
              status: 'error', 
              error: 'Payment form is taking too long to load. Switching to popup...' 
            });
            
            setTimeout(() => {
              window.open(result.data.link, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
              onClose();
            }, 2000);
          }
        }, 10000); // 10 second timeout
        
        // Clear timeout when iframe loads successfully
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.onload = () => {
            clearTimeout(iframeTimeout);
          };
        }
      } else {
        throw new Error(result.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error.message || 'Payment initialization failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentUrl('');
    setPaymentState({ status: 'idle' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Complete Your Payment
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!paymentUrl ? (
            // Payment Form
            <div className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900">{planName}</h3>
                <p className="text-2xl font-bold text-green-600">
                  ₦{amount.toLocaleString()}
                </p>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email address"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number (optional)"
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {paymentState.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{paymentState.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentState.status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">Payment successful! Redirecting...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading || !email.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          ) : (
            // Payment Iframe
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Complete your payment in the secure form below. Do not close this window until payment is complete.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              {paymentState.status === 'processing' && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing payment...
                  </div>
                </div>
              )}

              {/* Payment Iframe */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={paymentUrl}
                  className="w-full h-96"
                  title="Flutterwave Payment"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox"
                  allow="payment; camera; microphone"
                  onLoad={() => {
                    console.log('🔄 Payment iframe loaded');
                    // Disable fingerprinting in the iframe context
                    try {
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.FlutterwaveDisableFingerprinting = true;
                        iframeRef.current.contentWindow.FlutterwaveDisableTracking = true;
                        iframeRef.current.contentWindow.FlutterwaveDisableFingerprint = true;
                      }
                    } catch (error) {
                      console.log('⚠️ Cannot access iframe content (expected for cross-origin)');
                    }
                  }}
                  onError={(error) => {
                    console.error('❌ Iframe load error:', error);
                    setIframeError(true);
                    setPaymentState({ 
                      status: 'error', 
                      error: 'Iframe failed to load. Switching to popup method...' 
                    });
                    
                    // Auto-fallback to popup after 2 seconds
                    setTimeout(() => {
                      console.log('🔄 Auto-fallback to popup method');
                      window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                      onClose();
                    }, 2000);
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel Payment
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Manual fallback to popup method');
                    window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmbeddedFlutterwaveModal;
