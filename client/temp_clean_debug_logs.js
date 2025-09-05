const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Remove all debug console.log statements
const debugLogs = [
  "console.log('🔍 Filtering by category:', selectedCategory);",
  "console.log('🔍 No category filter applied - showing all categories');",
  "console.log(`📊 Supabase response for page ${page}:`, {",
  "console.log('🔍 Sample course categories:', data.map(c => ({ id: c.id, title: c.title, category: c.category })));",
  "console.log('⚠️ No courses found for category:', selectedCategory);",
  "console.log('🔍 Filter changed, refetching courses:', { selectedCategory, selectedLevel, selectedSort });",
  "console.log(`🔍 Fetching courses page ${page} with filters:`, {",
  "console.log('🔍 Filtered courses count:', filteredCourses.length, 'out of', courses.length, 'total courses');"
];

// Remove each debug log
debugLogs.forEach(log => {
  content = content.replace(new RegExp(log.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
});

// Clean up any empty lines that might have been left
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Cleaned up debug logs from Courses.tsx');
