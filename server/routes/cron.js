const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Helper to get Supabase client:
// - Prefer service role (bypasses RLS) for real cron jobs
// - Otherwise, in local dev, use the caller's Bearer token so RLS can treat them as admin
const getSupabaseForCron = (req) => {
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.REACT_APP_SUPABASE_URL || 
                      'https://evqerkqiquwxqlizdqmg.supabase.co';
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw';

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  }

  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null;

  return createClient(supabaseUrl, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false },
  });
};

// Helper to check cron authentication
const checkCronAuth = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  const vercelCron = req.headers['x-vercel-cron'];
  const authHeader = req.headers.authorization;

  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    vercelCron === '1' ||
    !cronSecret; // Allow if no secret set (for local testing)

  if (!isAuthorized) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

// Auto-schedule Live Booth classes
router.post('/auto-schedule-live-booth', checkCronAuth, async (req, res) => {
  try {
    const supabase = getSupabaseForCron(req);

    // Get all active Live Booth courses
    const { data: liveClasses, error: liveClassesError } = await supabase
      .from('live_classes')
      .select('id, course_id, cycle_day')
      .eq('is_active', true);

    if (liveClassesError) {
      console.error('Error fetching live classes:', liveClassesError);
      console.error('Error details:', JSON.stringify(liveClassesError, null, 2));
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching live classes',
        error: liveClassesError.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? liveClassesError : undefined
      });
    }

    if (!liveClasses || liveClasses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active Live Booth courses found',
        scheduled: 0
      });
    }

    let totalScheduled = 0;

    for (const liveClass of liveClasses) {
      // Check how many sessions are scheduled
      const { count: futureSessionsCount } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('live_class_id', liveClass.id)
        .gte('scheduled_datetime', new Date().toISOString());

      if (futureSessionsCount >= 75) {
        continue; // Already has enough sessions
      }

      // Get course videos
      const { data: videos, error: videosError } = await supabase
        .from('course_videos')
        .select('id, order_index')
        .eq('course_id', liveClass.course_id)
        .order('order_index', { ascending: true });

      if (videosError || !videos || videos.length === 0) {
        console.error(`No videos found for course ${liveClass.course_id}`);
        continue;
      }

      const daysToSchedule = 30;
      const sessions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setDate(today.getDate() + 1);

      const sessionTimes = {
        morning: { hour: 6, minute: 30, time: '06:30:00' },
        afternoon: { hour: 13, minute: 0, time: '13:00:00' },
        evening: { hour: 19, minute: 30, time: '19:30:00' }
      };

      const cycleLength = Math.min(videos.length, 5);
      let cycleDay = (liveClass.cycle_day - 1) || 0;

      for (let day = 0; day < daysToSchedule; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        const scheduledDate = currentDate.toISOString().split('T')[0];
        
        const lessonIndex = cycleDay % cycleLength;
        const video = videos[lessonIndex];

        for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
          const isFree = video.order_index < 2;

          sessions.push({
            live_class_id: liveClass.id,
            course_video_id: video.id,
            session_type: sessionType,
            scheduled_date: scheduledDate,
            scheduled_time: timeConfig.time,
            scheduled_datetime: scheduledTime.toISOString(),
            status: 'scheduled',
            is_free: isFree,
            available_slots: 25,
            current_slots: 25
          });
        }

        cycleDay = (cycleDay + 1) % cycleLength;
      }

      if (sessions.length > 0) {
        const { error: sessionsError } = await supabase
          .from('class_sessions')
          .insert(sessions);

        if (sessionsError) {
          console.error(`Error creating sessions for live class ${liveClass.id}:`, sessionsError);
          continue;
        }

        const newCycleDay = (cycleDay % cycleLength) + 1;
        await supabase
          .from('live_classes')
          .update({ cycle_day: newCycleDay })
          .eq('id', liveClass.id);

        totalScheduled += sessions.length;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Scheduling completed',
      scheduled: totalScheduled,
      coursesProcessed: liveClasses.length
    });

  } catch (error) {
    console.error('Auto-schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Process Live Booth reminders
router.post('/live-booth-reminders', checkCronAuth, async (req, res) => {
  try {
    const supabase = getSupabaseForCron(req);
    const now = new Date();
    const remindersSent = { telegram: 0, email: 0, errors: 0 };

    const reminderTimings = {
      '24h_before': 24 * 60 * 60 * 1000,
      '2h_before': 2 * 60 * 60 * 1000,
      '1h_before': 60 * 60 * 1000,
      '30m_before': 30 * 60 * 1000,
      '2m_before': 2 * 60 * 1000,
      'start': 0
    };

    const futureTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    const { data: upcomingSessions, error: sessionsError } = await supabase
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

    // Process each session (simplified - full implementation in serverless function)
    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.scheduled_datetime);
      const timeUntilSession = sessionTime.getTime() - now.getTime();

      for (const [timing, msBefore] of Object.entries(reminderTimings)) {
        const windowStart = msBefore - 5 * 60 * 1000;
        const windowEnd = msBefore + 5 * 60 * 1000;

        if (timeUntilSession >= windowStart && timeUntilSession <= windowEnd) {
          const reminderType = 
            timing === 'start' ? 'class_start' :
            timing === '24h_before' ? 'email' :
            timing === '2h_before' ? 'email' :
            timing === '1h_before' ? 'countdown_1hr' :
            timing === '30m_before' ? 'countdown_30min' :
            timing === '2m_before' ? 'countdown_2min' : 'email';

          // Check if already sent
          const { data: existingReminder } = await supabase
            .from('class_reminders')
            .select('id')
            .eq('class_session_id', session.id)
            .eq('reminder_type', reminderType)
            .limit(1)
            .single();

          if (existingReminder) {
            continue;
          }

          // Get users with access
          const { data: accessRecords } = await supabase
            .from('live_class_access')
            .select('user_id, profiles!inner(email, name)')
            .eq('class_session_id', session.id);

          const { data: fullCourseAccess } = await supabase
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

          // Send reminders (simplified version - full implementation in serverless)
          for (const userAccess of uniqueUsers) {
            try {
              await supabase
                .from('class_reminders')
                .insert({
                  class_session_id: session.id,
                  reminder_type: reminderType,
                  recipient_email: userAccess.profiles?.email,
                  status: 'sent'
                });

              if (['1h_before', '30m_before', '2m_before', 'start'].includes(timing)) {
                remindersSent.telegram++;
              } else {
                remindersSent.email++;
              }
            } catch (error) {
              console.error(`Error sending reminder:`, error);
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
    console.error('Reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;

