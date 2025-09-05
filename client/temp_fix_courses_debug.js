const fs = require('fs');

// Read the Courses file
let content = fs.readFileSync('src/pages/Courses.tsx', 'utf8');

// Fix the debug block that's causing syntax error
const oldDebugBlock = `  // Debug sidebar state
  useEffect(() => {
    // console.log('Sidebar Debug:', {
      user: !!user,
      isMobile,
      isExpanded,
      margin: getSidebarMargin(),
    });
  }, [user, isMobile, isExpanded]);`;

const newDebugBlock = `  // Debug sidebar state
  useEffect(() => {
    // console.log('Sidebar Debug:', {
    //   user: !!user,
    //   isMobile,
    //   isExpanded,
    //   margin: getSidebarMargin(),
    // });
  }, [user, isMobile, isExpanded]);`;

// Replace the debug block
content = content.replace(oldDebugBlock, newDebugBlock);

// Write the fixed content back
fs.writeFileSync('src/pages/Courses.tsx', content);

console.log('✅ Fixed Courses debug block syntax error');
