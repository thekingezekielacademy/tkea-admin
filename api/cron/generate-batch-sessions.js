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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all active batches with live_class info
    const { data: activeBatches, error: batchesError } = await supabaseAdmin
      .from('batches')
      .select(`
        id, 
        live_class_id,
        class_name, 
        start_date, 
        start_day_of_week, 
        batch_number,
        live_classes!inner(course_id, title)
      `)
      .eq('status', 'active');

    if (batchesError) {
      console.error('Error fetching batches:', batchesError);
      return res.status(500).json({ success: false, message: 'Error fetching batches' });
    }

    if (!activeBatches || activeBatches.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active batches found',
        sessionsCreated: 0
      });
    }

    let totalSessionsCreated = 0;
    const sessionTimes = {
      afternoon: { hour: 13, minute: 0, time: '13:00:00' },
      evening: { hour: 19, minute: 30, time: '19:30:00' }
    };

    // Process each active batch
    for (const batch of activeBatches) {
      // Calculate days since batch start
      const startDate = new Date(batch.start_date);
      startDate.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate current session number (starts at 1)
      const sessionNumber = daysSinceStart + 1;

      if (sessionNumber < 1) {
        continue; // Batch hasn't started yet
      }

      // Get class configuration to get course_id
      const { data: classConfig } = await supabaseAdmin
        .from('batch_classes')
        .select('total_sessions, course_id')
        .eq('class_name', batch.class_name)
        .single();

      // Use course_id from live_class if available, otherwise from classConfig
      const courseId = batch.live_classes?.course_id || classConfig?.course_id;

      // NOTE: Batches run INDEFINITELY - we cycle through videos repeatedly
      // The total_sessions field is informational only, not a hard limit

      // Check if sessions already exist for today
      const { data: existingSessions } = await supabaseAdmin
        .from('batch_class_sessions')
        .select('id')
        .eq('batch_id', batch.id)
        .eq('scheduled_date', todayDateStr);

      if (existingSessions && existingSessions.length > 0) {
        console.log(`Sessions already exist for ${batch.class_name} Batch ${batch.batch_number} on ${todayDateStr}`);
        continue; // Skip if sessions already created
      }

      // Get course videos for this class (if linked to a course)
      let videos = [];
      if (courseId) {
        const { data: courseVideos } = await supabaseAdmin
          .from('course_videos')
          .select('id, name, order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (courseVideos && courseVideos.length > 0) {
          videos = courseVideos;
        }
      }

      // Get video for this session number (cyclical - loops indefinitely)
      let videoId = null;
      let sessionTitle = `Class ${sessionNumber}`;

      if (videos.length > 0) {
        // Cyclical: use modulo to loop through videos indefinitely
        const videoIndex = (sessionNumber - 1) % videos.length;
        videoId = videos[videoIndex].id;
        sessionTitle = videos[videoIndex].name || `Class ${sessionNumber}`;
        
        // Log when we start a new cycle
        if (sessionNumber > videos.length) {
          const cycleNumber = Math.floor((sessionNumber - 1) / videos.length) + 1;
          console.log(`${batch.class_name} Batch ${batch.batch_number}: Session ${sessionNumber} (Cycle ${cycleNumber}, Video ${videoIndex + 1}/${videos.length})`);
        }
      }

      // Create 2 sessions for today (afternoon, evening)
      const sessionsToCreate = [];

      for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
        // Create datetime in UTC to match WAT (UTC+1) local time
        // If we want 7:30 PM WAT, we store 6:30 PM UTC (7:30 PM - 1 hour)
        // But since notification shows 1 hour early, we add 1 hour to get correct display
        const scheduledTime = new Date(today);
        scheduledTime.setUTCHours(timeConfig.hour - 1, timeConfig.minute, 0, 0); // Subtract 1 hour for WAT (UTC+1)
        const scheduledDatetime = scheduledTime.toISOString();

        sessionsToCreate.push({
          batch_id: batch.id,
          class_name: batch.class_name,
          session_number: sessionNumber,
          session_title: sessionTitle,
          course_video_id: videoId,
          session_type: sessionType,
          scheduled_date: todayDateStr,
          scheduled_time: timeConfig.time,
          scheduled_datetime: scheduledDatetime,
          status: 'scheduled'
        });
      }

      // Insert all 2 sessions
      const { error: insertError } = await supabaseAdmin
        .from('batch_class_sessions')
        .insert(sessionsToCreate);

      if (insertError) {
        console.error(`Error creating sessions for ${batch.class_name} Batch ${batch.batch_number}:`, insertError);
        continue;
      }

      totalSessionsCreated += sessionsToCreate.length;
      console.log(`✅ Created ${sessionsToCreate.length} sessions for ${batch.class_name} Batch ${batch.batch_number} - Class ${sessionNumber}`);

      // Schedule notifications for these sessions
      // (This will be handled by a separate notification scheduler)
    }

    return res.status(200).json({
      success: true,
      message: `Session generation complete`,
      sessionsCreated: totalSessionsCreated,
      batchesProcessed: activeBatches.length
    });

  } catch (error) {
    console.error('Error in generate-batch-sessions cron:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
