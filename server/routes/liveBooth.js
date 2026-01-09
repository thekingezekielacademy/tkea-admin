const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Helper to check admin access
const checkAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Missing token' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authed Supabase client using the frontend anon key + the user's access token.
    // This lets RLS enforce admin permissions (profiles.role = 'admin') without requiring a service-role key locally.
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    const anonKey =
      supabaseAnonKey ||
      // Local dev fallback (matches `src/lib/supabase.ts`). Safe to embed because it's the public anon key.
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw';

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }

    // Check if admin using the is_admin() database function (bypasses RLS via SECURITY DEFINER)
    const { data: isAdmin, error: adminCheckError } = await supabaseClient
      .rpc('is_admin', { user_id: user.id });

    if (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
      return res.status(500).json({ success: false, message: 'Error checking admin status' });
    }

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden - Admin access required' });
    }

    req.user = user;
    req.supabase = supabaseClient;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create standalone live class (not tied to a course)
router.post('/create-standalone', checkAdmin, async (req, res) => {
  try {
    const { title, description, videoUrl, videoTitle, videoDescription, coverPhotoUrl } = req.body;
    
    console.log('Creating standalone live class with data:', {
      title,
      description,
      videoUrl,
      videoTitle,
      videoDescription,
      coverPhotoUrl
    });
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }

    // Use service role key for admin operations to bypass RLS
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabase;
    if (serviceRoleKey) {
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });
    } else {
      supabase = req.supabase || req.app.locals.supabase;
      if (!supabase) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error: No Supabase client available' 
        });
      }
    }

    // Create standalone Live Booth record (no course_id)
    const trimmedTitle = title.trim();
    console.log('Inserting live class with title:', trimmedTitle);
    
    const { data: liveClass, error: liveClassError } = await supabase
      .from('live_classes')
      .insert({
        title: trimmedTitle, // Trim whitespace
        description: description ? description.trim() : null,
        cover_photo_url: coverPhotoUrl || null, // Cover image URL if provided
        course_id: null, // Standalone - not tied to a course
        is_active: true,
        cycle_day: 1
      })
      .select('id, title, course_id, description, cover_photo_url, is_active, created_at')
      .single();
    
    console.log('Created live class result:', {
      data: liveClass,
      error: liveClassError,
      savedTitle: liveClass?.title,
      hasTitle: !!liveClass?.title,
      titleLength: liveClass?.title?.length
    });

    if (liveClassError) {
      console.error('Error creating standalone live class:', liveClassError);
      return res.status(500).json({
        success: false,
        message: 'Error creating standalone Live Booth record',
        error: liveClassError.message || 'Unknown error',
        code: liveClassError.code,
        hint: liveClassError.hint,
        details: liveClassError.details,
      });
    }

    // Schedule classes for next 30 days with direct video URL
    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1); // Start from tomorrow

    const sessionTimes = {
      morning: { hour: 6, minute: 30, time: '06:30:00' },
      afternoon: { hour: 13, minute: 0, time: '13:00:00' },
      evening: { hour: 19, minute: 30, time: '19:30:00' }
    };

    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const scheduledDate = currentDate.toISOString().split('T')[0];

      for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);

        sessions.push({
          live_class_id: liveClass.id,
          course_video_id: null, // Standalone - no course video
          video_url: videoUrl,
          video_title: videoTitle || title,
          video_description: videoDescription || description || null,
          session_type: sessionType,
          scheduled_date: scheduledDate,
          scheduled_time: timeConfig.time,
          scheduled_datetime: scheduledTime.toISOString(),
          status: 'scheduled',
          is_free: true, // Standalone classes are free by default (can be changed)
          available_slots: 25,
          current_slots: 25,
        });
      }
    }

    // Insert all sessions
    const { data: createdSessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .insert(sessions)
      .select();

    if (sessionsError) {
      console.error('Error creating sessions:', sessionsError);
      // Delete the live class if session creation fails
      await supabase.from('live_classes').delete().eq('id', liveClass.id);
      return res.status(500).json({
        success: false,
        message: 'Error creating class sessions',
        error: sessionsError.message || 'Unknown error',
      });
    }

    res.json({
      success: true,
      message: 'Standalone live class created successfully',
      data: {
        liveClass,
        sessionsCreated: createdSessions?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in create-standalone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating standalone live class',
      error: error.message,
    });
  }
});

// Convert course to Live Booth
router.post('/convert-course', checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    // Use service role key for admin operations to bypass RLS
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabase;
    if (serviceRoleKey) {
      // Use service role key to bypass RLS for admin operations
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });
    } else {
      // Fallback to user-authenticated client (subject to RLS)
      supabase = req.supabase || req.app.locals.supabase;
      if (!supabase) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error: No Supabase client available' 
        });
      }
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already converted
    const { data: existingLiveClass } = await supabase
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

    // Get course videos
    const { data: videos, error: videosError } = await supabase
      .from('course_videos')
      .select('id, order_index, name')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (videosError) {
      return res.status(500).json({ success: false, message: 'Error fetching course videos' });
    }

    if (!videos || videos.length === 0) {
      return res.status(400).json({ success: false, message: 'Course has no lessons/videos' });
    }

    // Ensure we have videos and find the minimum order_index
    const minOrderIndex = Math.min(...videos.map(v => v.order_index));
    console.log(`Videos fetched: ${videos.length} videos, min order_index: ${minOrderIndex}`);
    console.log('First 3 videos:', videos.slice(0, 3).map(v => ({ id: v.id, order_index: v.order_index, name: v.name })));

    // Create Live Booth record
    const { data: liveClass, error: liveClassError } = await supabase
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
      console.error('Full error details:', JSON.stringify(liveClassError, null, 2));
      console.error('Using service role key:', !!serviceRoleKey);
      return res.status(500).json({
        success: false,
        message: 'Error creating Live Booth record',
        error: liveClassError.message || 'Unknown error',
        code: liveClassError.code,
        hint: liveClassError.hint,
        details: liveClassError.details,
        fullError: process.env.NODE_ENV === 'development' ? liveClassError : undefined,
      });
    }

    // Schedule classes for next 30 days
    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1); // Start from tomorrow

    const sessionTimes = {
      morning: { hour: 6, minute: 30, time: '06:30:00' },
      afternoon: { hour: 13, minute: 0, time: '13:00:00' },
      evening: { hour: 19, minute: 30, time: '19:30:00' }
    };

    const cycleLength = Math.min(videos.length, 5);
    let cycleDay = 0;

    // Debug: Log cycle start
    console.log(`Cycle length: ${cycleLength}, Total videos: ${videos.length}`);

    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const scheduledDate = currentDate.toISOString().split('T')[0];
      
      const lessonIndex = cycleDay % cycleLength;
      const video = videos[lessonIndex];
      
      // Debug: Log first few days
      if (day < 3) {
        console.log(`Day ${day}: cycleDay=${cycleDay}, lessonIndex=${lessonIndex}, video order_index=${video.order_index}, video name=${video.name}`);
      }

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

    // Insert all sessions
    const { error: sessionsError } = await supabase
      .from('class_sessions')
      .insert(sessions);

    if (sessionsError) {
      console.error('Error creating sessions:', sessionsError);
      await supabase.from('live_classes').delete().eq('id', liveClass.id);
      return res.status(500).json({
        success: false,
        message: 'Error scheduling classes',
        error: sessionsError.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? sessionsError : undefined,
      });
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
});

// Toggle live class active status (stop/activate)
router.post('/toggle-active', checkAdmin, async (req, res) => {
  try {
    const { liveClassId, isActive } = req.body;
    
    if (!liveClassId) {
      return res.status(400).json({ success: false, message: 'Live class ID is required' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    // Use service role key for admin operations to bypass RLS
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabase;
    if (serviceRoleKey) {
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });
    } else {
      supabase = req.supabase || req.app.locals.supabase;
      if (!supabase) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error: No Supabase client available' 
        });
      }
    }

    // Update is_active status
    const { data: updatedLiveClass, error: updateError } = await supabase
      .from('live_classes')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', liveClassId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating live class status:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating live class status',
        error: updateError.message || 'Unknown error',
      });
    }

    res.json({
      success: true,
      message: isActive ? 'Live class activated' : 'Live class deactivated',
      data: updatedLiveClass,
    });
  } catch (error) {
    console.error('Error in toggle-active:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating live class status',
      error: error.message,
    });
  }
});

// Start session manually
router.post('/start-session', checkAdmin, async (req, res) => {
  try {
    const { sessionId, classSessionId } = req.body;
    const targetSessionId = sessionId || classSessionId;
    
    if (!targetSessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const supabase = req.supabase || req.app.locals.supabase;

    // Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('id, status, scheduled_datetime')
      .eq('id', targetSessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Update session status
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', targetSessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error starting session:', updateError);
      return res.status(500).json({ success: false, message: 'Error starting session' });
    }

    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: updatedSession
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Public endpoint to get free live class sessions (no auth required)
router.get('/public/free-sessions', async (req, res) => {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Use anon key for public access (RLS will handle permissions)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // Get free sessions (is_free = true OR order_index < 2)
    const { data: sessions, error } = await supabase
      .from('class_sessions')
      .select(`
        id,
        live_class_id,
        course_video_id,
        video_url,
        video_title,
        video_description,
        session_type,
        scheduled_datetime,
        status,
        is_free,
        live_classes!inner(
          course_id,
          title,
          description,
          is_active,
          courses(title)
        ),
        course_videos(name, order_index, link)
      `)
      .eq('live_classes.is_active', true)
      // Allow both future and past sessions for rewatching
      .order('scheduled_datetime', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching free sessions:', error);
      return res.status(500).json({ success: false, message: 'Error fetching sessions', error: error.message });
    }

    // Filter to only free sessions (is_free = true OR order_index < 2)
    const freeSessions = (sessions || []).filter((session) => {
      if (session.is_free === true) return true;
      if (session.course_videos?.order_index !== undefined && session.course_videos.order_index < 2) return true;
      return false;
    });

    res.json({
      success: true,
      data: freeSessions,
      count: freeSessions.length
    });
  } catch (error) {
    console.error('Error in public/free-sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Public endpoint to get a specific session by ID (if it's free)
router.get('/public/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      'https://evqerkqiquwxqlizdqmg.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // Get session details
    const { data: session, error } = await supabase
      .from('class_sessions')
      .select(`
        id,
        live_class_id,
        course_video_id,
        video_url,
        video_title,
        video_description,
        session_type,
        scheduled_datetime,
        status,
        is_free,
        live_classes!inner(
          course_id,
          title,
          description,
          is_active,
          courses(title)
        ),
        course_videos(name, order_index, link)
      `)
      .eq('id', sessionId)
      .eq('live_classes.is_active', true)
      .single();

    if (error || !session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if session is free
    const isFree = session.is_free === true || 
                   (session.course_videos?.order_index !== undefined && session.course_videos.order_index < 2);

    if (!isFree) {
      return res.status(403).json({ success: false, message: 'This session requires authentication' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error in public/session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

