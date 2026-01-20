const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-vercel-cron');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check for cron authentication
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

    // Initialize Supabase admin client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Telegram bot token and group IDs
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramGroupIds = process.env.TELEGRAM_GROUP_ID;

    if (!telegramToken) {
      return res.status(500).json({ success: false, message: 'Telegram bot token not configured' });
    }

    if (!telegramGroupIds) {
      return res.status(500).json({ success: false, message: 'Telegram group IDs not configured' });
    }

    const groupIds = telegramGroupIds.split(',').map(id => id.trim()).filter(id => id);

    if (groupIds.length === 0) {
      return res.status(500).json({ success: false, message: 'No Telegram group IDs found' });
    }

    const now = new Date();
    const notificationsSent = {
      '5_days': 0,
      '48_hours': 0,
      '24_hours': 0,
      '3_hours': 0,
      '30_minutes': 0,
      errors: 0
    };

    // Define notification timings (in milliseconds before class)
    const notificationTimings = {
      '5_days': 5 * 24 * 60 * 60 * 1000,      // 5 days
      '48_hours': 48 * 60 * 60 * 1000,         // 48 hours
      '24_hours': 24 * 60 * 60 * 1000,         // 24 hours
      '3_hours': 3 * 60 * 60 * 1000,           // 3 hours
      '30_minutes': 30 * 60 * 1000             // 30 minutes
    };

    // Get upcoming sessions in the next 6 days (to catch 5-day notifications)
    const futureTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    
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
        batches!inner(batch_number, start_date)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_datetime', now.toISOString())
      .lte('scheduled_datetime', futureTime.toISOString())
      .order('scheduled_datetime', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching upcoming sessions:', sessionsError);
      return res.status(500).json({ success: false, message: 'Error fetching sessions' });
    }

    if (!upcomingSessions || upcomingSessions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No upcoming sessions found',
        notificationsSent: 0
      });
    }

    // Process each session
    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.scheduled_datetime);
      const timeUntilSession = sessionTime.getTime() - now.getTime();

      // Check which notifications should be sent
      for (const [notificationType, msBefore] of Object.entries(notificationTimings)) {
        // Check if it's time to send this notification (within a 5-minute window)
        const windowStart = msBefore - 5 * 60 * 1000; // 5 minutes before target time
        const windowEnd = msBefore + 5 * 60 * 1000; // 5 minutes after target time

        if (timeUntilSession >= windowStart && timeUntilSession <= windowEnd) {
          // Check if notification already sent
          const { data: existingNotification } = await supabaseAdmin
            .from('batch_class_notifications')
            .select('id')
            .eq('session_id', session.id)
            .eq('notification_type', notificationType)
            .single();

          if (existingNotification) {
            continue; // Already sent
          }

          // Format date and time for notification
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

          // Format session type
          const sessionTypeFormatted = session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1);

          // Create notification message
          const notificationMessage = `📅 Enrolment Update: A new session for ${session.class_name} is officially scheduled for ${dateStr} at ${timeStr} (${sessionTypeFormatted} session). Perfect for all new members!

📚 Class ${session.session_number}: ${session.session_title}
👥 Batch ${session.batches.batch_number}

Join us and don't miss out! 🚀`;

          // Send to all Telegram groups
          let successCount = 0;
          let failCount = 0;
          const sentGroupIds = [];

          for (const groupId of groupIds) {
            try {
              const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: groupId,
                  text: notificationMessage,
                  parse_mode: 'Markdown',
                  disable_web_page_preview: false
                })
              });

              const telegramData = await telegramResponse.json();

              if (telegramResponse.ok && telegramData.ok) {
                successCount++;
                sentGroupIds.push(groupId);
                console.log(`✅ Telegram notification sent to group ${groupId} for session ${session.id} (${notificationType})`);
              } else {
                failCount++;
                console.error(`❌ Telegram API error for group ${groupId}:`, telegramData.description || 'Unknown error');
              }
            } catch (error) {
              failCount++;
              console.error(`❌ Error sending to group ${groupId}:`, error.message);
            }
          }

          // Record notification in database
          const notificationStatus = successCount > 0 ? 'sent' : 'failed';
          const errorMsg = failCount > 0 ? `Failed to send to ${failCount} group(s)` : null;

          await supabaseAdmin
            .from('batch_class_notifications')
            .insert({
              session_id: session.id,
              notification_type: notificationType,
              scheduled_send_time: new Date(now.getTime() + msBefore).toISOString(),
              sent_at: notificationStatus === 'sent' ? new Date().toISOString() : null,
              status: notificationStatus,
              telegram_group_ids: sentGroupIds.join(','),
              error_message: errorMsg
            });

          if (notificationStatus === 'sent') {
            notificationsSent[notificationType]++;
            console.log(`📤 Sent ${notificationType} notification for ${session.class_name} Class ${session.session_number} to ${successCount} group(s)`);
          } else {
            notificationsSent.errors++;
            console.error(`❌ Failed to send ${notificationType} notification for session ${session.id}`);
          }
        }
      }
    }

    const totalSent = Object.values(notificationsSent).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0) - notificationsSent.errors;

    return res.status(200).json({
      success: true,
      message: 'Notification processing complete',
      notificationsSent: {
        total: totalSent,
        byType: notificationsSent,
        errors: notificationsSent.errors
      }
    });

  } catch (error) {
    console.error('Error in batch-class-notifications cron:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
