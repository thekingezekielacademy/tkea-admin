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

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's enrollments with batch details
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('user_batch_enrollments')
      .select(`
        id,
        batch_id,
        class_name,
        access_level,
        enrollment_date,
        batches!inner(
          id,
          batch_number,
          start_date,
          status,
          class_name
        )
      `)
      .eq('user_id', user.id)
      .order('enrollment_date', { ascending: false });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return res.status(500).json({ success: false, message: 'Failed to fetch batches' });
    }

    return res.status(200).json({
      success: true,
      batches: enrollments || []
    });

  } catch (error) {
    console.error('Error in my-batches:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
