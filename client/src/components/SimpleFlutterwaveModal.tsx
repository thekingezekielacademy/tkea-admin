import React, { useState, useEffect } from 'react';
import { FaTimes, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface SimpleFlutterwaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: any;
  planName: string;
  amount: number;
}

const SimpleFlutterwaveModal: React.FC<SimpleFlutterwaveModalProps> = ({ 
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

  // Set email from user when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const handlePayment = async () => {
    // Simple validation
    const validEmail = email.trim() || user?.email?.trim();
    if (!validEmail) {
      setPaymentState({ status: 'error', error: 'Please enter your email address' });
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      setPaymentState({ 
        status: 'error', 
        error: 'Please enter your phone number' 
      });
      return;
    }

    setLoading(true);
    setPaymentState({ status: 'processing' });

    try {
      // Simple server call
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/flutterwave/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validEmail,
          amount: amount,
          plan_name: planName,
          user_id: user?.id,
          customer_name: user?.display_name || user?.email?.split('@')[0],
          phone_number: phoneNumber.trim()
        })
      });

      const result = await response.json();
      
      if (result.success && result.data?.link) {
        // Store transaction reference
        if (result.data.tx_ref) {
          localStorage.setItem('pending_payment_tx_ref', result.data.tx_ref);
        }
        
        // Simple redirect - no popup windows, no monitoring
        window.location.href = result.data.link;
        return;
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error.message || 'Payment failed. Please try again.' 
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
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
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">₦{amount.toLocaleString()}</span>
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
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !email.trim() || !phoneNumber.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
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

export default SimpleFlutterwaveModal;
