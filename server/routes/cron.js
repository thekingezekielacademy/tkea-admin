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

// Auto-schedule Live Booth classes (INDEFINITE - runs until stopped)
router.post('/auto-schedule-live-booth', checkCronAuth, async (req, res) => {
  try {
    const supabase = getSupabaseForCron(req);

    // Get all active Live Booth classes (both course-based and standalone)
    const { data: liveClasses, error: liveClassesError } = await supabase
      .from('live_classes')
      .select('id, course_id, cycle_day, title')
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
        message: 'No active Live Booth classes found',
        scheduled: 0
      });
    }

    let totalScheduled = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const liveClass of liveClasses) {
      try {
        // Find the last scheduled session to know where to continue from
        const { data: lastSessionData, error: lastSessionError } = await supabase
          .from('class_sessions')
          .select('scheduled_datetime')
          .eq('live_class_id', liveClass.id)
          .order('scheduled_datetime', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count how many days of future sessions we have
        const { count: futureSessionsCount } = await supabase
          .from('class_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('live_class_id', liveClass.id)
          .gte('scheduled_datetime', today.toISOString());

        const daysRemaining = Math.floor((futureSessionsCount || 0) / 3); // 3 sessions per day
        
        // Only schedule if we have less than 7 days remaining (INDEFINITE - auto-extend)
        if (daysRemaining >= 7) {
          console.log(`Live class ${liveClass.id} has ${daysRemaining} days remaining (>= 7), skipping...`);
          continue;
        }

        console.log(`🔄 Scheduling new 30-day extension for live class ${liveClass.id} (${daysRemaining} days remaining)...`);

        // Determine start date: either after last session or tomorrow
        let startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 1); // Default: tomorrow
        
        if (lastSessionData && lastSessionData.scheduled_datetime) {
          const lastSessionDate = new Date(lastSessionData.scheduled_datetime);
          lastSessionDate.setHours(0, 0, 0, 0);
          lastSessionDate.setDate(lastSessionDate.getDate() + 1); // Start the day after last session
          
          // Only use last session date if it's in the future or today
          if (lastSessionDate >= today) {
            startDate = lastSessionDate;
          }
        }

        const isStandalone = !liveClass.course_id;
        let videos = [];
        let cycleLength = 5;

        if (isStandalone) {
          // Get standalone videos
          const { data: standaloneVideos, error: videosError } = await supabase
            .from('standalone_live_class_videos')
            .select('id, name, video_url, video_title, video_description, order_index')
            .eq('live_class_id', liveClass.id)
            .order('order_index', { ascending: true });

          if (videosError || !standaloneVideos || standaloneVideos.length === 0) {
            console.error(`No videos found for standalone live class ${liveClass.id}`);
            continue;
          }

          videos = standaloneVideos.map(v => ({
            id: v.id,
            order_index: v.order_index,
            name: v.name,
            video_url: v.video_url,
            video_title: v.video_title,
            video_description: v.video_description
          }));
          cycleLength = Math.max(5, videos.length);
        } else {
          // Get course videos
          const { data: courseVideos, error: videosError } = await supabase
            .from('course_videos')
            .select('id, order_index, name')
            .eq('course_id', liveClass.course_id)
            .order('order_index', { ascending: true });

          if (videosError || !courseVideos || courseVideos.length === 0) {
            console.error(`No videos found for course ${liveClass.course_id}`);
            continue;
          }

          videos = courseVideos;
          cycleLength = Math.min(videos.length, 5);
        }

        const daysToSchedule = 30;
        const sessions = [];
        
        const sessionTimes = {
          morning: { hour: 6, minute: 30, time: '06:30:00' },
          afternoon: { hour: 13, minute: 0, time: '13:00:00' },
          evening: { hour: 19, minute: 30, time: '19:30:00' }
        };

        let cycleDay = (liveClass.cycle_day - 1) || 0;

        for (let day = 0; day < daysToSchedule; day++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + day);
          const scheduledDate = currentDate.toISOString().split('T')[0];
          
          const lessonIndex = cycleDay % cycleLength;
          const video = videos[lessonIndex];

          if (!video) {
            console.error(`No video found at index ${lessonIndex} for live class ${liveClass.id}`);
            continue;
          }

          for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
            const scheduledTime = new Date(currentDate);
            scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
            
            // First 2 videos are free (order_index 0 and 1)
            const isFree = video.order_index < 2;

            if (isStandalone) {
              sessions.push({
                live_class_id: liveClass.id,
                course_video_id: null,
                video_url: video.video_url,
                video_title: video.video_title || video.name,
                video_description: video.video_description || null,
                session_type: sessionType,
                scheduled_date: scheduledDate,
                scheduled_time: timeConfig.time,
                scheduled_datetime: scheduledTime.toISOString(),
                status: 'scheduled',
                is_free: isFree,
                available_slots: 25,
                current_slots: 25
              });
            } else {
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

          // Update cycle_day to continue from where we left off
          const newCycleDay = (cycleDay % cycleLength) + 1;
          await supabase
            .from('live_classes')
            .update({ cycle_day: newCycleDay, updated_at: new Date().toISOString() })
            .eq('id', liveClass.id);

          totalScheduled += sessions.length;
          console.log(`✅ Scheduled ${sessions.length} new sessions for live class ${liveClass.id} (starting ${startDate.toISOString().split('T')[0]})`);
        }
      } catch (classError) {
        console.error(`Error processing live class ${liveClass.id}:`, classError);
        continue; // Continue with next live class
      }
    }

    res.status(200).json({
      success: true,
      message: 'Scheduling completed',
      scheduled: totalScheduled,
      classesProcessed: liveClasses.length
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

