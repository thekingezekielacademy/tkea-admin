'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { createClient } from '@/lib/supabase';

const PaymentVerification: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const supabase = createClient();
        // First, check if user already has an active subscription
        if (user?.id) {
          const { data: existingSubscription } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (existingSubscription && existingSubscription.length > 0) {
            console.log('✅ User already has active subscription:', existingSubscription[0]);
            setStatus('success');
            setMessage('Payment successful! Your subscription is already active.');
            
            // Update local storage
            if (typeof window !== 'undefined') {
              localStorage.setItem('subscription_active', 'true');
              localStorage.setItem('payment_successful', 'true');
            }
            
            setTimeout(() => {
              router.push('/subscription');
            }, 2000);
            return;
          }
        }
        
        const tx_ref = searchParams.get('tx_ref');
        const status = searchParams.get('status');
        const transaction_id = searchParams.get('transaction_id');

        console.log('🔍 Payment Verification Debug:', {
          tx_ref,
          status,
          transaction_id,
          user: user?.id,
          url: typeof window !== 'undefined' ? window.location.href : '',
          allParams: Object.fromEntries(searchParams.entries())
        });

        if (!tx_ref) {
          throw new Error('Payment reference not found');
        }

        // Check if status indicates cancellation or failure
        if (status && (status === 'cancelled' || status === 'failed')) {
          console.log('❌ Status parameter indicates payment was cancelled or failed');
          setStatus('error');
          setError('Payment was cancelled or failed');
          setMessage('Your payment was not completed. Please try again.');
          return;
        }
        
        // Don't fail immediately if status is not 'successful' - let Flutterwave API verify
        // The status parameter might not always be present in the redirect URL
        if (status && status !== 'successful') {
          console.log('⚠️ Status parameter indicates failure, but will verify with Flutterwave API');
        }

        setMessage('Verifying payment with Flutterwave...');

        // Call Flutterwave verification API
        const response = await fetch('/api/payments/flutterwave/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tx_ref }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Payment verification failed');
        }

        console.log('✅ Payment verified successfully:', result);

        // Update user's subscription status in secure storage
        if (user?.id && typeof window !== 'undefined') {
          localStorage.setItem('subscription_active', 'true');
          localStorage.setItem('payment_successful', 'true');
          localStorage.setItem('transaction_id', transaction_id || '');
          localStorage.setItem('transaction_ref', tx_ref);
        }

        setStatus('success');
        setMessage('Payment successful! Your subscription is now active.');

        // Redirect to subscription page after 3 seconds to show updated status
        setTimeout(() => {
          router.push('/subscription');
        }, 3000);

      } catch (err) {
        console.error('Payment verification error:', err);
        
        // Check if subscription might have been created despite the error
        try {
          if (user?.id) {
            const supabase = createClient();
            const { data: existingSubscription } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (existingSubscription && existingSubscription.length > 0) {
              console.log('✅ Found existing active subscription despite error:', existingSubscription[0]);
              setStatus('success');
              setMessage('Payment successful! Your subscription is now active.');
              
              // Update local storage
              if (typeof window !== 'undefined') {
                localStorage.setItem('subscription_active', 'true');
                localStorage.setItem('payment_successful', 'true');
              }
              
              setTimeout(() => {
                router.push('/subscription');
              }, 3000);
              return;
            }
          }
        } catch (checkError) {
          console.error('Error checking for existing subscription:', checkError);
        }
        
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setMessage('There was an issue with your payment. Please try again or contact support.');
      }
    };

    if (user) {
      setStatus('verifying');
      setMessage('Verifying your payment...');
      verifyPayment();
    } else {
      // If no user, show loading and wait a bit for auth to load
      setTimeout(() => {
        if (!user) {
          setStatus('error');
          setError('Please sign in to verify your payment');
          setMessage('Authentication required');
        }
      }, 2000);
    }
  }, [searchParams, user, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
        );
      case 'verifying':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        );
      case 'success':
        return (
          <div className="bg-green-100 rounded-full p-3">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-100 rounded-full p-3">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-gray-600';
      case 'verifying':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Loading...'}
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'error' && 'Payment Failed'}
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              🎉 Welcome to King Ezekiel Academy! You now have full access to all courses.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                setStatus('verifying');
                setMessage('Re-verifying your payment...');
                setError(null);
                // Re-run verification
                setTimeout(() => {
                  const tx_ref = searchParams.get('tx_ref');
                  if (tx_ref) {
                    window.location.href = `/payment-verification?tx_ref=${tx_ref}&retry=${retryCount + 1}`;
                  }
                }, 1000);
              }}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Check Again
            </button>
            <button
              onClick={() => router.push('/subscription')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Subscription
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'verifying' && (
          <div className="text-sm text-gray-500">
            Please wait while we process your payment...
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification;