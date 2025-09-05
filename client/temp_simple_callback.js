const fs = require('fs');

// Read the PaymentModal file
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Replace the entire callback with a simple version
const simpleCallback = `        callback: function(response: any) {
          console.log('✅ Payment successful:', response);
          setPaymentState(prev => ({ ...prev, status: 'success' }));
          
          // Simple success handling - no async operations in callback
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
        }`;

// Find the callback section and replace it
const callbackStart = content.indexOf('callback: function(response: any) {');
const callbackEnd = content.indexOf('}', callbackStart) + 1;

if (callbackStart !== -1 && callbackEnd !== -1) {
  content = content.slice(0, callbackStart) + simpleCallback + content.slice(callbackEnd);
  fs.writeFileSync('src/components/PaymentModal.tsx', content);
  console.log('✅ Replaced callback with simple version');
} else {
  console.log('❌ Could not find callback section');
}

console.log('✅ Simple callback fix completed');
