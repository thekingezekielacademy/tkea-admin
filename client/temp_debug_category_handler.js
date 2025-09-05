const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Add debugging to handleCategoryChange
const oldHandler = `  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };`;

const newHandler = `  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    console.log('🔍 Category changed to:', newCategory);
    setSelectedCategory(newCategory);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };`;

// Replace the handler
content = content.replace(oldHandler, newHandler);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Added debugging to handleCategoryChange in Courses.tsx');
