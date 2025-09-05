const fs = require('fs');

// Read the PaymentModal file
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Find the callback section and clean it up
const callbackStart = content.indexOf('callback: function(response: any) {');
const nextBrace = content.indexOf('}', callbackStart) + 1;

if (callbackStart !== -1 && nextBrace !== -1) {
  // Find the end of the callback object (look for the closing brace and comma)
  let callbackEnd = nextBrace;
  while (callbackEnd < content.length && content[callbackEnd] !== ',' && content[callbackEnd] !== '}') {
    callbackEnd++;
  }
  
  // Replace with clean callback
  const cleanCallback = `callback: function(response: any) {
          console.log('✅ Payment successful:', response);
          setPaymentState(prev => ({ ...prev, status: 'success' }));
          
          // Simple success handling - no async operations in callback
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
        }`;
  
  content = content.slice(0, callbackStart) + cleanCallback + content.slice(callbackEnd);
  fs.writeFileSync('src/components/PaymentModal.tsx', content);
  console.log('✅ Cleaned up callback section');
} else {
  console.log('❌ Could not find callback section');
}

console.log('✅ Callback cleanup completed');
