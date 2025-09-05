const fs = require('fs');

// Read the Courses file to add auth guards
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Add auth guard to database queries
const oldSubscriptionQuery = `  const checkDatabaseSubscription = async () => {
    if (!user?.id) return;`;

const newSubscriptionQuery = `  const checkDatabaseSubscription = async () => {
    if (!user?.id) return;
    
    // Wait for auth to be fully loaded
    if (!supabase.auth.getUser()) {
      console.log('Auth not ready, skipping subscription check');
      return;
    }`;

// Replace the subscription query
content = content.replace(oldSubscriptionQuery, newSubscriptionQuery);

// Add auth guard to trial queries
const oldTrialQuery = `  const checkTrialAccess = async () => {
    if (!user?.id) return;`;

const newTrialQuery = `  const checkTrialAccess = async () => {
    if (!user?.id) return;
    
    // Wait for auth to be fully loaded
    if (!supabase.auth.getUser()) {
      console.log('Auth not ready, skipping trial check');
      return;
    }`;

// Replace the trial query
content = content.replace(oldTrialQuery, newTrialQuery);

// Write the fixed content back
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Added auth guards to database queries');
