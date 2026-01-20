/**
 * Check notification system status and when first notification would be sent
 */

const { createClient } = require('@supabase/supabase-js');

async function checkNotificationStatus() {
  console.log('🔍 Checking Notification System Status...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log('─'.repeat(60));
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
  const telegramGroupIds = process.env.TELEGRAM_GROUP_ID;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`   TELEGRAM_BOT_TOKEN: ${telegramToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TELEGRAM_GROUP_ID: ${telegramGroupIds ? `✅ Set (${telegramGroupIds.split(',').length} groups)` : '❌ Missing'}`);
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase configuration. Cannot check sessions.\n');
    return;
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get upcoming sessions
  const now = new Date();
  const futureTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Next 48 hours
  
  console.log('📅 Checking for Upcoming Sessions...');
  console.log(`   Current Time: ${now.toISOString()}`);
  console.log(`   Looking until: ${futureTime.toISOString()}\n`);
  
  const { data: upcomingSessions, error } = await supabaseAdmin
    .from('class_sessions')
    .select(`
      id,
      scheduled_datetime,
      status,
      live_class_id,
      session_type,
      live_classes!inner(courses!inner(title))
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_datetime', now.toISOString())
    .lte('scheduled_datetime', futureTime.toISOString())
    .order('scheduled_datetime', { ascending: true })
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching sessions:', error.message);
    return;
  }
  
  if (!upcomingSessions || upcomingSessions.length === 0) {
    console.log('⚠️  No upcoming sessions found in the next 48 hours.');
    console.log('   The cron job will run, but there are no sessions to notify about.\n');
    console.log('💡 To test:');
    console.log('   1. Create a live class session scheduled for the future');
    console.log('   2. Wait for the cron job to run (midnight UTC)');
    console.log('   3. Or manually trigger: POST /api/cron/live-booth-reminders\n');
    return;
  }
  
  console.log(`✅ Found ${upcomingSessions.length} upcoming session(s):\n`);
  
  // Calculate when cron runs (midnight UTC)
  const nextCronRun = new Date();
  nextCronRun.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  if (nextCronRun <= now) {
    nextCronRun.setUTCDate(nextCronRun.getUTCDate() + 1);
  }
  
  console.log('═'.repeat(60));
  console.log('⏰ CRON JOB SCHEDULE:');
  console.log('═'.repeat(60));
  console.log(`   Schedule: Once per day at midnight UTC (0 0 * * *)`);
  console.log(`   Next Run: ${nextCronRun.toISOString()}`);
  console.log(`   Next Run (Local): ${nextCronRun.toLocaleString()}`);
  console.log(`   Time Until Next Run: ${Math.round((nextCronRun - now) / (1000 * 60 * 60))} hours\n`);
  
  console.log('═'.repeat(60));
  console.log('📅 UPCOMING SESSIONS:');
  console.log('═'.repeat(60));
  
  for (const session of upcomingSessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const courseTitle = session.live_classes?.courses?.title || 'Unknown Course';
    
    console.log(`\n📚 ${courseTitle}`);
    console.log(`   Session Time: ${sessionTime.toLocaleString()}`);
    console.log(`   Time Until: ${hoursUntil.toFixed(1)} hours (${(hoursUntil * 60).toFixed(0)} minutes)`);
    console.log(`   Session Type: ${session.session_type}`);
    
    // Check which reminders would be sent
    const reminderTimings = {
      '24h_before': 24,
      '2h_before': 2,
      '1h_before': 1,
      '30m_before': 0.5,
      '2m_before': 2/60,
      'start': 0
    };
    
    const remindersDue = [];
    for (const [timing, hoursBefore] of Object.entries(reminderTimings)) {
      const targetTime = hoursUntil - hoursBefore;
      if (targetTime >= -0.1 && targetTime <= 24.1) { // Within next 24 hours
        remindersDue.push(`${timing} (in ${targetTime.toFixed(1)}h)`);
      }
    }
    
    if (remindersDue.length > 0) {
      console.log(`   📨 Reminders that will be sent at next cron run:`);
      remindersDue.forEach(r => console.log(`      - ${r}`));
    } else {
      console.log(`   ⏳ No reminders due yet`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  IMPORTANT LIMITATION:');
  console.log('═'.repeat(60));
  console.log('   Vercel Hobby plan only allows cron jobs that run ONCE PER DAY.');
  console.log('   This means:');
  console.log('   - Notifications are sent once per day (at midnight UTC)');
  console.log('   - "Class starting now" might be sent up to 24 hours early');
  console.log('   - Countdown reminders might be sent early');
  console.log('');
  console.log('💡 For REAL-TIME notifications, use an external cron service:');
  console.log('   - cron-job.org (free, runs every 5 minutes)');
  console.log('   - EasyCron (free tier available)');
  console.log('   - See VERCEL_HOBBY_LIMITATION.md for setup instructions\n');
}

checkNotificationStatus();
