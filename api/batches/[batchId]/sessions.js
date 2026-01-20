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
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ success: false, message: 'batchId is required' });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify batch exists
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id, live_class_id, class_name')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Get sessions for this batch
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('batch_class_sessions')
      .select(`
        id,
        batch_id,
        class_name,
        session_number,
        session_title,
        session_type,
        scheduled_date,
        scheduled_time,
        scheduled_datetime,
        status,
        course_video_id
      `)
      .eq('batch_id', batchId)
      .order('scheduled_datetime', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    }

    return res.status(200).json({
      success: true,
      sessions: sessions || []
    });

  } catch (error) {
    console.error('Error in batch sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
