const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Fix the syntax error by removing the incomplete console.log
const brokenLog = `      console.log(\`🔍 Fetching courses page \${page} with filters:\`, {
        selectedCategory,
        selectedLevel,
        selectedSort,
        searchTerm: debouncedSearchTerm
      });`;

const fixedLog = `      // console.log(\`🔍 Fetching courses page \${page}...\`);`;

content = content.replace(brokenLog, fixedLog);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Fixed syntax error in Courses.tsx');
