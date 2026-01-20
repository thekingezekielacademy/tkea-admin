// Check notification status and timing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function checkNotifications() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('🔔 NOTIFICATION STATUS CHECK');
  console.log('═'.repeat(60));
  console.log(`Current time: ${now.toLocaleString()}`);

  // Get today's sessions
  const todayStr = today.toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('batch_class_sessions')
    .select('id, class_name, session_number, scheduled_datetime, created_at')
    .eq('scheduled_date', todayStr)
    .order('scheduled_datetime');

  console.log(`\n📅 Today's Sessions: ${sessions?.length || 0}`);
  
  if (!sessions || sessions.length === 0) {
    console.log('⚠️  No sessions found for today!');
    return;
  }

  // Check notification timing for each session
  for (const session of sessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntil = sessionTime.getTime() - now.getTime();
    const hoursUntil = Math.round(timeUntil / (60 * 60 * 1000) * 10) / 10;

    console.log(`\n📚 ${session.class_name} - Class ${session.session_number}`);
    console.log(`   Scheduled: ${sessionTime.toLocaleString()}`);
    console.log(`   Time until: ${hoursUntil} hours`);

    const notificationTimings = {
      '5_days': 5 * 24 * 60 * 60 * 1000,
      '48_hours': 48 * 60 * 60 * 1000,
      '24_hours': 24 * 60 * 60 * 1000,
      '3_hours': 3 * 60 * 60 * 1000,
      '30_minutes': 30 * 60 * 1000
    };

    console.log(`   Notification Status:`);
    for (const [type, msBefore] of Object.entries(notificationTimings)) {
      const notifyTime = new Date(sessionTime.getTime() - msBefore);
      const timeUntilNotify = notifyTime.getTime() - now.getTime();
      
      // Check if notification exists
      const { data: notif } = await supabase
        .from('batch_class_notifications')
        .select('status, sent_at')
        .eq('session_id', session.id)
        .eq('notification_type', type)
        .single();

      const status = notif?.status || 'NOT CREATED';
      const sentAt = notif?.sent_at ? new Date(notif.sent_at).toLocaleString() : 'N/A';
      
      if (timeUntilNotify < 0) {
        console.log(`     ${type}: ⏰ Time passed (${Math.abs(Math.round(timeUntilNotify / (60 * 60 * 1000)))}h ago) - Status: ${status}`);
      } else {
        console.log(`     ${type}: ⏳ Due in ${Math.round(timeUntilNotify / (60 * 60 * 1000))}h - Status: ${status}`);
      }
      
      if (status === 'sent') {
        console.log(`       ✅ Sent at: ${sentAt}`);
      } else if (status === 'failed') {
        console.log(`       ❌ Failed`);
      } else if (status === 'NOT CREATED') {
        console.log(`       ⚠️  Notification record doesn't exist!`);
      }
    }
  }

  // Check if cron is running
  console.log(`\n🤖 Cron Job Status:`);
  console.log(`   Check Vercel Dashboard → Cron Jobs → batch-class-notifications`);
  console.log(`   Should run: Every minute`);
  
  console.log('\n' + '═'.repeat(60));
}

checkNotifications().catch(console.error);
