const fs = require('fs');

// Read the Subscription.tsx file
let content = fs.readFileSync('src/pages/Subscription.tsx', 'utf8');

// Remove the debug info block
const debugBlock = `                  {/* Debug info - remove this in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mr-4">
                      Debug: Status={subscription?.status}, 
                      CancelAtPeriodEnd={subscription?.cancel_at_period_end?.toString()}, 
                      LocalStorage={localStorage.getItem('subscription_canceled')}
                    </div>
                  )}
                  
                  `;

// Replace with empty string
content = content.replace(debugBlock, '');

// Write the updated content
fs.writeFileSync('src/pages/Subscription.tsx', content);

console.log('✅ Removed debug info from Subscription.tsx');
