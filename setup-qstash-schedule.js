/**
 * Script to set up QStash recurring schedule for live class reminders
 * Run this once to create the schedule, or integrate into your deployment
 */

const { Client } = require('@upstash/qstash');

async function setupQStashSchedule() {
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const apiUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
  
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
    console.log('🚀 Setting up QStash schedule for live class reminders...\n');
    
    // Create a recurring schedule that runs every 5 minutes
    const schedule = await client.schedules.create({
      destination: `${apiUrl}/api/cron/qstash-reminders`,
      cron: '*/5 * * * *', // Every 5 minutes
      body: JSON.stringify({
        type: 'live-booth-reminders',
        timestamp: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ QStash schedule created successfully!');
    console.log(`   Schedule ID: ${schedule.scheduleId}`);
    console.log(`   Destination: ${apiUrl}/api/cron/qstash-reminders`);
    console.log(`   Schedule: Every 5 minutes (*/5 * * * *)\n`);
    console.log('📋 Next Steps:');
    console.log('   1. Save the Schedule ID for future reference');
    console.log('   2. The schedule will start running immediately');
    console.log('   3. Check QStash dashboard to monitor executions');
    console.log('   4. Your reminders will now be sent in real-time! 🎉\n');

  } catch (error) {
    console.error('❌ Error creating QStash schedule:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify QSTASH_TOKEN is correct');
    console.log('   2. Check that your API endpoint is accessible');
    console.log('   3. Ensure QStash can reach your endpoint (public URL)');
  }
}

setupQStashSchedule();
