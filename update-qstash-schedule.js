/**
 * Update QStash schedule to use production URL
 * Run this after deploying to production
 */

const { Client } = require('@upstash/qstash');

async function updateQStashSchedule() {
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  
  // Use production URL - update this to your actual production domain
  const apiUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
  
  if (!qstashToken) {
    console.error('❌ QSTASH_TOKEN not set!');
    return;
  }

  const client = new Client({ 
    token: qstashToken,
    baseUrl: qstashUrl
  });

  try {
    console.log('🔄 Updating QStash schedule...\n');
    console.log(`   Production URL: ${apiUrl}\n`);
    
    // First, get existing schedules to find the one we created
    const schedules = await client.schedules.list();
    
    // Find the schedule for live-booth-reminders
    const existingSchedule = schedules.find(s => 
      s.destination?.includes('qstash-reminders') || 
      s.destination?.includes('live-booth-reminders')
    );
    
    if (!existingSchedule) {
      console.log('⚠️  No existing schedule found. Creating new one...\n');
      
      // Create new schedule
      const schedule = await client.schedules.create({
        destination: `${apiUrl}/api/cron/qstash-reminders`,
        cron: '*/5 * * * *',
        body: JSON.stringify({
          type: 'live-booth-reminders',
          timestamp: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ New QStash schedule created!');
      console.log(`   Schedule ID: ${schedule.scheduleId}`);
      console.log(`   Destination: ${apiUrl}/api/cron/qstash-reminders`);
      console.log(`   Schedule: Every 5 minutes\n`);
    } else {
      console.log(`✅ Found existing schedule: ${existingSchedule.scheduleId}`);
      console.log(`   Current destination: ${existingSchedule.destination}`);
      
      // Delete old schedule
      await client.schedules.delete(existingSchedule.scheduleId);
      console.log(`   ✅ Deleted old schedule\n`);
      
      // Create new schedule with production URL
      const schedule = await client.schedules.create({
        destination: `${apiUrl}/api/cron/qstash-reminders`,
        cron: '*/5 * * * *',
        body: JSON.stringify({
          type: 'live-booth-reminders',
          timestamp: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ QStash schedule updated!');
      console.log(`   New Schedule ID: ${schedule.scheduleId}`);
      console.log(`   New Destination: ${apiUrl}/api/cron/qstash-reminders`);
      console.log(`   Schedule: Every 5 minutes\n`);
    }
    
    console.log('🎉 Schedule is now pointing to production!');
    console.log('   Real-time notifications will work automatically.\n');
    
  } catch (error) {
    console.error('❌ Error updating schedule:', error.message);
    console.log('\n💡 You can also update manually:');
    console.log('   1. Go to: https://console.upstash.com/qstash');
    console.log('   2. Click "Schedules"');
    console.log('   3. Find your schedule');
    console.log('   4. Edit destination URL to:', `${apiUrl}/api/cron/qstash-reminders`);
  }
}

updateQStashSchedule();
