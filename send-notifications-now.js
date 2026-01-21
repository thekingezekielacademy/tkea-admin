/**
 * EMERGENCY: Send notifications for ALL sessions happening today/soon
 * Run this to immediately send notifications for sessions that should have been notified
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

async function sendNotificationsNow() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;

  console.log('🚨 EMERGENCY: Sending notifications for all current/upcoming sessions...\n');

  if (!supabaseUrl || !supabaseServiceKey || !telegramToken || !telegramGroupIdsRaw) {
    console.error('❌ Missing environment variables!');
    console.log('Make sure .env.production has all required variables');
    console.log('Or set them manually:');
    console.log('  export REACT_APP_SUPABASE_URL=...');
    console.log('  export SUPABASE_SERVICE_ROLE_KEY=...');
    console.log('  export TELEGRAM_BOT_TOKEN=...');
    console.log('  export TELEGRAM_GROUP_ID=...');
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const groupIds = telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id);

  console.log(`📱 Sending to ${groupIds.length} Telegram groups: ${groupIds.join(', ')}\n`);

  // Get ALL sessions happening today and next 7 days
  const now = new Date();
  const futureTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  console.log(`🔍 Fetching sessions from ${now.toISOString()} to ${futureTime.toISOString()}...\n`);

  const { data: sessions, error } = await supabaseAdmin
    .from('batch_class_sessions')
    .select(`
      id,
      batch_id,
      class_name,
      session_number,
      session_title,
      scheduled_datetime,
      session_type,
      status,
      batches!inner(batch_number, start_date, live_class_id)
    `)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_datetime', now.toISOString())
    .lte('scheduled_datetime', futureTime.toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (error) {
    console.error('❌ Error fetching sessions:', error);
    return;
  }

  console.log(`✅ Found ${sessions?.length || 0} sessions\n`);

  if (!sessions || sessions.length === 0) {
    console.log('⚠️ No sessions found. Make sure sessions are created in the database.');
    return;
  }

  let totalSent = 0;
  let totalFailed = 0;

  // Send notification for each session
  for (const session of sessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntil = sessionTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    const timeStr = hoursUntil > 0 
      ? `Starts in ${hoursUntil} hour(s) ${minutesUntil} minute(s)`
      : minutesUntil > 0 
        ? `Starts in ${minutesUntil} minute(s)`
        : 'Starting now!';

    const message = `📚 **${session.class_name}**\n\n🎓 **Class ${session.session_number}**: ${session.session_title}\n\n⏰ **${sessionTime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}**\n\n${timeStr}\n\n🔗 **Join Now**: https://app.thekingezekielacademy.com/live-classes/${session.batches?.live_class_id || 'batch'}/session/${session.id}`;

    console.log(`📤 Sending notification for: ${session.class_name} Class ${session.session_number}`);
    console.log(`   Time: ${sessionTime.toLocaleString()}`);
    console.log(`   ${timeStr}\n`);
    
    let successCount = 0;
    for (const groupId of groupIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: groupId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          })
        });
        
        const data = await response.json();
        if (response.ok && data.ok) {
          successCount++;
          console.log(`  ✅ Sent to group ${groupId}`);
        } else {
          console.log(`  ❌ Failed: ${data.description || 'Unknown error'}`);
          totalFailed++;
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        totalFailed++;
      }
    }
    
    if (successCount > 0) {
      totalSent++;
      console.log(`  📊 Sent to ${successCount}/${groupIds.length} groups ✅\n`);
    } else {
      console.log(`  ❌ Failed to send to any groups\n`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY:`);
  console.log(`  ✅ Sessions notified: ${totalSent}/${sessions.length}`);
  console.log(`  ❌ Failed sends: ${totalFailed}`);
  console.log('='.repeat(50));
}

sendNotificationsNow().catch(console.error);
