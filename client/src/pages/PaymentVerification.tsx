import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { flutterwaveService } from '../services/flutterwaveService';
import { supabase } from '../lib/supabase';

const PaymentVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const tx_ref = searchParams.get('tx_ref');
        const status = searchParams.get('status');
        const transaction_id = searchParams.get('transaction_id');

        console.log('🔍 Payment Verification Debug:', {
          tx_ref,
          status,
          transaction_id,
          user: user?.id,
          url: window.location.href,
          allParams: Object.fromEntries(searchParams.entries())
        });

        if (!tx_ref) {
          throw new Error('Payment reference not found');
        }

        // Don't fail immediately if status is not 'successful' - let Flutterwave API verify
        // The status parameter might not always be present in the redirect URL
        if (status && status !== 'successful') {
          console.log('⚠️ Status parameter indicates failure, but will verify with Flutterwave API');
        }

        setMessage('Verifying payment with Flutterwave...');

        // Step 1: Verify payment with Flutterwave
        // Pass both tx_ref and transaction_id for better verification
        const verification = await flutterwaveService.verifyPayment(tx_ref, transaction_id || undefined);
        
        if (!verification.success) {
          throw new Error('Payment verification failed');
        }

        const transaction = verification.transaction;

        console.log('🔍 Transaction data for subscription creation:', {
          transaction_id: transaction.id,
          customer_email: transaction.customer.email,
          customer_code: transaction.customer.customer_code,
          customer_data: transaction.customer
        });

        setMessage('Saving payment to database...');

        // Step 2: Save payment to database first
        await flutterwaveService.savePaymentToDatabase(
          user?.id || '',
          transaction
        );

        setMessage('Creating your subscription...');

        // Step 3: Try to create recurring subscription (optional for one-time payments)
        let subscription = null;
        try {
          // Use customer_code if available, otherwise use email as fallback
          const customerCode = transaction.customer.customer_code || transaction.customer.email;
          subscription = await flutterwaveService.createSubscription(
            transaction.customer.email,
            customerCode
          );
          
          if (subscription.success) {
            setMessage('Saving subscription to database...');
            // Step 4: Save subscription to database
            await flutterwaveService.saveSubscriptionToDatabase(
              user?.id || '',
              subscription.subscription
            );
          }
        } catch (subscriptionError) {
          console.warn('⚠️ Subscription creation failed, but payment was successful:', subscriptionError);
          // Create a local subscription entry even if Flutterwave subscription fails
          try {
            setMessage('Creating local subscription...');
            const localSubscription = {
              subscription_code: `LOCAL_${transaction.id}`,
              customer_code: transaction.customer.customer_code || transaction.customer.email,
              plan_name: 'Monthly Membership',
              amount: transaction.amount,
              currency: transaction.currency,
              status: 'active',
              created_at: new Date().toISOString(),
              next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            
            await flutterwaveService.saveSubscriptionToDatabase(
              user?.id || '',
              localSubscription
            );
            console.log('✅ Local subscription created successfully');
          } catch (localSubError) {
            console.error('❌ Local subscription creation also failed:', localSubError);
          }
        }

        // Step 5: Update user's subscription status in secure storage
        if (user?.id) {
          localStorage.setItem('subscription_active', 'true');
          localStorage.setItem('payment_successful', 'true');
          localStorage.setItem('transaction_id', transaction.id);
          localStorage.setItem('transaction_ref', transaction.tx_ref);
          
          if (subscription && subscription.success) {
            localStorage.setItem('subscription_id', subscription.subscription.subscription_code || subscription.subscription.id);
            localStorage.setItem('flutterwave_subscription_id', subscription.subscription.subscription_code || subscription.subscription.id);
            localStorage.setItem('flutterwave_customer_code', transaction.customer.customer_code || transaction.customer.email);
          }
        }

        setStatus('success');
        setMessage('Payment successful! Your subscription is now active.');

        // Redirect to subscription page after 3 seconds to show updated status
        setTimeout(() => {
          navigate('/subscription');
        }, 3000);

      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setMessage('There was an issue with your payment. Please contact support.');
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
  }, [searchParams, user, navigate]);

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
              onClick={() => navigate('/subscription')}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
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
