const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Find and fix the broken console.log
const brokenPattern = /console\.log\(`🔍 Fetching courses page \${page} with filters:`, \{\s*selectedCategory,\s*selectedLevel,\s*selectedSort,\s*searchTerm: debouncedSearchTerm\s*\}\);/g;

const fixedCode = `// console.log(\`🔍 Fetching courses page \${page}...\`);`;

content = content.replace(brokenPattern, fixedCode);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Fixed broken console.log in Courses.tsx');
