const { createClient } = require('@supabase/supabase-js');

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

    if (!supabaseUrl || !supabaseAnonKey) {
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

    // Get course ID from request body
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Check if course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course already has Live Booth
    const { data: existingLiveClass, error: checkError } = await supabaseAdmin
      .from('live_classes')
      .select('id')
      .eq('course_id', courseId)
      .single();

    if (existingLiveClass) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course already converted to Live Booth',
        liveClassId: existingLiveClass.id
      });
    }

    // Get course videos to check if course has lessons
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('course_videos')
      .select('id, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (videosError) {
      return res.status(500).json({ success: false, message: 'Error fetching course videos' });
    }

    if (!videos || videos.length === 0) {
      return res.status(400).json({ success: false, message: 'Course has no lessons/videos' });
    }

    // Create Live Booth record
    const { data: liveClass, error: liveClassError } = await supabaseAdmin
      .from('live_classes')
      .insert({
        course_id: courseId,
        is_active: true,
        cycle_day: 1
      })
      .select()
      .single();

    if (liveClassError) {
      console.error('Error creating live class:', liveClassError);
      return res.status(500).json({ success: false, message: 'Error creating Live Booth record' });
    }

    // Schedule classes for the next 30 days
    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1); // Start from tomorrow

    // Session times: Morning 6:30, Afternoon 1:00, Evening 7:30
    const sessionTimes = {
      morning: { hour: 6, minute: 30, time: '06:30:00' },
      afternoon: { hour: 13, minute: 0, time: '13:00:00' },
      evening: { hour: 19, minute: 30, time: '19:30:00' }
    };

    // Calculate cycle length (max 5 days)
    const cycleLength = Math.min(videos.length, 5);
    let cycleDay = 0;

    for (let day = 0; day < 30; day++) {
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

    // Insert all sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('class_sessions')
      .insert(sessions);

    if (sessionsError) {
      console.error('Error creating sessions:', sessionsError);
      // Rollback: delete the live class
      await supabaseAdmin.from('live_classes').delete().eq('id', liveClass.id);
      return res.status(500).json({ success: false, message: 'Error scheduling classes' });
    }

    res.status(200).json({
      success: true,
      message: 'Course converted to Live Booth successfully',
      data: {
        liveClassId: liveClass.id,
        courseId: courseId,
        courseTitle: course.title,
        sessionsCreated: sessions.length,
        totalLessons: videos.length
      }
    });

  } catch (error) {
    console.error('Convert course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

