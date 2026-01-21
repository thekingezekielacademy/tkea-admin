/**
 * Manual notification sender - sends notifications for ALL upcoming sessions
 * regardless of timing (for testing)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function sendAllNotifications() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;

  if (!supabaseUrl || !supabaseServiceKey || !telegramToken || !telegramGroupIdsRaw) {
    console.error('❌ Missing environment variables');
    console.log('Need: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID');
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const groupIds = telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id);

  // Get ALL upcoming sessions
  const now = new Date();
  const futureTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const { data: sessions, error } = await supabaseAdmin
    .from('batch_class_sessions')
    .select('*, batches!inner(*)')
    .eq('status', 'scheduled')
    .gte('scheduled_datetime', now.toISOString())
    .lte('scheduled_datetime', futureTime.toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📋 Found ${sessions?.length || 0} upcoming sessions\n`);

  if (!sessions || sessions.length === 0) {
    console.log('⚠️ No sessions found');
    return;
  }

  // Send notification for each session
  for (const session of sessions) {
    const sessionTime = new Date(session.scheduled_datetime);
    const timeUntil = sessionTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    
    const message = `📚 **${session.class_name}**\n\n🎓 Class ${session.session_number}: ${session.session_title}\n\n⏰ **${sessionTime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}**\n\n${hoursUntil > 0 ? `Starts in ${hoursUntil} hour(s)` : 'Starting soon!'}\n\n🔗 Join: https://app.thekingezekielacademy.com/live-classes/${session.batches?.live_class_id || 'batch'}/session/${session.id}`;

    console.log(`\n📤 Sending notification for: ${session.class_name} Class ${session.session_number}`);
    
    let successCount = 0;
    for (const groupId of groupIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: groupId,
            text: message,
            parse_mode: 'Markdown'
          })
        });
        
        const data = await response.json();
        if (response.ok && data.ok) {
          successCount++;
          console.log(`  ✅ Sent to group ${groupId}`);
        } else {
          console.log(`  ❌ Failed: ${data.description || 'Unknown error'}`);
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
    console.log(`  📊 Sent to ${successCount}/${groupIds.length} groups`);
  }
}

sendAllNotifications();
