const { createClient } = require('@supabase/supabase-js');
const { verifySignature } = require('@upstash/qstash');

export default async function handler(req, res) {
  // Log that endpoint was called
  console.log('🔔 QStash batch notifications endpoint called at', new Date().toISOString());
  console.log('📥 Method:', req.method);

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
    // Verify QStash signature (lenient - allow if verification fails)
    const qstashCurrentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const qstashNextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (qstashCurrentKey || qstashNextKey) {
      try {
        const signature = req.headers['upstash-signature'];
        if (signature) {
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
            console.warn('⚠️ QStash signature verification failed:', verifyError.message);
          }
        }
      } catch (verifyError) {
        console.warn('⚠️ QStash signature verification error:', verifyError.message);
      }
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Telegram bot token and group IDs
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;

    if (!telegramToken) {
      console.error('❌ Telegram bot token not configured');
      return res.status(500).json({ success: false, message: 'Telegram bot token not configured' });
    }

    if (!telegramGroupIdsRaw) {
      console.error('❌ Telegram group IDs not configured');
      return res.status(500).json({ success: false, message: 'Telegram group IDs not configured' });
    }

    const groupIds = telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id);

    if (groupIds.length === 0) {
      console.error('❌ No Telegram group IDs found');
      return res.status(500).json({ success: false, message: 'No Telegram group IDs found' });
    }

    const now = new Date();
    const notificationsSent = {
      '24_hours': 0,
      errors: 0
    };

    // Get upcoming sessions in the next 7 days
    const futureTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log('📊 Fetching upcoming sessions...');
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
      console.log('ℹ️ No upcoming sessions found');
      return res.status(200).json({ 
        success: true, 
        message: 'No upcoming sessions found',
        notificationsSent: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Process each session - send ONE notification per session
    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.scheduled_datetime);
      const timeUntilSession = sessionTime.getTime() - now.getTime();
      
      // Only send for future sessions
      if (timeUntilSession <= 0) {
        continue;
      }

      // Check if notification already sent
      const notificationType = '24_hours';
      const { data: existingNotification, error: notificationCheckError } = await supabaseAdmin
        .from('batch_class_notifications')
        .select('id, sent_at')
        .eq('session_id', session.id)
        .eq('notification_type', notificationType)
        .maybeSingle();

      if (notificationCheckError && notificationCheckError.code !== 'PGRST116') {
        console.error(`❌ Error checking notification for session ${session.id}:`, notificationCheckError);
      }

      // Skip if notification was sent within last 6 hours
      if (existingNotification && existingNotification.sent_at) {
        const sentTime = new Date(existingNotification.sent_at);
        const timeSinceSent = now.getTime() - sentTime.getTime();
        if (timeSinceSent < 6 * 60 * 60 * 1000) {
          console.log(`⏭️  Skipping session ${session.id} - notification sent ${Math.round(timeSinceSent / (60 * 60 * 1000))} hours ago`);
          continue;
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

      // Create notification message
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

      // Record notification in database using UPSERT
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

    const response = {
      success: true,
      message: 'Notification processing complete',
      notificationsSent: {
        total: totalSent,
        byType: notificationsSent,
        errors: notificationsSent.errors
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Processing complete:', JSON.stringify(response));
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in batch-class-notifications cron:', error);
    console.error('❌ Error stack:', error.stack);
    
    // ALWAYS return a response - never let it hang
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
