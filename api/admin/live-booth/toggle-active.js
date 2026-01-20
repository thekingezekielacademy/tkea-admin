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

    // Get request body
    const { liveClassId, isActive } = req.body;

    if (!liveClassId) {
      return res.status(400).json({ success: false, message: 'liveClassId is required' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update is_active status
    const { data: updatedLiveClass, error: updateError } = await supabaseAdmin
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

    return res.status(200).json({
      success: true,
      message: isActive ? 'Live class activated' : 'Live class deactivated',
      data: updatedLiveClass,
    });

  } catch (error) {
    console.error('Error in toggle-active:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
