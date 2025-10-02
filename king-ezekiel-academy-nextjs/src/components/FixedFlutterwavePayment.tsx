'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextOptimized';

interface FixedFlutterwavePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
  amount: number;
}

const FixedFlutterwavePayment: React.FC<FixedFlutterwavePaymentProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planName,
  amount
}) => {
  console.log('🔍 FIXED FlutterwavePayment component loaded - this should be the correct one');
  const { user, session } = useAuth();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Check if user and session are available
      if (!user?.id) {
        throw new Error('Please log in to continue with payment');
      }

      if (!session?.access_token) {
        throw new Error('Authentication session expired. Please refresh the page and try again.');
      }

      // Generate unique transaction reference
      const txRef = `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment data for API call
      const paymentData = {
        amount: amount,
        email: email,
        name: user?.full_name || user?.name || 'User',
        plan_id: 'monthly',
        user_id: user?.id,
        tx_ref: txRef,
        phone_number: phoneNumber
      };

      console.log('🚀 Creating Flutterwave payment:', paymentData);

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL || ''
        : '';

      const response = await fetch(`${baseUrl}/api/payments/flutterwave/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      console.log('🔍 Payment API Response:', {
        status: response.status,
        ok: response.ok,
        result: result
      });

      if (!response.ok) {
        console.error('❌ Payment API Error:', result);
        throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.payment_url) {
        // Redirect to Flutterwave payment page
        console.log('✅ Payment initialized successfully, redirecting to:', result.payment_url);
        window.location.href = result.payment_url;
      } else {
        console.error('❌ Payment initialization failed:', result);
        throw new Error(result.message || result.error || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('❌ Payment creation error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
        
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
              Phone Number
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

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Plan:</span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-medium">₦{amount.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedFlutterwavePayment;
