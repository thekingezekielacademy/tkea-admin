#!/usr/bin/env node

/**
 * Mini Browser Compatibility Test Script
 * 
 * This script tests the user agent detection and serving logic
 * to ensure Instagram and Facebook browsers get the correct content.
 */

const { requiresES5Fallback, getBrowserInfo } = require('./server/utils/userAgentDetection');

console.log('🧪 Testing Mini Browser Compatibility');
console.log('=====================================\n');

// Test user agents
const testUserAgents = [
  {
    name: 'Instagram Browser',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 155.0.0.37.107',
    expected: true
  },
  {
    name: 'Facebook Browser',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/324.0.0.42.69;]',
    expected: true
  },
  {
    name: 'WhatsApp Browser',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/2.21.15.15;]',
    expected: true
  },
  {
    name: 'Old Safari',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
    expected: true
  },
  {
    name: 'Old Chrome',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    expected: true
  },
  {
    name: 'Modern Chrome',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    expected: false
  },
  {
    name: 'Modern Safari',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    expected: false
  },
  {
    name: 'Modern Firefox',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:89.0) Gecko/20100101 Firefox/89.0',
    expected: false
  }
];

// Run tests
let passed = 0;
let failed = 0;

testUserAgents.forEach((test, index) => {
  const result = requiresES5Fallback(test.ua);
  const browserInfo = getBrowserInfo(test.ua);
  const success = result === test.expected;
  
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`  User Agent: ${test.ua.substring(0, 80)}...`);
  console.log(`  Expected ES5 Fallback: ${test.expected}`);
  console.log(`  Actual Result: ${result}`);
  console.log(`  Browser Info:`, {
    isInstagram: browserInfo.isInstagram,
    isFacebook: browserInfo.isFacebook,
    isMiniBrowser: browserInfo.isMiniBrowser,
    isOldBrowser: browserInfo.isOldBrowser
  });
  console.log(`  Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

// Summary
console.log('📊 Test Summary');
console.log('===============');
console.log(`Total Tests: ${testUserAgents.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`Success Rate: ${Math.round((passed / testUserAgents.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Mini browser compatibility is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please check the detection logic.');
  process.exit(1);
}

// Test file existence
const fs = require('fs');
const path = require('path');

console.log('\n📁 Checking Required Files');
console.log('==========================');

const requiredFiles = [
  'client/public/index-mini.html',
  'client/build-es5/index.html',
  'server/utils/userAgentDetection.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (allFilesExist) {
  console.log('\n✅ All required files exist!');
} else {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

console.log('\n🚀 Mini browser compatibility setup is complete!');
console.log('You can now test with Instagram and Facebook in-app browsers.');
