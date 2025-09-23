#!/usr/bin/env node

/**
 * Test ES5 Build Script
 * 
 * This script tests the ES5 build to ensure it's compatible with mini browsers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing ES5 Build Compatibility...\n');

try {
  // 1. Check if ES5 build files exist
  console.log('1. Checking ES5 build configuration files...');
  
  const requiredFiles = [
    'client/webpack.config.es5.js',
    'client/.babelrc.es5',
    'client/tsconfig.es5.json',
    'client/public/index.es5.html',
    'server/utils/userAgentDetection.js',
    'api/index.js'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please create them first.');
    process.exit(1);
  }
  
  console.log('\n2. Building ES5 version...');
  
  // 2. Build ES5 version
  try {
    execSync('cd client && npm run build:es5', { stdio: 'inherit' });
    console.log('   ✅ ES5 build completed successfully');
  } catch (error) {
    console.log('   ❌ ES5 build failed:', error.message);
    process.exit(1);
  }
  
  // 3. Check if ES5 build output exists
  console.log('\n3. Checking ES5 build output...');
  
  const buildOutputPath = 'client/build-es5';
  if (fs.existsSync(buildOutputPath)) {
    console.log('   ✅ ES5 build directory created');
    
    // Check for main files
    const mainFiles = ['index.html', 'static/js', 'static/css'];
    mainFiles.forEach(file => {
      const filePath = path.join(buildOutputPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    });
  } else {
    console.log('   ❌ ES5 build directory not found');
    process.exit(1);
  }
  
  // 4. Test user agent detection
  console.log('\n4. Testing user agent detection...');
  
  const { requiresES5Fallback, getBrowserInfo } = require('./server/utils/userAgentDetection');
  
  const testUserAgents = [
    'Instagram/1.0 (iPhone; iOS 15.0; Scale/2.00)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'FBAN/FBIOS;FBAV/1.0.0.0.0;FBBV/1.0.0.0.0;FBDM/{density=2.0,width=720,height=1280};FBLC/en_US;FBRV/1.0.0.0.0;FBCR/Verizon;FBMF/samsung;FBBD/samsung;FBPN/com.facebook.katana;FBDV/SM-G930V;FBSV/7.0;FBOP/1;FBCA/x86_64;FBDM/{density=2.0,width=720,height=1280};FBLC/en_US;FBRV/1.0.0.0.0;FBCR/Verizon;FBMF/samsung;FBBD/samsung;FBPN/com.facebook.katana;FBDV/SM-G930V;FBSV/7.0;FBOP/1;FBCA/x86_64'
  ];
  
  testUserAgents.forEach((ua, index) => {
    const needsES5 = requiresES5Fallback(ua);
    const info = getBrowserInfo(ua);
    console.log(`   Test ${index + 1}: ${needsES5 ? 'ES5' : 'Modern'} - ${info.isMiniBrowser ? 'Mini Browser' : 'Regular Browser'}`);
  });
  
  console.log('\n✅ ES5 Build Test Completed Successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy to Vercel: npx vercel --prod');
  console.log('2. Test on Instagram/Facebook mini browsers');
  console.log('3. Check server logs for detection messages');
  console.log('4. Verify both builds are served correctly');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
