'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextOptimized';

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
  const { session } = useAuth();
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

      // Generate unique transaction reference
      const txRef = `KEA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment data for API call
      const paymentData = {
        amount: amount,
        email: email,
        name: user?.full_name || user?.name || 'User',
        plan_id: 'monthly',
        user_id: user?.id // Include user ID for fallback authentication
      };

      console.log('🚀 Creating Flutterwave payment:', paymentData);

      // Use both session auth and authorization header
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Ensure we have a valid user and session
      if (!user?.id) {
        throw new Error('Please log in to continue with payment');
      }

      // Try to get fresh session with retry logic
      const { supabase } = await import('@/lib/supabase');
      let currentSession = null;
      let sessionError = null;
      
      // First attempt: Get current session
      const { data: sessionData, error: initialSessionError } = await supabase.auth.getSession();
      
      console.log('🔍 Initial Session Check:', {
        hasSessionData: !!sessionData,
        hasSession: !!sessionData?.session,
        sessionError: initialSessionError?.message,
        userId: sessionData?.session?.user?.id
      });
      
      if (sessionData?.session) {
        currentSession = sessionData.session;
      } else {
        // Second attempt: Try to refresh the session
        console.log('🔄 Attempting session refresh...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          console.log('🔍 Session Refresh Result:', {
            hasRefreshData: !!refreshData,
            hasSession: !!refreshData?.session,
            refreshError: refreshError?.message,
            userId: refreshData?.session?.user?.id
          });
          
          if (refreshData?.session) {
            currentSession = refreshData.session;
            console.log('✅ Session refreshed successfully');
          } else {
            sessionError = refreshError || new Error('Failed to refresh session');
          }
        } catch (refreshErr) {
          console.error('❌ Session refresh failed:', refreshErr);
          sessionError = refreshErr;
        }
      }
      
      // If we still don't have a session, check if user is logged in via context
      if (!currentSession && !sessionError && user?.id) {
        console.log('🔄 No session found but user context exists, trying alternative auth...');
        // Try to get user without session (for cases where session is valid but not immediately accessible)
        try {
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          if (currentUser && !userError) {
            console.log('✅ Found valid user via getUser()');
            // Create a minimal session-like object for the API call
            currentSession = {
              access_token: 'context-auth',
              user: currentUser
            };
          } else {
            sessionError = userError || new Error('No valid user found');
          }
        } catch (userErr) {
          console.error('❌ getUser() failed:', userErr);
          sessionError = userErr;
        }
      }
      
      // Final fallback: If we have user context but no session, proceed with context auth
      if (!currentSession && !sessionError && user?.id && user?.email) {
        console.log('🔄 Using user context as final fallback for payment...');
        currentSession = {
          access_token: 'context-auth',
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user
          }
        };
      }
      
      if (!currentSession || sessionError) {
        console.error('❌ No valid session found after all attempts:', sessionError);
        throw new Error('Authentication failed. Please refresh the page and try again.');
      }

      // Add Authorization header if we have a valid token
      if (currentSession.access_token && currentSession.access_token !== 'context-auth') {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
        console.log('🔍 Added Authorization header');
      } else {
        console.log('🔍 Relying on cookie-based authentication');
      }

      console.log('🚀 Attempting payment initialization...', {
        url: '/api/payments/flutterwave/initialize',
        headers,
        body: paymentData
      });

      const response = await fetch('/api/payments/flutterwave/initialize', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(paymentData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', { status: response.status, error: errorText });
        throw new Error(`Failed to initialize payment: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment initialization response:', result);
      
      if (result.payment_url) {
        setPaymentUrl(result.payment_url);
        
        // Redirect to payment page in the same window
        window.location.href = result.payment_url;
      } else {
        throw new Error(result.error || 'Failed to create payment link');
      }

    } catch (err) {
      console.error('❌ Payment creation error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold">Subscribe Now</h2>
            <p className="text-sm text-primary-50">{planName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-primary-100 hover:text-white transition-colors text-2xl font-bold px-2 py-1 rounded-full hover:bg-primary-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Amount Display */}
          <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
            <p className="text-2xl font-bold text-gray-900">₦{amount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{planName}</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
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

            <button
              onClick={handlePayment}
              disabled={loading || !email.trim() || !phoneNumber.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay with Flutterwave</span>
                </>
              )}
            </button>
          </div>

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

export default DirectFlutterwavePayment;
