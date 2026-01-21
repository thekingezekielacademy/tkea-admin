/**
 * Test script to manually trigger batch class notifications
 * This helps debug why notifications aren't sending
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testNotifications() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;

  console.log('🔍 Testing Batch Class Notifications...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log(`  Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Supabase Service Key: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Telegram Token: ${telegramToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Telegram Groups: ${telegramGroupIdsRaw ? '✅ Set' : '❌ Missing'}`);
  
  if (!telegramGroupIdsRaw) {
    console.log('\n❌ Telegram group IDs not configured!');
    return;
  }
  
  const groupIds = telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id);
  console.log(`  Group IDs: ${groupIds.join(', ')}\n`);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase configuration');
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check for upcoming sessions
  const now = new Date();
  const futureTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  console.log('📅 Checking for sessions...');
  console.log(`  Now: ${now.toISOString()}`);
  console.log(`  Checking sessions until: ${futureTime.toISOString()}\n`);

  const { data: upcomingSessions, error: sessionsError } = await supabaseAdmin
    .from('batch_class_sessions')
    .select(`
      id,
      batch_id,
      class_name,
      session_number,
      session_title,
      scheduled_datetime,
      session_type,
      created_at,
      batches!inner(batch_number, start_date)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_datetime', todayStart.toISOString())
    .lte('scheduled_datetime', futureTime.toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }

  console.log(`✅ Found ${upcomingSessions?.length || 0} upcoming sessions\n`);

  if (!upcomingSessions || upcomingSessions.length === 0) {
    console.log('⚠️ No upcoming sessions found. Sessions need to be created first.');
    return;
  }

  // Show first few sessions
  console.log('📋 Upcoming Sessions:');
  upcomingSessions.slice(0, 5).forEach(session => {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntil = sessionTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`  - ${session.class_name} Class ${session.session_number}`);
    console.log(`    Time: ${sessionTime.toLocaleString()}`);
    console.log(`    In: ${hoursUntil}h ${minutesUntil}m`);
    console.log(`    Type: ${session.session_type}`);
    console.log('');
  });

  // Check notification timings
  const notificationTimings = {
    '5_days': 5 * 24 * 60 * 60 * 1000,
    '48_hours': 48 * 60 * 60 * 1000,
    '24_hours': 24 * 60 * 60 * 1000,
    '3_hours': 3 * 60 * 60 * 1000,
    '30_minutes': 30 * 60 * 1000
  };

  console.log('🔔 Checking which notifications should be sent:\n');
  
  let notificationsToSend = 0;
  
  for (const session of upcomingSessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntil = sessionTime.getTime() - now.getTime();
    
    for (const [notificationType, msBefore] of Object.entries(notificationTimings)) {
      const notificationTime = sessionTime.getTime() - msBefore;
      const timeWindowStart = notificationTime - (5 * 60 * 1000); // 5 minute window
      const timeWindowEnd = notificationTime + (5 * 60 * 1000);
      
      if (now.getTime() >= timeWindowStart && now.getTime() <= timeWindowEnd && timeUntil > 0) {
        console.log(`  ✅ ${notificationType} notification for: ${session.class_name} Class ${session.session_number}`);
        console.log(`     Session time: ${sessionTime.toLocaleString()}`);
        console.log(`     Notification window: ${new Date(timeWindowStart).toLocaleString()} - ${new Date(timeWindowEnd).toLocaleString()}`);
        notificationsToSend++;
      }
    }
  }

  if (notificationsToSend === 0) {
    console.log('  ⚠️ No notifications are due right now.');
    console.log('  Notifications will be sent when the time windows are reached.\n');
  }

  // Test sending a notification
  console.log('\n🧪 Testing Telegram send...');
  const testMessage = `🧪 Test notification from batch class system\n\nTime: ${new Date().toLocaleString()}\n\nIf you see this, Telegram is working!`;
  
  for (const groupId of groupIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupId,
          text: testMessage,
          parse_mode: 'Markdown'
        })
      });
      
      const data = await response.json();
      if (response.ok && data.ok) {
        console.log(`  ✅ Test message sent to group ${groupId}`);
      } else {
        console.log(`  ❌ Failed to send to group ${groupId}:`, data.description || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Error sending to group ${groupId}:`, error.message);
    }
  }
}

testNotifications().catch(console.error);
