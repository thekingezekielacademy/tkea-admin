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

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get class name from query or body (for flexibility)
    const { class_name, start_day_of_week } = req.query || req.body || {};

    // If no class_name provided, determine from current day of week
    let targetClass = null;
    let targetDayOfWeek = null;

    if (class_name) {
      // Use provided class name
      targetClass = class_name;
    } else {
      // Determine class based on current day of week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
      
      // Map: Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4
      const dayMapping = {
        1: 'FREELANCING - THE UNTAPPED MARKET', // Monday
        2: 'INFORMATION MARKETING: THE INFINITE CASH LOOP', // Tuesday
        3: 'YOUTUBE MONETIZATION: From Setup To Monetization', // Wednesday
        4: 'EARN 500K SIDE INCOME SELLING EBOOKS', // Thursday
        5: 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE' // Friday
      };

      targetClass = dayMapping[dayOfWeek];
      targetDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday format
    }

    if (!targetClass) {
      return res.status(400).json({ 
        success: false, 
        message: 'No class scheduled for today or class_name not provided' 
      });
    }

    // Get class configuration
    const { data: classConfig, error: classError } = await supabaseAdmin
      .from('batch_classes')
      .select('*')
      .eq('class_name', targetClass)
      .eq('is_active', true)
      .single();

    if (classError || !classConfig) {
      console.error('Error fetching class config:', classError);
      return res.status(404).json({ 
        success: false, 
        message: `Class configuration not found: ${targetClass}` 
      });
    }

    // Find or get the live_class_id for this class
    // First, try to find existing live_class by course_id (if linked)
    let liveClassId = null;
    
    if (classConfig.course_id) {
      // Find live_class linked to this course
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

    // If no live_class found, try to find by title matching class_name
    if (!liveClassId) {
      const { data: liveClassByTitle } = await supabaseAdmin
        .from('live_classes')
        .select('id')
        .eq('title', targetClass)
        .eq('is_active', true)
        .single();
      
      if (liveClassByTitle) {
        liveClassId = liveClassByTitle.id;
      }
    }

    // If still no live_class found, we need to create one or return error
    if (!liveClassId) {
      return res.status(404).json({ 
        success: false, 
        message: `No active live_class found for ${targetClass}. Please create a live_class first or link the batch_class to a course.` 
      });
    }

    // Use provided day or from config
    const classStartDay = start_day_of_week !== undefined ? parseInt(start_day_of_week) : classConfig.start_day_of_week;

    // Get today's date (should be the start day for this class)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight

    // Verify today is the correct day for this class
    const todayDayOfWeek = today.getDay();
    const expectedDayOfWeek = classStartDay === 0 ? 7 : classStartDay + 1; // Convert to Sunday=0 format
    
    if (todayDayOfWeek !== expectedDayOfWeek) {
      return res.status(400).json({ 
        success: false, 
        message: `Today is not the start day for ${targetClass}. Expected day: ${expectedDayOfWeek}, Today: ${todayDayOfWeek}` 
      });
    }

    // Get the last batch number for this live_class
    const { data: lastBatch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('batch_number')
      .eq('live_class_id', liveClassId)
      .order('batch_number', { ascending: false })
      .limit(1)
      .single();

    let nextBatchNumber = 1;
    if (!batchError && lastBatch) {
      nextBatchNumber = lastBatch.batch_number + 1;
    }

    // Create new batch
    const { data: newBatch, error: createError } = await supabaseAdmin
      .from('batches')
      .insert({
        live_class_id: liveClassId,
        class_name: targetClass,
        batch_number: nextBatchNumber,
        start_date: today.toISOString().split('T')[0], // YYYY-MM-DD format
        start_day_of_week: classStartDay,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating batch:', createError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating batch',
        error: createError.message 
      });
    }

    console.log(`✅ Created ${targetClass} Batch ${nextBatchNumber} starting ${today.toISOString().split('T')[0]}`);

    return res.status(200).json({
      success: true,
      message: `Batch created successfully for ${targetClass}`,
      batch: {
        id: newBatch.id,
        class_name: newBatch.class_name,
        batch_number: newBatch.batch_number,
        start_date: newBatch.start_date
      }
    });

  } catch (error) {
    console.error('Error in create-batch cron:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
