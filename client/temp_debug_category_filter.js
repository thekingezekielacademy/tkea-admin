const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Add debugging to the fetchCourses function
const debugCode = `
      // Apply category filtering
      if (selectedCategory !== 'all') {
        console.log('🔍 Filtering by category:', selectedCategory);
        query = query.eq('category', selectedCategory);
      } else {
        console.log('🔍 No category filter applied');
      }
`;

// Replace the existing category filtering section
const oldCategoryFilter = `      // Apply category filtering
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }`;

// Replace with debug version
content = content.replace(oldCategoryFilter, debugCode);

// Add debugging to the query result
const oldQueryResult = `      const { data, error: fetchError } = await query;
      
      // console.log(\`📊 Supabase response for page \${page}:\`, { data, error: fetchError });`;

const newQueryResult = `      const { data, error: fetchError } = await query;
      
      console.log(\`📊 Supabase response for page \${page}:\`, { 
        dataCount: data?.length || 0, 
        error: fetchError,
        selectedCategory,
        selectedLevel,
        selectedSort
      });
      
      if (data && data.length > 0) {
        console.log('🔍 Sample course categories:', data.map(c => c.category));
      }`;

// Replace the query result section
content = content.replace(oldQueryResult, newQueryResult);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Added debugging to category filter in Courses.tsx');
