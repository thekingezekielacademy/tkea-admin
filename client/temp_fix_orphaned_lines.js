const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Remove the orphaned lines
const orphanedLines = `      
        selectedCategory,
        selectedLevel,
        selectedSort,
        searchTerm: debouncedSearchTerm
      });`;

const replacement = `      
      // console.log(\`🔍 Fetching courses page \${page}...\`);`;

// Replace the orphaned lines
content = content.replace(orphanedLines, replacement);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Fixed orphaned lines in Courses.tsx');
