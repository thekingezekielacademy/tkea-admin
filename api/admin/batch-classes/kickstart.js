import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

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
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Missing token' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase clients
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Create authenticated client to verify user
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden - Admin access required' });
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Map: Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5
    const dayMapping = {
      1: 'FREELANCING - THE UNTAPPED MARKET', // Monday
      2: 'INFORMATION MARKETING: THE INFINITE CASH LOOP', // Tuesday
      3: 'YOUTUBE MONETIZATION: From Setup To Monetization', // Wednesday
      4: 'EARN 500K SIDE INCOME SELLING EBOOKS', // Thursday
      5: 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE' // Friday
    };

    const todayClass = dayMapping[dayOfWeek];
    const results = {
      batchCreated: false,
      sessionsGenerated: false,
      class: todayClass,
      message: ''
    };

    // Step 1: Create today's batch if it doesn't exist
    if (todayClass) {
      // Get the last batch number for this class
      const { data: lastBatch } = await supabaseAdmin
        .from('batches')
        .select('batch_number')
        .eq('class_name', todayClass)
        .order('batch_number', { ascending: false })
        .limit(1)
        .single();

      let nextBatchNumber = 1;
      if (lastBatch) {
        nextBatchNumber = lastBatch.batch_number + 1;
      }

      // Check if batch already exists for today
      const todayDateStr = today.toISOString().split('T')[0];
      const { data: existingBatch } = await supabaseAdmin
        .from('batches')
        .select('id')
        .eq('class_name', todayClass)
        .eq('start_date', todayDateStr)
        .single();

      if (!existingBatch) {
        // Get class config
        const { data: classConfig } = await supabaseAdmin
          .from('batch_classes')
          .select('start_day_of_week, course_id')
          .eq('class_name', todayClass)
          .single();

        const classStartDay = classConfig ? classConfig.start_day_of_week : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

        // Find live_class_id for this class
        let liveClassId = null;
        
        if (classConfig && classConfig.course_id) {
          const { data: liveClass } = await supabaseAdmin
            .from('live_classes')
            .select('id')
            .eq('course_id', classConfig.course_id)
            .eq('is_active', true)
            .single();
          
          if (liveClass) {
            liveClassId = liveClass.id;
          }
        }

        // If no live_class found, try by title
        if (!liveClassId) {
          const { data: liveClassByTitle } = await supabaseAdmin
            .from('live_classes')
            .select('id')
            .eq('title', todayClass)
            .eq('is_active', true)
            .single();
          
          if (liveClassByTitle) {
            liveClassId = liveClassByTitle.id;
          }
        }

        if (!liveClassId) {
          results.batchCreated = false;
          results.message = `No active live_class found for ${todayClass}. Please create a live_class first.`;
          return res.status(400).json(results);
        }

        // Get last batch number for this live_class
        const { data: lastBatchForLiveClass } = await supabaseAdmin
          .from('batches')
          .select('batch_number')
          .eq('live_class_id', liveClassId)
          .order('batch_number', { ascending: false })
          .limit(1)
          .single();

        if (lastBatchForLiveClass) {
          nextBatchNumber = lastBatchForLiveClass.batch_number + 1;
        }

        // Create batch
        const { data: newBatch, error: createError } = await supabaseAdmin
          .from('batches')
          .insert({
            live_class_id: liveClassId,
            class_name: todayClass,
            batch_number: nextBatchNumber,
            start_date: todayDateStr,
            start_day_of_week: classStartDay,
            status: 'active'
          })
          .select()
          .single();

        if (!createError && newBatch) {
          results.batchCreated = true;
          results.batchId = newBatch.id;
          results.batchNumber = newBatch.batch_number;
        }
      } else {
        results.batchCreated = false;
        results.message = `Batch already exists for ${todayClass} today`;
        results.batchId = existingBatch.id;
      }
    }

    // Step 2: Generate sessions for today (for all active batches)
    const todayDateStr = today.toISOString().split('T')[0];
    
    // Get all active batches with live_class info
    const { data: activeBatches } = await supabaseAdmin
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

    if (activeBatches && activeBatches.length > 0) {
      const sessionTimes = {
        afternoon: { hour: 13, minute: 0, time: '13:00:00' },
        evening: { hour: 19, minute: 30, time: '19:30:00' }
      };

      let sessionsCreated = 0;

      for (const batch of activeBatches) {
        // Check if sessions already exist for today
        const { data: existingSessions } = await supabaseAdmin
          .from('batch_class_sessions')
          .select('id')
          .eq('batch_id', batch.id)
          .eq('scheduled_date', todayDateStr);

        if (existingSessions && existingSessions.length > 0) {
          continue; // Skip if sessions already exist
        }

        // Calculate session number
        const startDate = new Date(batch.start_date);
        startDate.setHours(0, 0, 0, 0);
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const sessionNumber = daysSinceStart + 1;

        if (sessionNumber < 1) {
          continue; // Batch hasn't started yet
        }

        // Get class config and videos
        const { data: classConfig } = await supabaseAdmin
          .from('batch_classes')
          .select('course_id, total_sessions')
          .eq('class_name', batch.class_name)
          .single();

        if (classConfig && classConfig.total_sessions > 0 && sessionNumber > classConfig.total_sessions) {
          continue; // Curriculum ended
        }

        // Use course_id from live_class if available, otherwise from classConfig
        const courseId = batch.live_classes?.course_id || classConfig?.course_id;

        // Get videos
        let videoId = null;
        let sessionTitle = `Class ${sessionNumber}`;

        if (courseId) {
          const { data: videos } = await supabaseAdmin
            .from('course_videos')
            .select('id, name, order_index')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });

          if (videos && videos.length > 0) {
            const videoIndex = sessionNumber - 1;
            if (videoIndex < videos.length) {
              videoId = videos[videoIndex].id;
              sessionTitle = videos[videoIndex].name || `Class ${sessionNumber}`;
            }
          }
        }

        // Create 3 sessions
        const sessionsToCreate = [];
        for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
          const scheduledTime = new Date(today);
          scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
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

        const { error: insertError } = await supabaseAdmin
          .from('batch_class_sessions')
          .insert(sessionsToCreate);

        if (!insertError) {
          sessionsCreated += sessionsToCreate.length;
        }
      }

      if (sessionsCreated > 0) {
        results.sessionsGenerated = true;
        results.sessionsCreated = sessionsCreated;
      }
    }

    results.message = results.message || 'System kickstarted successfully';
    results.success = true;

    return res.status(200).json(results);

  } catch (error) {
    console.error('Error in kickstart:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
