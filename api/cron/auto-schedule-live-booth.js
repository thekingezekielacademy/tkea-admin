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

    // Allow if: CRON_SECRET matches, or x-vercel-cron header exists, or no CRON_SECRET set (for testing)
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
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active Live Booth courses
    const { data: liveClasses, error: liveClassesError } = await supabaseAdmin
      .from('live_classes')
      .select('id, course_id, cycle_day')
      .eq('is_active', true);

    if (liveClassesError) {
      console.error('Error fetching live classes:', liveClassesError);
      return res.status(500).json({ success: false, message: 'Error fetching live classes' });
    }

    if (!liveClasses || liveClasses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active Live Booth courses found',
        scheduled: 0
      });
    }

    let totalScheduled = 0;

    // Process each Live Booth course
    for (const liveClass of liveClasses) {
      // Check how many sessions are scheduled in the future
      const { count: futureSessionsCount, error: countError } = await supabaseAdmin
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('live_class_id', liveClass.id)
        .gte('scheduled_datetime', new Date().toISOString());

      if (countError) {
        console.error(`Error counting sessions for live class ${liveClass.id}:`, countError);
        continue;
      }

      // Only schedule if we have less than 25 days of sessions
      // (approximately 75 sessions = 25 days * 3 sessions/day)
      if (futureSessionsCount >= 75) {
        continue; // Already has enough sessions scheduled
      }

      // Get course videos
      const { data: videos, error: videosError } = await supabaseAdmin
        .from('course_videos')
        .select('id, order_index')
        .eq('course_id', liveClass.course_id)
        .order('order_index', { ascending: true });

      if (videosError || !videos || videos.length === 0) {
        console.error(`No videos found for course ${liveClass.course_id}`);
        continue;
      }

      // Calculate how many days to schedule (up to 30 days total)
      const daysToSchedule = 30;
      const sessions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setDate(today.getDate() + 1); // Start from tomorrow

      // Session times
      const sessionTimes = {
        morning: { hour: 6, minute: 30, time: '06:30:00' },
        afternoon: { hour: 13, minute: 0, time: '13:00:00' },
        evening: { hour: 19, minute: 30, time: '19:30:00' }
      };

      // Calculate cycle length (max 5 days)
      const cycleLength = Math.min(videos.length, 5);
      let cycleDay = (liveClass.cycle_day - 1) || 0;

      for (let day = 0; day < daysToSchedule; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        
        // Format date as YYYY-MM-DD
        const scheduledDate = currentDate.toISOString().split('T')[0];
        
        // Determine which lesson to use based on cycle
        const lessonIndex = cycleDay % cycleLength;
        const video = videos[lessonIndex];

        // Create 3 sessions per day
        for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);

          // Check if this is a free class (first 2 lessons) - trigger will handle this, but set it anyway
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

        // Advance cycle day
        cycleDay = (cycleDay + 1) % cycleLength;
      }

      // Insert sessions (only if we have sessions to insert)
      if (sessions.length > 0) {
        const { error: sessionsError } = await supabaseAdmin
          .from('class_sessions')
          .insert(sessions);

        if (sessionsError) {
          console.error(`Error creating sessions for live class ${liveClass.id}:`, sessionsError);
          continue;
        }

        // Update cycle_day for next scheduling
        const newCycleDay = (cycleDay % cycleLength) + 1;
        await supabaseAdmin
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
}

