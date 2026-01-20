// Emergency: Send immediate notifications for sessions created today
// This can be called manually to send notifications for sessions that were just created

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-vercel-cron');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check auth
    const cronSecret = process.env.CRON_SECRET;
    const vercelCron = req.headers['x-vercel-cron'];
    const authHeader = req.headers.authorization;

    const isAuthorized = 
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      vercelCron === '1' ||
      !cronSecret;

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramGroupIds = process.env.TELEGRAM_GROUP_ID;

    if (!supabaseUrl || !supabaseServiceKey || !telegramToken || !telegramGroupIds) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const groupIds = telegramGroupIds.split(',').map(id => id.trim()).filter(id => id);
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    // Get sessions created today or scheduled for today
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('batch_class_sessions')
      .select(`
        id,
        class_name,
        session_number,
        session_title,
        scheduled_datetime,
        session_type,
        created_at,
        batches!inner(batch_number)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_datetime', todayStart.toISOString())
      .order('scheduled_datetime');

    if (sessionsError) {
      return res.status(500).json({ success: false, message: 'Error fetching sessions', error: sessionsError.message });
    }

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({ success: true, message: 'No sessions found for today', sent: 0 });
    }

    let sentCount = 0;
    const errors = [];

    for (const session of sessions) {
      const sessionDate = new Date(session.scheduled_datetime);
      const dateStr = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = sessionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const sessionTypeFormatted = session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1);

      const message = `📅 Enrolment Update: A new session for ${session.class_name} is officially scheduled for ${dateStr} at ${timeStr} (${sessionTypeFormatted} session). Perfect for all new members!

📚 Class ${session.session_number}: ${session.session_title}
👥 Batch ${session.batches.batch_number}

Join us and don't miss out! 🚀`;

      // Send to all groups
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
            sentCount++;
          } else {
            errors.push(`Group ${groupId}: ${data.description || 'Unknown error'}`);
          }
        } catch (error: any) {
          errors.push(`Group ${groupId}: ${error.message}`);
        }
      }

      // Record notification
      await supabaseAdmin
        .from('batch_class_notifications')
        .insert({
          session_id: session.id,
          notification_type: 'immediate',
          scheduled_send_time: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          status: sentCount > 0 ? 'sent' : 'failed',
          telegram_group_ids: groupIds.join(','),
          error_message: errors.length > 0 ? errors.join('; ') : null
        });
    }

    return res.status(200).json({
      success: true,
      message: `Sent immediate notifications for ${sessions.length} sessions`,
      sessionsProcessed: sessions.length,
      notificationsSent: sentCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error in send-immediate-batch-notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
