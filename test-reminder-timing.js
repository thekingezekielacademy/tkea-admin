/**
 * Test script to check if reminder timing logic is working correctly
 * This helps debug why notifications might not be sending
 */

const { createClient } = require('@supabase/supabase-js');

async function testReminderTiming() {
  console.log('🔍 Testing Reminder Timing Logic...\n');
  
  // Initialize Supabase
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration!');
    return;
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const now = new Date();
  const futureTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  
  console.log(`📅 Current Time: ${now.toISOString()}`);
  console.log(`📅 Looking for sessions until: ${futureTime.toISOString()}\n`);
  
  // Get upcoming sessions
  const { data: upcomingSessions, error: sessionsError } = await supabaseAdmin
    .from('class_sessions')
    .select(`
      id,
      scheduled_datetime,
      status,
      live_class_id,
      course_video_id,
      session_type,
      live_classes!inner(course_id, courses!inner(title)),
      course_videos!inner(name)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_datetime', now.toISOString())
    .lte('scheduled_datetime', futureTime.toISOString())
    .order('scheduled_datetime', { ascending: true })
    .limit(10);
  
  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }
  
  if (!upcomingSessions || upcomingSessions.length === 0) {
    console.log('⚠️  No upcoming sessions found!');
    console.log('   Make sure you have scheduled sessions in the database.\n');
    return;
  }
  
  console.log(`✅ Found ${upcomingSessions.length} upcoming session(s):\n`);
  
  const reminderTimings = {
    '24h_before': 24 * 60 * 60 * 1000,
    '2h_before': 2 * 60 * 60 * 1000,
    '1h_before': 60 * 60 * 1000,
    '30m_before': 30 * 60 * 1000,
    '2m_before': 2 * 60 * 1000,
    'start': 0
  };
  
  for (const session of upcomingSessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntilSession = sessionTime.getTime() - now.getTime();
    const hoursUntil = (timeUntilSession / (60 * 60 * 1000)).toFixed(2);
    
    console.log(`📚 ${session.live_classes?.courses?.title || 'Unknown Course'}`);
    console.log(`   Lesson: ${session.course_videos?.name || 'Unknown'}`);
    console.log(`   Scheduled: ${sessionTime.toLocaleString()}`);
    console.log(`   Time until: ${hoursUntil} hours (${(timeUntilSession / 1000 / 60).toFixed(0)} minutes)\n`);
    
    // Check which reminders should be sent
    const shouldSend = [];
    for (const [timing, msBefore] of Object.entries(reminderTimings)) {
      const windowStart = msBefore - 5 * 60 * 1000;
      const windowEnd = msBefore + 5 * 60 * 1000;
      
      if (timeUntilSession >= windowStart && timeUntilSession <= windowEnd) {
        shouldSend.push(timing);
      }
    }
    
    if (shouldSend.length > 0) {
      console.log(`   ✅ Should send reminders: ${shouldSend.join(', ')}`);
    } else {
      console.log(`   ⏳ No reminders due yet (outside timing windows)`);
    }
    
    // Check if reminders already sent
    const { data: sentReminders } = await supabaseAdmin
      .from('class_reminders')
      .select('reminder_type, status, created_at')
      .eq('class_session_id', session.id);
    
    if (sentReminders && sentReminders.length > 0) {
      console.log(`   📨 Already sent: ${sentReminders.map(r => `${r.reminder_type} (${r.status})`).join(', ')}`);
    } else {
      console.log(`   📭 No reminders sent yet`);
    }
    
    console.log('');
  }
  
  // Check environment variables
  console.log('═'.repeat(60));
  console.log('🔧 Environment Variables Check:');
  console.log('═'.repeat(60));
  console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TELEGRAM_GROUP_ID: ${process.env.TELEGRAM_GROUP_ID ? `✅ Set (${process.env.TELEGRAM_GROUP_ID.split(',').length} groups)` : '❌ Missing'}`);
  console.log(`   TELEGRAM_CHANNEL_ID: ${process.env.TELEGRAM_CHANNEL_ID ? '✅ Set' : '⚠️  Using default'}`);
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  console.log('');
}

testReminderTiming();
