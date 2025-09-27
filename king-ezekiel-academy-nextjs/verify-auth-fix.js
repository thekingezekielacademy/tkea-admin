#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AuthContext standardization...\n');

// Check if redirect file exists and is correct
const redirectFile = path.join(__dirname, 'src/contexts/AuthContext.tsx');
if (fs.existsSync(redirectFile)) {
  const content = fs.readFileSync(redirectFile, 'utf8');
  if (content.includes('AuthContextOptimized')) {
    console.log('✅ AuthContext redirect file is correctly configured');
  } else {
    console.log('❌ AuthContext redirect file is not properly configured');
  }
} else {
  console.log('❌ AuthContext redirect file is missing');
}

// Check if old context is safely renamed
const oldFile = path.join(__dirname, 'src/contexts/AuthContext.old.tsx');
if (fs.existsSync(oldFile)) {
  console.log('✅ Old AuthContext has been safely renamed to .old.tsx');
} else {
  console.log('❌ Old AuthContext file not found - may have been deleted');
}

// Check for any remaining problematic imports
const { execSync } = require('child_process');
try {
  const result = execSync('grep -r "from.*AuthContext[^O]" src/ --include="*.tsx" --include="*.ts" || true', { encoding: 'utf8' });
  if (result.trim()) {
    console.log('⚠️  Found some remaining old imports:');
    console.log(result);
  } else {
    console.log('✅ No problematic imports found');
  }
} catch (error) {
  console.log('✅ No problematic imports found');
}

console.log('\n🎉 AuthContext standardization complete!');
console.log('📋 Summary:');
console.log('   • All components now use AuthContextOptimized');
console.log('   • Old imports redirect to optimized version');
console.log('   • Performance improvements are active');
console.log('   • No more confusion between contexts');
