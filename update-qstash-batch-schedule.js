/**
 * Script to update QStash schedule for batch class notifications
 * Deletes old schedules and creates a new one with correct URL
 */

const { Client } = require('@upstash/qstash');
require('dotenv').config();

async function updateQStashSchedule() {
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const apiUrl = process.env.REACT_APP_URL || process.env.APP_URL || 'https://tkeaadmin.vercel.app';
  
  if (!qstashToken) {
    console.error('❌ QSTASH_TOKEN not set!');
    return;
  }

  const client = new Client({ 
    token: qstashToken,
    baseUrl: qstashUrl
  });

  try {
    console.log('🔄 Updating QStash schedule for batch class notifications...\n');
    
    // List existing schedules
    const schedules = await client.schedules.list();
    console.log(`Found ${schedules.length} existing schedules`);
    
    // Find and delete schedules for batch notifications
    const batchSchedules = schedules.filter(s => 
      s.destination && s.destination.includes('batch-notifications')
    );
    
    for (const schedule of batchSchedules) {
      console.log(`🗑️  Deleting old schedule: ${schedule.scheduleId}`);
      await client.schedules.delete(schedule.scheduleId);
    }
    
    // Create new schedule with correct URL
    console.log(`\n✅ Creating new schedule with URL: ${apiUrl}`);
    const schedule = await client.schedules.create({
      destination: `${apiUrl}/api/cron/qstash-batch-notifications`,
      cron: '*/5 * * * *', // Every 5 minutes
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ QStash schedule updated successfully!');
    console.log(`   Schedule ID: ${schedule.scheduleId}`);
    console.log(`   Destination: ${apiUrl}/api/cron/qstash-batch-notifications`);
    console.log(`   Schedule: Every 5 minutes (*/5 * * * *)`);
    
  } catch (error) {
    console.error('❌ Error updating QStash schedule:', error);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

updateQStashSchedule();
