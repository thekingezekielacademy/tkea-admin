const fs = require('fs');

// Clean up unused imports in AuthContext
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Remove unused criticalLog import
content = content.replace(/import.*criticalLog.*from.*secureLogger.*\n/, '');
content = content.replace(/const.*criticalLog.*=.*secureLogger\.criticalLog.*\n/, '');

// Remove unused authLoading variable
content = content.replace(/const.*authLoading.*=.*false.*\n/, '');

// Remove unused testData variable
content = content.replace(/const.*testData.*=.*\{.*\}.*\n/, '');

fs.writeFileSync('src/contexts/AuthContext.tsx', content);

console.log('✅ Cleaned up AuthContext warnings');
