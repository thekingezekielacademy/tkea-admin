#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all AuthContext imports to use optimized version...');

// Find all TypeScript/JavaScript files in src directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace old AuthContext imports with optimized version
    const oldImport = "from '@/contexts/AuthContext'";
    const newImport = "from '@/contexts/AuthContextOptimized'";
    
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport);
      updated = true;
    }
    
    // Also handle relative imports
    const oldRelativeImport = "from './AuthContext'";
    const newRelativeImport = "from './AuthContextOptimized'";
    
    if (content.includes(oldRelativeImport)) {
      content = content.replace(new RegExp(oldRelativeImport, 'g'), newRelativeImport);
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to check...`);

let updatedCount = 0;
files.forEach(file => {
  if (updateImports(file)) {
    updatedCount++;
  }
});

console.log(`\n🎉 Successfully updated ${updatedCount} files!`);
console.log('✨ All AuthContext imports now point to the optimized version!');
