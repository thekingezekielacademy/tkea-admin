/**
 * Quick Email Export Script
 * 
 * Exports all user emails from Supabase to files
 * 
 * Usage: node scripts/export-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportEmails() {
  console.log('📧 Exporting user emails from Supabase...\n');

  try {
    // Fetch all users
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error);
      process.exit(1);
    }

    if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️  No users found');
      process.exit(0);
    }

    console.log(`✅ Found ${authUsers.users.length} users\n`);

    // Create exports directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // --- Export 1: Simple email list (one per line) ---
    const emailList = authUsers.users
      .map(user => user.email)
      .filter(email => email)
      .join('\n');

    const emailListPath = path.join(exportDir, 'user_emails.txt');
    fs.writeFileSync(emailListPath, emailList);
    console.log(`✅ Email list saved to: ${emailListPath}`);
    console.log(`   (${authUsers.users.length} emails)\n`);

    // --- Export 2: CSV with full details (for HubSpot import) ---
    const csvRows = ['Email,First Name,Last Name,Phone,Signup Date,User ID'];
    
    for (const user of authUsers.users) {
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const phone = metadata.phone || '';
      const signupDate = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';
      
      // Escape commas in names/emails
      const row = [
        `"${user.email || ''}"`,
        `"${firstName}"`,
        `"${lastName}"`,
        `"${phone}"`,
        signupDate,
        user.id
      ].join(',');
      
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');
    const csvPath = path.join(exportDir, 'users_for_hubspot.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV export saved to: ${csvPath}`);
    console.log(`   (Ready for HubSpot import)\n`);

    // --- Export 3: JSON format ---
    const jsonData = authUsers.users.map(user => {
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || '';
      const nameParts = fullName.split(' ');
      
      return {
        email: user.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: metadata.phone || '',
        signupDate: user.created_at,
        userId: user.id
      };
    });

    const jsonPath = path.join(exportDir, 'users.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON export saved to: ${jsonPath}\n`);

    // Summary
    console.log('📊 Export Summary:');
    console.log(`   Total users: ${authUsers.users.length}`);
    console.log(`   Files created in: ${exportDir}`);
    console.log('\n📁 Files:');
    console.log(`   1. user_emails.txt - Simple email list`);
    console.log(`   2. users_for_hubspot.csv - Full details CSV`);
    console.log(`   3. users.json - JSON format`);
    
    console.log('\n💡 Next Steps:');
    console.log('   Option A: Use CSV to import to HubSpot manually');
    console.log('   Option B: Run "npm run sync-hubspot" to sync via API');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportEmails();

