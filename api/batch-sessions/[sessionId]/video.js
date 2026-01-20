const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get session with video details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('batch_class_sessions')
      .select(`
        id,
        batch_id,
        session_number,
        course_video_id,
        batches!inner(batch_number)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check enrollment and access
    const { data: enrollment } = await supabaseAdmin
      .from('user_batch_enrollments')
      .select('access_level')
      .eq('user_id', user.id)
      .eq('batch_id', session.batch_id)
      .single();

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
    }

    // Access control: Sessions 1-2 free, Sessions 3+ require full_access
    const hasAccess = session.session_number <= 2 || enrollment.access_level === 'full_access';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted',
        requiresFullAccess: true,
        sessionNumber: session.session_number
      });
    }

    // Get video details
    if (!session.course_video_id) {
      return res.status(404).json({ success: false, message: 'Video not found for this session' });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from('course_videos')
      .select('id, name, video_url, video_id, order_index')
      .eq('id', session.course_video_id)
      .single();

    if (videoError || !video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    return res.status(200).json({
      success: true,
      video: {
        id: video.id,
        name: video.name,
        video_url: video.video_url,
        video_id: video.video_id,
        order_index: video.order_index
      },
      session: {
        id: session.id,
        session_number: session.session_number,
        batch_number: session.batches.batch_number
      }
    });

  } catch (error) {
    console.error('Error in video access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
