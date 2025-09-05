const fs = require('fs');

// Read the PaymentModal file
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Find and replace the entire callback section
const oldCallback = `        callback: function(response: any) {
          try {
            console.log('✅ Payment successful:', response);
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
            console.error('❌ Error in payment callback:', error);
            setPaymentState(prev => ({ 
              ...prev, 
              status: 'error',
              error: error.message || 'Payment processing failed'
            }));
          }
        }`;

const newCallback = `        callback: function(response: any) {
          console.log('✅ Payment successful:', response);
          setPaymentState(prev => ({ ...prev, status: 'success' }));
          
          // Handle async operations in a separate function
          handlePaymentSuccess(response);
        }`;

// Replace the callback
content = content.replace(oldCallback, newCallback);

// Write the fixed content back
fs.writeFileSync('src/components/PaymentModal.tsx', content);

console.log('✅ Fixed PaymentModal callback - removed await from callback');
