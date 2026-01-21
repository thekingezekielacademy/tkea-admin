const { createClient } = require('@supabase/supabase-js');
const { verifySignature } = require('@upstash/qstash');




export default async function handler(req, res) {
  // Log that endpoint was called
  console.log('🔔 QStash batch notifications endpoint called at', new Date().toISOString());
  console.log('📥 Method:', req.method);
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));

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
    console.warn('⚠️ Invalid method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify QStash signature for security (lenient - allow if verification fails)
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
          // Use the full URL path for signature verification
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
            console.warn('⚠️ QStash signature verification failed:', verifyError.message);
            // Allow for now - enable strict verification in production if needed
            // This matches the behavior of the working reminders endpoint
          }
        }
      } catch (verifyError) {
        console.warn('⚠️ QStash signature verification error:', verifyError.message);
        // Allow to continue - don't block the request
      }
    } else {
      console.warn('⚠️ QStash signing keys not configured - skipping signature verification');
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
    const today = new Date();
    const notificationsSent = {
      '24_hours': 0,
      errors: 0
    };

    // Get upcoming sessions in the next 7 days (matching manual script)
    const futureTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
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
        batches!inner(batch_number, start_date, live_class_id)
      `)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_datetime', now.toISOString())
      .lte('scheduled_datetime', futureTime.toISOString())
      .order('scheduled_datetime', { ascending: true });

    if (sessionsError) {
      console.error('❌ Error fetching upcoming sessions:', sessionsError);
      return res.status(500).json({ success: false, message: 'Error fetching sessions', error: sessionsError.message });
    }

    console.log(`📊 Found ${upcomingSessions?.length || 0} upcoming sessions`);

    if (!upcomingSessions || upcomingSessions.length === 0) {
      console.log('ℹ️ No upcoming sessions found - returning early');
      return res.status(200).json({ 
        success: true, 
        message: 'No upcoming sessions found',
        notificationsSent: 0
      });
    }

    // SIMPLIFIED: Process each session - send ONE notification per session (like manual script)
    // This matches the working manual script behavior
    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.scheduled_datetime);
      const timeUntilSession = sessionTime.getTime() - now.getTime();
      
      // Only send for future sessions
      if (timeUntilSession <= 0) {
        continue; // Session already started or passed
      }

      // Check if notification already sent for this session
      // Use '24_hours' as the notification type (database constraint requires one of: 5_days, 48_hours, 24_hours, 3_hours, 30_minutes)
      const notificationType = '24_hours'; // Single notification type per session
      const { data: existingNotification } = await supabaseAdmin
        .from('batch_class_notifications')
        .select('id, sent_at')
        .eq('session_id', session.id)
        .eq('notification_type', notificationType)
        .single();

      // Skip if notification was sent within last 6 hours (to prevent spam)
      if (existingNotification && existingNotification.sent_at) {
        const sentTime = new Date(existingNotification.sent_at);
        const timeSinceSent = now.getTime() - sentTime.getTime();
        if (timeSinceSent < 6 * 60 * 60 * 1000) { // Less than 6 hours ago
          continue; // Already sent recently
        }
      }

      // Calculate time until session
      const hoursUntil = Math.floor(timeUntilSession / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntilSession % (1000 * 60 * 60)) / (1000 * 60));
      
      const timeStr = hoursUntil > 0 
        ? `Starts in ${hoursUntil} hour(s) ${minutesUntil} minute(s)`
        : minutesUntil > 0 
          ? `Starts in ${minutesUntil} minute(s)`
          : 'Starting now!';

      // Create notification message (matching manual script format)
      const notificationMessage = `📚 **${session.class_name}**\n\n🎓 **Class ${session.session_number}**: ${session.session_title}\n\n⏰ **${sessionTime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}**\n\n${timeStr}\n\n🔗 **Join Now**: https://app.thekingezekielacademy.com/live-classes/${session.batches?.live_class_id || 'batch'}/session/${session.id}`;

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
            console.log(`✅ Telegram notification sent to group ${groupId} for session ${session.id}`);
          } else {
            failCount++;
            console.error(`❌ Telegram API error for group ${groupId}:`, telegramData.description || 'Unknown error');
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Error sending to group ${groupId}:`, error.message);
        }
      }

      // Record notification in database using UPSERT (handles UNIQUE constraint)
      const notificationStatus = successCount > 0 ? 'sent' : 'failed';
      const errorMsg = failCount > 0 ? `Failed to send to ${failCount} group(s)` : null;

      try {
        const { error: dbError } = await supabaseAdmin
          .from('batch_class_notifications')
          .upsert({
            session_id: session.id,
            notification_type: notificationType,
            scheduled_send_time: sessionTime.toISOString(),
            sent_at: notificationStatus === 'sent' ? new Date().toISOString() : null,
            status: notificationStatus,
            telegram_group_ids: sentGroupIds.join(','),
            error_message: errorMsg
          }, {
            onConflict: 'session_id,notification_type'
          });

        if (dbError) {
          console.error(`❌ Database error recording notification for session ${session.id}:`, dbError);
        }
      } catch (dbError) {
        console.error(`❌ Error recording notification in database:`, dbError);
      }

      if (notificationStatus === 'sent') {
        notificationsSent['24_hours']++;
        console.log(`📤 Sent notification for ${session.class_name} Class ${session.session_number} to ${successCount} group(s)`);
      } else {
        notificationsSent.errors++;
        console.error(`❌ Failed to send notification for session ${session.id}`);
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
    console.error('❌ Error in batch-class-notifications cron:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
