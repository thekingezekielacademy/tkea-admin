const fs = require('fs');

// Read the Courses file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Add a delay to database queries to ensure auth is ready
const oldEffect = `  useEffect(() => {
    checkSubscriptionAndTrial();
  }, [user?.id]);`;

const newEffect = `  useEffect(() => {
    // Delay database queries to ensure auth is fully ready
    if (user?.id) {
      const timer = setTimeout(() => {
        checkSubscriptionAndTrial();
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);`;

// Replace the effect
content = content.replace(oldEffect, newEffect);

// Write the fixed content back
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Added delay to database queries to ensure auth is ready');
