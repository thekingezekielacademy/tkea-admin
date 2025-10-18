/**
 * Sync Existing Users to HubSpot
 * 
 * This script fetches all users from Supabase and creates/updates them as contacts in HubSpot
 * 
 * Usage:
 * npm install @hubspot/api-client
 * npx ts-node scripts/sync-users-to-hubspot.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// HubSpot configuration
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com';

if (!HUBSPOT_ACCESS_TOKEN) {
  console.error('❌ Missing HubSpot access token. Set HUBSPOT_PRIVATE_APP_TOKEN');
  console.log('ℹ️  Get your token from: https://app.hubspot.com/settings/integrations/private-apps');
  process.exit(1);
}

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
  raw_user_meta_data?: {
    full_name?: string;
    phone?: string;
  };
}

interface HubSpotContact {
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    user_id?: string;
    signup_date?: string;
    hs_lead_status?: string;
  };
}

// Create contact in HubSpot
async function createHubSpotContact(contact: HubSpotContact): Promise<boolean> {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`
      },
      body: JSON.stringify(contact)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Created: ${contact.properties.email}`);
      return true;
    } else if (response.status === 409) {
      // Contact already exists, update it
      console.log(`  ⚠️  Already exists: ${contact.properties.email} - attempting update...`);
      return await updateHubSpotContactByEmail(contact);
    } else {
      const error = await response.text();
      console.error(`  ❌ Failed to create ${contact.properties.email}: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error creating contact ${contact.properties.email}:`, error);
    return false;
  }
}

// Update contact in HubSpot by email
async function updateHubSpotContactByEmail(contact: HubSpotContact): Promise<boolean> {
  try {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contact.properties.email}?idProperty=email`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({ properties: contact.properties })
      }
    );

    if (response.ok) {
      console.log(`  ✅ Updated: ${contact.properties.email}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`  ❌ Failed to update ${contact.properties.email}: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error updating contact ${contact.properties.email}:`, error);
    return false;
  }
}

// Create contacts in batch (more efficient)
async function createContactsBatch(contacts: HubSpotContact[]): Promise<number> {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/batch/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ inputs: contacts })
    });

    if (response.ok) {
      const data = await response.json();
      return data.results?.length || 0;
    } else {
      const error = await response.text();
      console.error(`❌ Batch creation failed: ${error}`);
      return 0;
    }
  } catch (error) {
    console.error('❌ Error in batch creation:', error);
    return 0;
  }
}

// Convert Supabase user to HubSpot contact format
function userToHubSpotContact(user: User): HubSpotContact {
  const metadata = user.user_metadata || user.raw_user_meta_data || {};
  const fullName = metadata.full_name || '';
  const nameParts = fullName.split(' ');
  const firstname = nameParts[0] || '';
  const lastname = nameParts.slice(1).join(' ') || '';

  return {
    properties: {
      email: user.email,
      firstname: firstname,
      lastname: lastname,
      phone: metadata.phone || '',
      user_id: user.id,
      signup_date: user.created_at,
      hs_lead_status: 'NEW' // HubSpot lead status
    }
  };
}

// Main sync function
async function syncUsersToHubSpot() {
  console.log('🚀 Starting user sync to HubSpot...\n');

  try {
    // Fetch all users from Supabase
    console.log('📥 Fetching users from Supabase...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching users from Supabase:', authError);
      return;
    }

    if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️  No users found in Supabase');
      return;
    }

    console.log(`✅ Found ${authUsers.users.length} users in Supabase\n`);

    // Convert users to HubSpot format
    const hubspotContacts = authUsers.users.map(user => userToHubSpotContact(user));

    // Process in batches of 10 (HubSpot API limit is 100, but we'll be conservative)
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    console.log('📤 Syncing users to HubSpot...\n');

    for (let i = 0; i < hubspotContacts.length; i += batchSize) {
      const batch = hubspotContacts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, hubspotContacts.length)} of ${hubspotContacts.length})...`);

      // Try batch creation first
      const batchSuccessCount = await createContactsBatch(batch);
      
      if (batchSuccessCount === batch.length) {
        successCount += batchSuccessCount;
        console.log(`  ✅ Batch created successfully (${batchSuccessCount} contacts)\n`);
      } else {
        // If batch fails, try individually
        console.log('  ⚠️  Batch creation partial/failed, processing individually...');
        for (const contact of batch) {
          const success = await createHubSpotContact(contact);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        }
        console.log('');
      }

      // Rate limiting - wait between batches
      if (i + batchSize < hubspotContacts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n✅ Sync Complete!');
    console.log(`   Total users: ${hubspotContacts.length}`);
    console.log(`   ✅ Successfully synced: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Check your HubSpot contacts: https://app.hubspot.com/contacts/');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncUsersToHubSpot();

