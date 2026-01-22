const { createClient } = require('@supabase/supabase-js');

async function generateTodaySessions() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const className = 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  console.log('📅 GENERATING SESSIONS FOR TODAY\n');
  console.log('='.repeat(60));

  // Get the active batch
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('class_name', className)
    .eq('status', 'active')
    .order('batch_number', { ascending: false })
    .limit(1)
    .single();

  if (batchError || !batch) {
    console.error('❌ No active batch found:', batchError?.message);
    process.exit(1);
  }

  console.log(`✅ Found batch: ${batch.batch_number} (started ${batch.start_date})`);

  // Check if sessions already exist for today
  const { data: existingSessions } = await supabase
    .from('batch_class_sessions')
    .select('id')
    .eq('batch_id', batch.id)
    .eq('scheduled_date', todayStr);

  if (existingSessions && existingSessions.length > 0) {
    console.log(`⚠️  ${existingSessions.length} session(s) already exist for today`);
    console.log('   Deleting and recreating...');
    // Delete existing sessions for today
    await supabase
      .from('batch_class_sessions')
      .delete()
      .eq('batch_id', batch.id)
      .eq('scheduled_date', todayStr);
  }

  // Calculate session number
  const startDate = new Date(batch.start_date);
  startDate.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const sessionNumber = daysSinceStart + 1;

  console.log(`📊 Days since start: ${daysSinceStart}`);
  console.log(`📚 Session number: ${sessionNumber}`);

  // Get course videos if available
  let videos = [];
  const { data: classConfig } = await supabase
    .from('batch_classes')
    .select('course_id')
    .eq('class_name', className)
    .single();

  if (classConfig?.course_id) {
    const { data: courseVideos } = await supabase
      .from('course_videos')
      .select('id, name, order_index')
      .eq('course_id', classConfig.course_id)
      .order('order_index', { ascending: true });

    if (courseVideos && courseVideos.length > 0) {
      videos = courseVideos;
    }
  }

  // Get video for this session
  let videoId = null;
  let sessionTitle = `Class ${sessionNumber}`;

  if (videos.length > 0) {
    const videoIndex = sessionNumber - 1;
    if (videoIndex < videos.length) {
      videoId = videos[videoIndex].id;
      sessionTitle = videos[videoIndex].name || `Class ${sessionNumber}`;
    }
  }

  // Create sessions
  const sessionTimes = {
    morning: { hour: 6, minute: 30, time: '06:30:00' },
    afternoon: { hour: 13, minute: 0, time: '13:00:00' },
    evening: { hour: 19, minute: 30, time: '19:30:00' }
  };

  const sessionsToCreate = [];
  for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
    const scheduledTime = new Date(today);
    scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
    const scheduledDatetime = scheduledTime.toISOString();

    sessionsToCreate.push({
      batch_id: batch.id,
      class_name: className,
      session_number: sessionNumber,
      session_title: sessionTitle,
      course_video_id: videoId,
      session_type: sessionType,
      scheduled_date: todayStr,
      scheduled_time: timeConfig.time,
      scheduled_datetime: scheduledDatetime,
      status: 'scheduled'
    });
  }

  const { error: insertError } = await supabase
    .from('batch_class_sessions')
    .insert(sessionsToCreate);

  if (insertError) {
    console.error('❌ Error creating sessions:', insertError.message);
    process.exit(1);
  }

  console.log(`\n✅ Created ${sessionsToCreate.length} sessions for today:`);
  sessionsToCreate.forEach(session => {
    console.log(`   - ${session.session_type}: ${session.scheduled_time} (${session.session_title})`);
  });

  console.log('\n✅ DONE!\n');
}

generateTodaySessions().catch(console.error);
