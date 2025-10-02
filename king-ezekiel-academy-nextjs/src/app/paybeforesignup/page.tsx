'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HydrationSafeValue } from '@/components/HydrationSafeValue';

// Using API approach - no need for Flutterwave global declarations

const PayBeforeSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  // Removed flutterwaveReady state - using API approach now
  const router = useRouter();

  // Check for payment result URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentCancelled = urlParams.get('payment_cancelled');
    const txRef = urlParams.get('tx_ref');
    
    if (paymentSuccess === 'true') {
      setSuccess(true);
      // Update stored payment data to completed
      const storedPayment = sessionStorage.getItem('pendingPayment');
      if (storedPayment) {
        const paymentData = JSON.parse(storedPayment);
        const updatedPaymentData = {
          ...paymentData,
          status: 'completed',
          txRef: txRef || paymentData.txRef
        };
        sessionStorage.setItem('pendingPayment', JSON.stringify(updatedPaymentData));
      }
      
      // Redirect to signup page after showing success
      setTimeout(() => {
        router.push(`/signup?payment_success=true&tx_ref=${txRef}`);
      }, 2000);
    } else if (paymentCancelled === 'true') {
      setError('Payment was cancelled. You can try again when ready.');
    }
    
    // Clean up the URL
    if (paymentSuccess || paymentCancelled) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [router]);

  // Removed Flutterwave script loading - using API approach now

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // More inclusive Nigerian phone number validation
    const phoneRegex = /^(\+234|234|0)?[789]\d{9}$/;
    const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Nigerian phone number (e.g., 08012345678, +2348012345678)');
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Generate unique transaction reference
      const txRef = `KEA_PRE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store payment data temporarily for signup flow
      const paymentData = {
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        txRef,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Store in sessionStorage for signup flow
      sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));

      console.log('🚀 Creating pre-signup payment via API:', paymentData);

      // Use the new Flutterwave API approach (same as subscription but for pre-signup)
      const response = await fetch('/api/payments/flutterwave/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 2500,
          email: formData.email.trim(),
          name: 'King Ezekiel Academy Student',
          plan_id: 'monthly',
          user_id: 'pre-signup-user', // Special ID for pre-signup users
          phone_number: formData.phoneNumber.trim(),
          tx_ref: txRef,
          source: 'paybeforesignup'
        }),
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
               console.log('🔍 Payment URL details:', {
                 url: result.payment_url,
                 length: result.payment_url.length,
                 startsWith: result.payment_url.startsWith('https://checkout.flutterwave.com')
               });
               
               // Add a small delay to ensure the page is ready
               setRedirecting(true);
               setTimeout(() => {
                 console.log('🚀 Redirecting to Flutterwave...');
                 window.location.href = result.payment_url;
               }, 500);

               // Fallback timeout in case the redirect doesn't work
               setTimeout(() => {
                 if (redirecting) {
                   console.log('⚠️ Redirect timeout - trying direct navigation');
                   window.open(result.payment_url, '_blank');
                 }
               }, 10000); // 10 second timeout
             } else {
        console.error('❌ Payment initialization failed:', result);
        throw new Error(result.message || result.error || 'Payment initialization failed');
      }
      
    } catch (err) {
      console.error('❌ Payment creation error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

         if (success) {
           return (
             <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
               <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
                 <p className="text-gray-600 mb-6">
                   Your subscription is confirmed. You'll be redirected to create your account in a moment.
                 </p>
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
               </div>
             </div>
           );
         }

         if (redirecting) {
           return (
             <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
               <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Payment...</h2>
                 <p className="text-gray-600 mb-6">
                   Please wait while we redirect you to the secure payment page.
                 </p>
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
               </div>
             </div>
           );
         }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">King Ezekiel Academy</h1>
                <p className="text-sm text-gray-500">Digital Marketing Education</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Sales Copy */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Access Unlimited,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Non-Stop Learning
                </span>
              </h2>
              <p className="mt-4 text-xl text-gray-600 leading-relaxed">
                Join thousands of successful students who transformed their careers with our comprehensive digital marketing courses.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700">Unlimited access to all courses</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700">Expert-led video tutorials</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700">24/7 community support</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700">Certificate of completion</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-900">Monthly Subscription</p>
                  <p className="text-2xl font-bold text-indigo-600">₦2,500</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-700">Cancel anytime</p>
                  <p className="text-xs text-indigo-600">14-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Access</h3>
              <p className="text-gray-600">Complete your payment and create your account</p>
            </div>

            {error && (
              <div className={`mb-6 px-4 py-3 rounded-lg flex items-start ${
                error.includes('cancelled') 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {error.includes('cancelled') ? (
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <p className="font-medium">{error}</p>
                  {error.includes('cancelled') && (
                    <p className="text-sm mt-1 opacity-90">
                      Your payment information is saved. You can complete your payment anytime to access your courses.
                    </p>
                  )}
                  {error.includes('not successful') && (
                    <p className="text-sm mt-1 opacity-90">
                      Please check your card details or try a different payment method.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base"
                    placeholder="08012345678 or +2348012345678"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter your Nigerian phone number (e.g., 08012345678, +2348012345678)</p>
              </div>

              <HydrationSafeValue fallback={
                <button
                  disabled={true}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-gray-400 cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                </button>
              }>
                <button
                  onClick={handlePayment}
                  disabled={loading || !formData.email.trim() || !formData.phoneNumber.trim()}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Pay ₦2,500 with Flutterwave
                    </div>
                  )}
                </button>
              </HydrationSafeValue>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By proceeding, you agree to our{' '}
                  <a href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Secure Payment</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Instant Access</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Lifetime Support</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Certified Courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayBeforeSignup;
