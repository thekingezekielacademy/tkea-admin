const fs = require('fs');

// Read the Dashboard file
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add better error handling for 406 errors
const oldQuery = `      try {
        const { data: trialData, error } = await supabase
          .from('user_trials')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!error && trialData) {`;

const newQuery = `      try {
        const { data: trialData, error } = await supabase
          .from('user_trials')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        // Handle 406 errors gracefully (RLS policy issues)
        if (error && (error.code === 'PGRST116' || error.message?.includes('406'))) {
          console.log('Database table user_trials not available yet or RLS policy issue');
          return;
        }

        if (!error && trialData) {`;

// Replace the query
content = content.replace(oldQuery, newQuery);

// Write the fixed content back
fs.writeFileSync('src/pages/Dashboard.tsx', content);

console.log('✅ Added 406 error handling to Dashboard.tsx');
