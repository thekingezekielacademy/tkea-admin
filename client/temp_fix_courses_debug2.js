const fs = require('fs');

// Read the Courses file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Fix the trial access debug block
const oldTrialDebug = `    // console.log('🔍 Trial access debug:', {
      user: user?.id,
      hasTrialAccess,
      subActive: databaseSubscriptionStatus || secureStorage.isSubscriptionActive(),
      trialStatus: localStorage.getItem('user_trial_status')
    });`;

const newTrialDebug = `    // console.log('🔍 Trial access debug:', {
    //   user: user?.id,
    //   hasTrialAccess,
    //   subActive: databaseSubscriptionStatus || secureStorage.isSubscriptionActive(),
    //   trialStatus: localStorage.getItem('user_trial_status')
    // });`;

// Replace the trial debug block
content = content.replace(oldTrialDebug, newTrialDebug);

// Write the fixed content back
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Fixed Courses trial debug block syntax error');
