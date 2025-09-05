const fs = require('fs');

// Read the Courses.tsx file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Fix 1: Add useEffect to watch for filter changes
const useEffectFix = `
  // Watch for filter changes and refetch courses
  useEffect(() => {
    if (selectedCategory !== 'all' || selectedLevel !== 'all' || selectedSort !== 'all') {
      console.log('🔍 Filter changed, refetching courses:', { selectedCategory, selectedLevel, selectedSort });
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

// Fix 2: Improve the fetchCourses function to handle filters better
const oldFetchCoursesStart = `  // Fetch courses from database with pagination
  const fetchCourses = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // console.log(\`🔍 Fetching courses page \${page}...\`);`;

const newFetchCoursesStart = `  // Fetch courses from database with pagination
  const fetchCourses = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      console.log(\`🔍 Fetching courses page \${page} with filters:\`, {
        selectedCategory,
        selectedLevel,
        selectedSort,
        searchTerm: debouncedSearchTerm
      });`;

content = content.replace(oldFetchCoursesStart, newFetchCoursesStart);

// Fix 3: Improve the category filtering logic
const oldCategoryFilter = `      // Apply category filtering
      if (selectedCategory !== 'all') {
        console.log('🔍 Filtering by category:', selectedCategory);
        query = query.eq('category', selectedCategory);
      } else {
        console.log('🔍 No category filter applied');
      }`;

const newCategoryFilter = `      // Apply category filtering
      if (selectedCategory !== 'all') {
        console.log('�� Filtering by category:', selectedCategory);
        query = query.eq('category', selectedCategory);
      } else {
        console.log('🔍 No category filter applied - showing all categories');
      }`;

content = content.replace(oldCategoryFilter, newCategoryFilter);

// Fix 4: Add better error handling for category filtering
const oldQueryResult = `      const { data, error: fetchError } = await query;
      
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

const newQueryResult = `      const { data, error: fetchError } = await query;
      
      console.log(\`📊 Supabase response for page \${page}:\`, { 
        dataCount: data?.length || 0, 
        error: fetchError,
        selectedCategory,
        selectedLevel,
        selectedSort,
        queryApplied: selectedCategory !== 'all' ? \`category = '\${selectedCategory}'\` : 'no category filter'
      });
      
      if (data && data.length > 0) {
        console.log('🔍 Sample course categories:', data.map(c => ({ id: c.id, title: c.title, category: c.category })));
      } else if (selectedCategory !== 'all') {
        console.log('⚠️ No courses found for category:', selectedCategory);
      }`;

content = content.replace(oldQueryResult, newQueryResult);

// Fix 5: Improve the filteredCourses function to handle edge cases
const oldFilteredCourses = `  const filteredCourses = courses.filter(course => {
    // Only filter by search term since category and level filtering is done at database level
    const matchesSearch = course.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    return matchesSearch;
  });`;

const newFilteredCourses = `  const filteredCourses = courses.filter(course => {
    // Only filter by search term since category and level filtering is done at database level
    const matchesSearch = course.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    // Debug logging for search filtering
    if (debouncedSearchTerm && !matchesSearch) {
      console.log('🔍 Course filtered out by search:', course.title, 'search term:', debouncedSearchTerm);
    }
    
    return matchesSearch;
  });

  // Debug logging for filtered results
  console.log('🔍 Filtered courses count:', filteredCourses.length, 'out of', courses.length, 'total courses');`;

content = content.replace(oldFilteredCourses, newFilteredCourses);

// Write the updated content
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Applied comprehensive fixes to category filter in Courses.tsx');
