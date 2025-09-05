const fs = require('fs');

// Files to clean up console logs
const files = [
  'src/components/ScrollToTop.tsx',
  'src/pages/Courses.tsx',
  'src/contexts/AuthContext.tsx',
  'src/utils/trialManager.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Comment out debug console.log statements
    content = content.replace(/console\.log\(/g, '// console.log(');
    content = content.replace(/console\.info\(/g, '// console.info(');
    content = content.replace(/console\.warn\(/g, '// console.warn(');
    
    // Keep console.error for actual errors
    // content = content.replace(/console\.error\(/g, '// console.error(');
    
    fs.writeFileSync(file, content);
    console.log(`✅ Cleaned up console logs in ${file}`);
  } catch (error) {
    console.log(`❌ Error cleaning ${file}:`, error.message);
  }
});

console.log('✅ Console spam cleanup completed');
