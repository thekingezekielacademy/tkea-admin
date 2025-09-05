const fs = require('fs');

// Read the PaymentModal file
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Find the try block that starts around line 270
const tryStart = content.indexOf('    try {');
const onCloseStart = content.indexOf('        onClose: function() {');

if (tryStart !== -1 && onCloseStart !== -1) {
  // Find the end of the try block (before onClose)
  let tryEnd = onCloseStart;
  
  // Add the missing catch block
  const catchBlock = `
    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      setPaymentState(prev => ({ 
        ...prev, 
        status: 'error',
        error: error.message || 'Payment initialization failed'
      }));
      setLoading(false);
    }
  `;
  
  content = content.slice(0, tryEnd) + catchBlock + content.slice(tryEnd);
  fs.writeFileSync('src/components/PaymentModal.tsx', content);
  console.log('✅ Added missing catch block');
} else {
  console.log('❌ Could not find try block or onClose');
}

console.log('✅ Try-catch fix completed');
