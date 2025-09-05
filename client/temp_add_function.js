const fs = require('fs');

// Read the PaymentModal file
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Add the handlePaymentSuccess function after the existing functions
const handlePaymentSuccessFunction = `
  // Handle payment success with async operations
  const handlePaymentSuccess = async (response: any) => {
    try {
      setPaymentState(prev => ({ ...prev, status: 'processing' }));
      
      // Verify payment with backend before creating subscription
      const verificationResponse = await fetch('/api/paystack/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: response.reference,
          amount: amount * 100
        })
      });

      if (!verificationResponse.ok) {
        throw new Error('Payment verification failed');
      }

      const verificationData = await verificationResponse.json();
      
      if (!verificationData.success) {
        throw new Error(verificationData.message || 'Payment verification failed');
      }

      // Create subscription in database
      const subscriptionData = {
        user_id: user.id,
        user_email: user.email,
        plan_name: planName,
        amount: amount,
        currency: 'NGN',
        status: 'active',
        paystack_subscription_id: response.reference,
        paystack_customer_code: user?.id,
        start_date: new Date().toISOString(),
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscriptionResult = await subscriptionResponse.json();
      
      // Update local state
      setPaymentState(prev => ({ 
        ...prev, 
        status: 'success',
        subscription: subscriptionResult
      }));

      // Store in localStorage for persistence
      localStorage.setItem('subscription_data', JSON.stringify(subscriptionResult));
      
      // Close modal after successful payment
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to update UI
      }, 2000);

    } catch (error) {
      console.error('❌ Error in payment processing:', error);
      setPaymentState(prev => ({ 
        ...prev, 
        status: 'error',
        error: error.message || 'Payment processing failed'
      }));
    }
  };
`;

// Find the position to insert the function (after the existing functions)
const insertPosition = content.indexOf('  // Reset state when modal opens');
content = content.slice(0, insertPosition) + handlePaymentSuccessFunction + content.slice(insertPosition);

// Write the fixed content back
fs.writeFileSync('src/components/PaymentModal.tsx', content);

console.log('✅ Added handlePaymentSuccess function');
