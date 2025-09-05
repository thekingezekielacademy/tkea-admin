const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Find the problematic section and replace it
const problematicSection = `      console.log(\`🔍 Fetching courses page \${page} with filters:\`, {
        selectedCategory,
        selectedLevel,
        selectedSort,
        searchTerm: debouncedSearchTerm
      });`;

const fixedSection = `      // console.log(\`🔍 Fetching courses page \${page}...\`);`;

// Replace the problematic section
content = content.replace(problematicSection, fixedSection);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Manually fixed console.log in Courses.tsx');
