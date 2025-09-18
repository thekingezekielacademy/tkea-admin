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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {!paymentUrl ? (
              // Payment Form
              <>
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

                {/* Error/Success Messages */}
                {paymentState.status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{paymentState.error}</p>
                  </div>
                )}

                {paymentState.status === 'success' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">Payment successful! Redirecting...</p>
                  </div>
                )}

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

                <div className="space-y-3">
                  <button
                    onClick={handlePayment}
                    disabled={loading || !email.trim() || !phoneNumber.trim()}
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
                      'Pay with Flutterwave (Embedded)'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    🔒 Secure payment powered by Flutterwave
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Payment will load in this window
                  </p>
                </div>
              </>
            ) : (
              // Payment Iframe
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">{planName}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ₦{amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete your payment below
                  </p>
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
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel Payment
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Manual fallback to popup method');
                      window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                      onClose();
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    🔒 Secure payment powered by Flutterwave
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    If payment form doesn't load, click "Open in New Tab"
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedFlutterwaveModal;
