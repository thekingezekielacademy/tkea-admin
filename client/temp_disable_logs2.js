const fs = require('fs');

// Clean up Breadcrumbs.tsx
const file = 'src/components/SEO/Breadcrumbs.tsx';

try {
  let content = fs.readFileSync(file, 'utf8');
  
  // Comment out console.log statements
  content = content.replace(/console\.log\(/g, '// console.log(');
  content = content.replace(/console\.info\(/g, '// console.info(');
  content = content.replace(/console\.warn\(/g, '// console.warn(');
  
  fs.writeFileSync(file, content);
  console.log(`✅ Cleaned up console logs in ${file}`);
} catch (error) {
  console.log(`❌ Error cleaning ${file}:`, error.message);
}

console.log('✅ Breadcrumbs console cleanup completed');
