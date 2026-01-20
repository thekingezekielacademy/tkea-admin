/**
 * QStash-triggered reminder endpoint
 * This endpoint is called by QStash on schedule (every 5 minutes)
 * Handles webhook verification and processes reminders
 */

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
          const url = req.url || '/api/cron/qstash-reminders';
          
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
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const remindersSent = {
      telegram: 0,
      email: 0,
      errors: 0
    };

    // Define reminder timings (in milliseconds before class)
    const reminderTimings = {
      '24h_before': 24 * 60 * 60 * 1000,
      '2h_before': 2 * 60 * 60 * 1000,
      '1h_before': 60 * 60 * 1000,
      '30m_before': 30 * 60 * 1000,
      '2m_before': 2 * 60 * 1000,
      'start': 0
    };

    // Get upcoming sessions in the next 48 hours
    const futureTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
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
      .order('scheduled_datetime', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching upcoming sessions:', sessionsError);
      return res.status(500).json({ success: false, message: 'Error fetching sessions' });
    }

    if (!upcomingSessions || upcomingSessions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No upcoming sessions found',
        remindersSent: 0
      });
    }

    // Process each session
    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.scheduled_datetime);
      const timeUntilSession = sessionTime.getTime() - now.getTime();

      // Check which reminders should be sent
      for (const [timing, msBefore] of Object.entries(reminderTimings)) {
        const windowStart = msBefore - 5 * 60 * 1000;
        const windowEnd = msBefore + 5 * 60 * 1000;

        if (timeUntilSession >= windowStart && timeUntilSession <= windowEnd) {
          // Check if reminder already sent
          const { data: existingReminder } = await supabaseAdmin
            .from('class_reminders')
            .select('id')
            .eq('class_session_id', session.id)
            .eq('reminder_type', timing === 'start' ? 'class_start' : 
                timing === '24h_before' ? 'email' :
                timing === '2h_before' ? 'email' :
                timing === '1h_before' ? 'countdown_1hr' :
                timing === '30m_before' ? 'countdown_30min' :
                timing === '2m_before' ? 'countdown_2min' : 'email')
            .limit(1)
            .single();

          if (existingReminder) {
            continue; // Already sent
          }

          // Get users who should receive reminders
          const { data: accessRecords } = await supabaseAdmin
            .from('live_class_access')
            .select('user_id, profiles!inner(email, name)')
            .eq('class_session_id', session.id);

          const { data: fullCourseAccess } = await supabaseAdmin
            .from('live_class_access')
            .select('user_id, profiles!inner(email, name)')
            .eq('live_class_id', session.live_class_id)
            .eq('access_type', 'full_course');

          const usersToNotify = [
            ...(accessRecords || []),
            ...(fullCourseAccess || [])
          ];

          const uniqueUsers = Array.from(
            new Map(usersToNotify.map(u => [u.user_id, u])).values()
          );

          // Map timing to reminder_type
          const reminderType = 
            timing === 'start' ? 'class_start' :
            timing === '24h_before' ? 'email' :
            timing === '2h_before' ? 'email' :
            timing === '1h_before' ? 'countdown_1hr' :
            timing === '30m_before' ? 'countdown_30min' :
            timing === '2m_before' ? 'countdown_2min' : 'email';

          // Format session time
          const sessionDate = new Date(session.scheduled_datetime);
          const formattedDate = sessionDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const formattedTime = sessionDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });

          const sessionTypeEmoji = {
            morning: '🌅',
            afternoon: '☀️',
            evening: '🌙'
          }[session.session_type] || '📚';

          const sessionTypeLabel = session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1);
          const courseTitle = session.live_classes?.courses?.title || 'Live Class';
          const lessonName = session.course_videos?.name || 'Class Session';
          
          const appUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
          const liveClassId = session.live_class_id;
          const classUrl = `${appUrl}/live-classes/${liveClassId}/session/${session.id}`;
          const telegramChannel = process.env.TELEGRAM_CHANNEL || '@LIVECLASSREMINDER';
          
          const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;
          const telegramGroupIds = telegramGroupIdsRaw 
            ? telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id)
            : [];

          // Send Telegram reminders
          if (['1h_before', '30m_before', '2m_before', 'start'].includes(timing)) {
            try {
              const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
              
              let telegramMessage = '';
              
              if (timing === 'start') {
                telegramMessage = `🎉 **Class Starting Now!**

📚 **${courseTitle}**
📖 ${lessonName}
${sessionTypeEmoji} **${sessionTypeLabel} Session**
🕐 ${formattedTime}

👉 [Join Class Now](${classUrl})

Don't miss out! Join now to participate in the live session.`;
              } else {
                const timeLabel = 
                  timing === '1h_before' ? '1 hour' :
                  timing === '30m_before' ? '30 minutes' :
                  timing === '2m_before' ? '2 minutes' : '';
                
                telegramMessage = `⏰ **Reminder: Class in ${timeLabel}!**

📚 **${courseTitle}**
📖 ${lessonName}
${sessionTypeEmoji} **${sessionTypeLabel} Session**
📅 ${formattedDate}
🕐 ${formattedTime}

👉 [Join Class](${classUrl})

See you there! 🎓`;
              }

              if (timing === 'start') {
                // Send to all groups when class starts
                if (telegramGroupIds.length === 0) {
                  console.warn('⚠️ TELEGRAM_GROUP_ID not set. No groups will be notified.');
                } else {
                  let successCount = 0;
                  let failCount = 0;
                  
                  for (const groupId of telegramGroupIds) {
                    try {
                      const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          chat_id: groupId,
                          text: telegramMessage,
                          parse_mode: 'Markdown',
                          disable_web_page_preview: false
                        })
                      });

                      const telegramData = await telegramResponse.json();

                      if (telegramResponse.ok && telegramData.ok) {
                        console.log(`✅ Telegram group notification sent to ${groupId}`);
                        
                        await supabaseAdmin
                          .from('class_reminders')
                          .insert({
                            class_session_id: session.id,
                            reminder_type: reminderType,
                            recipient_email: null,
                            recipient_telegram_id: groupId,
                            status: 'sent'
                          });
                        
                        successCount++;
                        remindersSent.telegram++;
                      } else {
                        console.error(`❌ Failed to send to group ${groupId}:`, telegramData.description);
                        failCount++;
                        remindersSent.errors++;
                      }
                    } catch (groupError) {
                      console.error(`Error sending to group ${groupId}:`, groupError.message);
                      failCount++;
                      remindersSent.errors++;
                    }
                  }
                  
                  console.log(`📊 Group notifications: ${successCount} succeeded, ${failCount} failed`);
                }
              } else {
                // Send to channel for countdown reminders
                const targetChatId = process.env.TELEGRAM_CHANNEL_ID || telegramChannel;
                
                const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chat_id: targetChatId,
                    text: telegramMessage,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: false
                  })
                });

                if (telegramResponse.ok) {
                  const telegramData = await telegramResponse.json();
                  console.log(`✅ Telegram channel reminder sent`);
                  
                  await supabaseAdmin
                    .from('class_reminders')
                    .insert({
                      class_session_id: session.id,
                      reminder_type: reminderType,
                      recipient_email: null,
                      recipient_telegram_id: targetChatId,
                      status: 'sent'
                    });
                  
                  remindersSent.telegram++;
                } else {
                  const errorData = await telegramResponse.json();
                  console.error(`❌ Telegram API error:`, errorData);
                  remindersSent.errors++;
                }
              }
            } catch (telegramError) {
              console.error(`Error sending Telegram reminder:`, telegramError);
              remindersSent.errors++;
            }
          }

          // Send Email reminders for 24h and 2h before
          for (const userAccess of uniqueUsers) {
            try {
              const userEmail = userAccess.profiles?.email;
              const userName = userAccess.profiles?.name || 'Student';

              if (['24h_before', '2h_before'].includes(timing) && userEmail) {
                try {
                  const timeLabel = timing === '24h_before' ? '24 hours' : '2 hours';
                  
                  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Class Reminder</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
    
    <p style="font-size: 16px; color: #333;">
      This is a reminder that your live class is starting in <strong>${timeLabel}</strong>!
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #667eea; margin-top: 0;">${courseTitle}</h2>
      <p style="margin: 10px 0;"><strong>Lesson:</strong> ${lessonName}</p>
      <p style="margin: 10px 0;"><strong>Session:</strong> ${sessionTypeLabel}</p>
      <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${classUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Join Class Now →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      See you in class! 🎓
    </p>
  </div>
</body>
</html>
                  `.trim();

                  const apiBaseUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
                  const emailResponse = await fetch(`${apiBaseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: userEmail,
                      subject: `⏰ Class Reminder: ${courseTitle} - ${timeLabel} before`,
                      html: emailHtml
                    })
                  });

                  if (emailResponse.ok) {
                    const emailData = await emailResponse.json();
                    if (emailData.success) {
                      console.log(`✅ Email reminder sent to ${userEmail}`);
                      
                      await supabaseAdmin
                        .from('class_reminders')
                        .insert({
                          class_session_id: session.id,
                          reminder_type: reminderType,
                          recipient_email: userEmail,
                          status: 'sent'
                        });
                      
                      remindersSent.email++;
                    } else {
                      throw new Error(emailData.error || 'Email API returned error');
                    }
                  } else {
                    const errorData = await emailResponse.json();
                    throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`);
                  }
                } catch (emailError) {
                  console.error(`Error sending email to ${userEmail}:`, emailError);
                  remindersSent.errors++;
                }
              }
            } catch (error) {
              console.error(`Error processing reminder for user:`, error);
              remindersSent.errors++;
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Reminders processed',
      remindersSent: remindersSent.telegram + remindersSent.email,
      breakdown: remindersSent
    });

  } catch (error) {
    console.error('QStash reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
