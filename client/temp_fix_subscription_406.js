const fs = require('fs');

// Read the Dashboard file
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add better error handling for subscription 406 errors
const oldSubscriptionQuery = `      try {
        const { data: subscriptionData, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && subscriptionData) {`;

const newSubscriptionQuery = `      try {
        const { data: subscriptionData, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Handle 406 errors gracefully (RLS policy issues)
        if (error && (error.code === 'PGRST116' || error.message?.includes('406'))) {
          console.log('Database table user_subscriptions not available yet or RLS policy issue');
          return;
        }

        if (!error && subscriptionData) {`;

// Replace the subscription query
content = content.replace(oldSubscriptionQuery, newSubscriptionQuery);

// Write the fixed content back
fs.writeFileSync('src/pages/Dashboard.tsx', content);

console.log('✅ Added 406 error handling to subscription queries in Dashboard.tsx');
