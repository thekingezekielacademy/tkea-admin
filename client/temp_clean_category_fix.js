const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Add useEffect to watch for filter changes - this is the main fix
const useEffectFix = `
  // Watch for filter changes and refetch courses
  useEffect(() => {
    if (selectedCategory !== 'all' || selectedLevel !== 'all' || selectedSort !== 'all') {
      fetchCourses(0, false);
    }
  }, [selectedCategory, selectedLevel, selectedSort]);

  // Debounce search term to prevent excessive filtering
`;

// Replace the existing debounce useEffect
const oldDebounceUseEffect = `  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);`;

content = content.replace(oldDebounceUseEffect, useEffectFix);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Applied clean category filter fix to Courses.tsx');
