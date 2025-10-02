#!/usr/bin/env node

/**
 * Bulk Import Script for MailerLite
 * 
 * This script imports existing users from a CSV/JSON file into MailerLite.
 * It handles rate limiting and provides detailed progress reporting.
 * 
 * Usage:
 * node importUsers.js [input-file] [options]
 * 
 * Examples:
 * node importUsers.js users.csv
 * node importUsers.js users.json --batch-size 25 --delay 1000
 * node importUsers.js users.csv --dry-run
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  BATCH_SIZE: 50, // Number of users to process in each batch
  DELAY_BETWEEN_BATCHES: 2000, // Delay in milliseconds between batches
  DELAY_BETWEEN_REQUESTS: 100, // Delay in milliseconds between individual requests
  MAX_RETRIES: 3, // Maximum number of retries for failed requests
  TIMEOUT: 10000, // Request timeout in milliseconds
};

// MailerLite API configuration
const MAILERLITE_CONFIG = {
  API_KEY: process.env.MAILERLITE_API_KEY,
  GROUP_ID: process.env.MAILERLITE_GROUP_ID,
  BASE_URL: 'https://connect.mailerlite.com/api'
};

// Validate configuration
if (!MAILERLITE_CONFIG.API_KEY) {
  console.error('❌ Error: MAILERLITE_API_KEY environment variable is required');
  process.exit(1);
}

if (!MAILERLITE_CONFIG.GROUP_ID) {
  console.error('❌ Error: MAILERLITE_GROUP_ID environment variable is required');
  process.exit(1);
}

// Statistics tracking
const stats = {
  total: 0,
  processed: 0,
  successful: 0,
  skipped: 0,
  failed: 0,
  startTime: Date.now()
};

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const users = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      console.warn(`⚠️  Skipping row ${i + 1}: column count mismatch`);
      continue;
    }
    
    const user = {};
    headers.forEach((header, index) => {
      user[header] = values[index];
    });
    
    // Normalize common column names
    const normalizedUser = {
      email: user.email || user.e_mail || user.mail,
      name: user.name || user.full_name || user.first_name || user.username
    };
    
    if (normalizedUser.email && isValidEmail(normalizedUser.email)) {
      users.push(normalizedUser);
    } else {
      console.warn(`⚠️  Skipping row ${i + 1}: invalid email`);
    }
  }
  
  return users;
}

/**
 * Parse JSON file
 */
function parseJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array of user objects');
  }
  
  const users = data.filter(user => {
    if (!user.email || !isValidEmail(user.email)) {
      console.warn(`⚠️  Skipping user: invalid email ${user.email}`);
      return false;
    }
    return true;
  }).map(user => ({
    email: user.email,
    name: user.name || user.full_name || user.first_name || user.username
  }));
  
  return users;
}

/**
 * Check if subscriber already exists
 */
async function checkExistingSubscriber(email) {
  try {
    const response = await axios.get(
      `${MAILERLITE_CONFIG.BASE_URL}/subscribers/${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${MAILERLITE_CONFIG.API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: CONFIG.TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Subscriber doesn't exist
    }
    throw error;
  }
}

/**
 * Subscribe user to MailerLite
 */
async function subscribeUser(user, retryCount = 0) {
  try {
    // Check if user already exists
    const existing = await checkExistingSubscriber(user.email);
    if (existing) {
      stats.skipped++;
      return { success: true, skipped: true, message: 'Already subscribed' };
    }
    
    const payload = {
      email: user.email.toLowerCase().trim(),
      fields: user.name ? { name: user.name.trim() } : {},
      groups: [MAILERLITE_CONFIG.GROUP_ID]
    };
    
    const response = await axios.post(
      `${MAILERLITE_CONFIG.BASE_URL}/subscribers`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${MAILERLITE_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: CONFIG.TIMEOUT
      }
    );
    
    stats.successful++;
    return { success: true, data: response.data };
    
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`🔄 Retrying ${user.email} (attempt ${retryCount + 2})`);
      await sleep(1000 * (retryCount + 1)); // Exponential backoff
      return subscribeUser(user, retryCount + 1);
    }
    
    stats.failed++;
    const errorMessage = error.response?.data?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Process batch of users
 */
async function processBatch(users, batchNumber) {
  console.log(`\n📦 Processing batch ${batchNumber} (${users.length} users)...`);
  
  const results = [];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`  ${i + 1}/${users.length} - Processing ${user.email}...`);
    
    const result = await subscribeUser(user);
    results.push({ user, result });
    
    stats.processed++;
    
    // Add delay between requests to avoid rate limiting
    if (i < users.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
    }
    
    // Show progress
    if (stats.processed % 10 === 0) {
      console.log(`    Progress: ${stats.processed}/${stats.total} (${Math.round(stats.processed/stats.total*100)}%)`);
    }
  }
  
  return results;
}

/**
 * Print final statistics
 */
function printStats() {
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n📊 Import Statistics:');
  console.log('='.repeat(50));
  console.log(`Total users: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Skipped (already exists): ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Average: ${(stats.processed / duration).toFixed(2)} users/second`);
  
  if (stats.failed > 0) {
    console.log('\n❌ Some users failed to import. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All users imported successfully!');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📧 MailerLite Bulk Import Tool

Usage:
  node importUsers.js <input-file> [options]

Options:
  --batch-size <number>    Number of users per batch (default: ${CONFIG.BATCH_SIZE})
  --delay <number>         Delay between batches in ms (default: ${CONFIG.DELAY_BETWEEN_BATCHES})
  --dry-run               Show what would be imported without actually importing
  --help                  Show this help message

Examples:
  node importUsers.js users.csv
  node importUsers.js users.json --batch-size 25
  node importUsers.js users.csv --dry-run

Environment Variables Required:
  MAILERLITE_API_KEY      Your MailerLite API key
  MAILERLITE_GROUP_ID     Your MailerLite group ID
    `);
    process.exit(0);
  }
  
  const inputFile = args[0];
  const isDryRun = args.includes('--dry-run');
  
  // Parse command line options
  const batchSizeIndex = args.indexOf('--batch-size');
  if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
    CONFIG.BATCH_SIZE = parseInt(args[batchSizeIndex + 1]);
  }
  
  const delayIndex = args.indexOf('--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    CONFIG.DELAY_BETWEEN_BATCHES = parseInt(args[delayIndex + 1]);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file '${inputFile}' not found`);
    process.exit(1);
  }
  
  console.log('🚀 Starting MailerLite bulk import...');
  console.log(`📁 Input file: ${inputFile}`);
  console.log(`📊 Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`⏱️  Delay between batches: ${CONFIG.DELAY_BETWEEN_BATCHES}ms`);
  
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No actual imports will be performed');
  }
  
  try {
    // Parse input file
    const fileExtension = path.extname(inputFile).toLowerCase();
    let users;
    
    if (fileExtension === '.csv') {
      users = parseCSV(inputFile);
    } else if (fileExtension === '.json') {
      users = parseJSON(inputFile);
    } else {
      throw new Error('Unsupported file format. Please use .csv or .json files.');
    }
    
    stats.total = users.length;
    console.log(`📋 Found ${users.length} valid users to import`);
    
    if (users.length === 0) {
      console.log('ℹ️  No users to import. Exiting.');
      process.exit(0);
    }
    
    if (isDryRun) {
      console.log('\n🧪 DRY RUN - Users that would be imported:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email}${user.name ? ` (${user.name})` : ''}`);
      });
      console.log('\n✅ Dry run completed. No actual imports performed.');
      process.exit(0);
    }
    
    // Process users in batches
    const batches = [];
    for (let i = 0; i < users.length; i += CONFIG.BATCH_SIZE) {
      batches.push(users.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      await processBatch(batches[i], i + 1);
      
      // Add delay between batches
      if (i < batches.length - 1) {
        console.log(`⏸️  Waiting ${CONFIG.DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }
    
    printStats();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run the script
main();
