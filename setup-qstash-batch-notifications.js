/**
 * Script to set up QStash recurring schedule for batch class notifications
 * Run this once to create the schedule
 */

const { Client } = require('@upstash/qstash');

async function setupQStashSchedule() {
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const apiUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://tkeaadmin.vercel.app';
  
  if (!qstashToken) {
    console.error('❌ QSTASH_TOKEN not set!');
    console.log('   Get your token from: https://console.upstash.com/qstash');
    return;
  }

  const client = new Client({ 
    token: qstashToken,
    baseUrl: qstashUrl
  });

  try {
    console.log('🚀 Setting up QStash schedule for batch class notifications...\n');
    
    // Create a recurring schedule that runs every 5 minutes
    const schedule = await client.schedules.create({
      destination: `${apiUrl}/api/cron/qstash-batch-notifications`,
      cron: '*/5 * * * *', // Every 5 minutes
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ QStash schedule created successfully!');
    console.log(`   Schedule ID: ${schedule.scheduleId}`);
    console.log(`   Destination: ${apiUrl}/api/cron/qstash-batch-notifications`);
    console.log(`   Schedule: Every 5 minutes (*/5 * * * *)`);
    console.log('\n📝 Note: Save the schedule ID for future reference');
    console.log(`   Schedule ID: ${schedule.scheduleId}`);
    
  } catch (error) {
    console.error('❌ Error creating QStash schedule:', error);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

setupQStashSchedule();
