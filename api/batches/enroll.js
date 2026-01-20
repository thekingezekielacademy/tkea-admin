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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { batch_id, access_level } = req.body || {};

    if (!batch_id) {
      return res.status(400).json({ success: false, message: 'batch_id is required' });
    }

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

    // Verify batch exists
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id, class_name, status')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch || batch.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Batch not found or not active' });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('user_batch_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .single();

    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: 'Already enrolled',
        enrollment: existingEnrollment
      });
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('user_batch_enrollments')
      .insert({
        user_id: user.id,
        batch_id: batch_id,
        class_name: batch.class_name,
        access_level: access_level || 'limited_access'
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Enrollment error:', enrollError);
      return res.status(500).json({ success: false, message: 'Failed to enroll', error: enrollError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Enrolled successfully',
      enrollment
    });

  } catch (error) {
    console.error('Error in enroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
