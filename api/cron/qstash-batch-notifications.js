const { createClient } = require('@supabase/supabase-js');
const { verifySignature } = require('@upstash/qstash');




export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-vercel-cron, upstash-signature');

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
    // Verify QStash signature for security
    const qstashCurrentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const qstashNextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (qstashCurrentKey || qstashNextKey) {
      try {
        const signature = req.headers['upstash-signature'];
        
        if (!signature) {
          console.warn('⚠️ No QStash signature found - allowing request');
        } else {
          // For Vercel functions, reconstruct body as string
          const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
          const url = req.url || '/api/cron/qstash-batch-notifications';
          
          try {
            await verifySignature({
              signature,
              body,
              url,
              currentSigningKey: qstashCurrentKey,
              nextSigningKey: qstashNextKey
            });
            console.log('✅ QStash signature verified');
          } catch (verifyError) {
            console.error('❌ QStash signature verification failed:', verifyError);
            return res.status(401).json({ success: false, message: 'Invalid QStash signature' });
          }
        }
      } catch (error) {
        console.error('Error verifying QStash signature:', error);
        return res.status(401).json({ success: false, message: 'Signature verification error' });
      }
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Telegram bot token and group IDs
    // Support both TELEGRAM_GROUP_ID and TELEGRAM_GROUP_IDS (for consistency with live booth reminders)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;

    if (!telegramToken) {
      return res.status(500).json({ success: false, message: 'Telegram bot token not configured' });
    }

    if (!telegramGroupIdsRaw) {
      return res.status(500).json({ success: false, message: 'Telegram group IDs not configured' });
    }

    const groupIds = telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id);

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
    // Also include sessions from today (in case they were just created)
    const futureTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
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
      .gte('scheduled_datetime', todayStart.toISOString()) // Include today's sessions
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

      // Check if session is today or in the future
      const sessionIsToday = new Date(session.scheduled_datetime).toDateString() === today.toDateString();
      const sessionIsFuture = timeUntilSession > 0;
      const sessionCreatedToday = session.created_at && 
        new Date(session.created_at).toDateString() === today.toDateString();

      // Check which notifications should be sent
      for (const [notificationType, msBefore] of Object.entries(notificationTimings)) {
        // Check if it's time to send this notification (within a 5-minute window)
        const windowStart = msBefore - 5 * 60 * 1000; // 5 minutes before target time
        const windowEnd = msBefore + 5 * 60 * 1000; // 5 minutes after target time
        const notificationTimeHasPassed = timeUntilSession < windowStart;

        // Determine if notification should be sent:
        // 1. Normal timing: within 5-minute window of target time
        // 2. Session created today: send ALL notifications immediately (even if timing passed)
        // 3. Session is today: send remaining notifications (3h, 30m) if session hasn't started
        const isNormalTiming = timeUntilSession >= windowStart && timeUntilSession <= windowEnd;
        
        // CRITICAL: If session was created today, send ALL notifications immediately
        // This handles the case where sessions are created on the same day they start
        const shouldSendImmediately = sessionCreatedToday && 
          sessionIsFuture && // Session hasn't started yet
          !isNormalTiming; // Don't double-send if already in normal window

        // For today's sessions: send 3h and 30m notifications if we're within the time window
        const shouldSendTodayNotifications = sessionIsToday && 
          sessionIsFuture &&
          ((notificationType === '3_hours' && timeUntilSession <= 3 * 60 * 60 * 1000 && timeUntilSession > 0) ||
           (notificationType === '30_minutes' && timeUntilSession <= 30 * 60 * 1000 && timeUntilSession > 0));

        // Send notification if any condition is met
        if (isNormalTiming || shouldSendImmediately || shouldSendTodayNotifications) {
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
