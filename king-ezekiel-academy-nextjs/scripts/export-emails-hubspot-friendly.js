/**
 * HubSpot-Friendly Email Export
 * 
 * Exports users with HubSpot-compatible field names
 * 
 * Usage: node scripts/export-emails-hubspot-friendly.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportForHubSpot() {
  console.log('📧 Creating HubSpot-friendly export...\n');

  try {
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

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // HubSpot-friendly CSV with standard + custom properties
    // Using standard HubSpot property names
    const csvRows = ['Email,First Name,Last Name,Phone Number,Company,Website,Original Signup Date,App User ID'];
    
    for (const user of authUsers.users) {
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const phone = metadata.phone || '';
      const signupDate = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';
      
      const row = [
        `"${user.email || ''}"`,
        `"${firstName}"`,
        `"${lastName}"`,
        `"${phone}"`,
        `"King Ezekiel Academy Student"`, // Company field
        `"app.thekingezekielacademy.com"`, // Website
        signupDate, // Custom property: Original Signup Date
        user.id // Custom property: App User ID
      ].join(',');
      
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');
    const csvPath = path.join(exportDir, 'hubspot_import_ready.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ HubSpot-ready CSV saved to: ${csvPath}`);
    console.log(`   Total users: ${authUsers.users.length}\n`);
    
    console.log('📋 Import Instructions:');
    console.log('   1. Go to HubSpot → Contacts → Import');
    console.log('   2. Upload: hubspot_import_ready.csv');
    console.log('   3. Map these fields:');
    console.log('      ✅ Email → Email');
    console.log('      ✅ First Name → First name');
    console.log('      ✅ Last Name → Last name');
    console.log('      ✅ Phone Number → Phone number');
    console.log('      ✅ Company → Company name');
    console.log('      ✅ Website → Website URL');
    console.log('      📝 Original Signup Date → Create custom property "Original Signup Date" (Date)');
    console.log('      📝 App User ID → Create custom property "App User ID" (Text)');
    console.log('\n   4. HubSpot will auto-create custom properties if they don\'t exist!');
    console.log('   5. Click Import\n');
    
    console.log('💡 Tip: HubSpot will set "Create date" automatically to import date.');
    console.log('   Your actual signup dates are saved in "Original Signup Date".\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportForHubSpot();

