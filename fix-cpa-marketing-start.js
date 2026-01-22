const { createClient } = require('@supabase/supabase-js');

async function fixCPAMarketing() {
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

  console.log('🔧 FIXING CPA MARKETING CLASS START ISSUE\n');
  console.log('='.repeat(60));

  // Step 1: Update start_day_of_week from 4 (Friday) to 3 (Thursday)
  console.log('\n1️⃣ Updating batch_classes configuration...');
  const { data: updatedClass, error: updateError } = await supabase
    .from('batch_classes')
    .update({ start_day_of_week: 3 }) // 3 = Thursday
    .eq('class_name', className)
    .select()
    .single();

  if (updateError) {
    console.error('   ❌ Error updating batch_classes:', updateError.message);
    process.exit(1);
  }

  console.log(`   ✅ Updated start_day_of_week to 3 (Thursday)`);
  console.log(`      Class: ${updatedClass.class_name}`);
  console.log(`      New start_day_of_week: ${updatedClass.start_day_of_week}`);

  // Step 2: Get live_class_id
  console.log('\n2️⃣ Finding live_class...');
  let liveClassId = null;

  // Try by title
  const { data: liveClass, error: lcError } = await supabase
    .from('live_classes')
    .select('id')
    .eq('title', className)
    .eq('is_active', true)
    .single();

  if (liveClass) {
    liveClassId = liveClass.id;
    console.log(`   ✅ Found live_class: ${liveClassId}`);
  } else {
    console.error('   ❌ No active live_class found!');
    if (lcError) console.error('      Error:', lcError.message);
    process.exit(1);
  }

  // Step 3: Get next batch number
  console.log('\n3️⃣ Determining next batch number...');
  const { data: lastBatch, error: batchError } = await supabase
    .from('batches')
    .select('batch_number')
    .eq('live_class_id', liveClassId)
    .order('batch_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextBatchNumber = 1;
  if (!batchError && lastBatch) {
    nextBatchNumber = lastBatch.batch_number + 1;
  }
  console.log(`   ✅ Next batch number: ${nextBatchNumber}`);

  // Step 4: Create batch for today
  console.log('\n4️⃣ Creating batch for today...');
  const { data: newBatch, error: createError } = await supabase
    .from('batches')
    .insert({
      live_class_id: liveClassId,
      class_name: className,
      batch_number: nextBatchNumber,
      start_date: todayStr,
      start_day_of_week: 3, // Thursday
      status: 'active'
    })
    .select()
    .single();

  if (createError) {
    console.error('   ❌ Error creating batch:', createError.message);
    process.exit(1);
  }

  console.log(`   ✅ Created batch:`);
  console.log(`      - ID: ${newBatch.id}`);
  console.log(`      - Batch Number: ${newBatch.batch_number}`);
  console.log(`      - Start Date: ${newBatch.start_date}`);
  console.log(`      - Status: ${newBatch.status}`);

  // Step 5: Generate sessions for today
  console.log('\n5️⃣ Generating sessions for today...');
  
  const sessionTimes = {
    morning: { hour: 6, minute: 30, time: '06:30:00' },
    afternoon: { hour: 13, minute: 0, time: '13:00:00' },
    evening: { hour: 19, minute: 30, time: '19:30:00' }
  };

  // Get course videos if available
  let videos = [];
  if (updatedClass.course_id) {
    const { data: courseVideos } = await supabase
      .from('course_videos')
      .select('id, name, order_index')
      .eq('course_id', updatedClass.course_id)
      .order('order_index', { ascending: true });

    if (courseVideos && courseVideos.length > 0) {
      videos = courseVideos;
    }
  }

  // Session number is 1 for the first day
  const sessionNumber = 1;
  let videoId = null;
  let sessionTitle = `Class ${sessionNumber}`;

  if (videos.length > 0) {
    const videoIndex = sessionNumber - 1;
    if (videoIndex < videos.length) {
      videoId = videos[videoIndex].id;
      sessionTitle = videos[videoIndex].name || `Class ${sessionNumber}`;
    }
  }

  // Create 3 sessions for today
  const sessionsToCreate = [];
  for (const [sessionType, timeConfig] of Object.entries(sessionTimes)) {
    const scheduledTime = new Date(today);
    scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
    const scheduledDatetime = scheduledTime.toISOString();

    sessionsToCreate.push({
      batch_id: newBatch.id,
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
    console.error('   ❌ Error creating sessions:', insertError.message);
    process.exit(1);
  }

  console.log(`   ✅ Created ${sessionsToCreate.length} sessions:`);
  sessionsToCreate.forEach(session => {
    console.log(`      - ${session.session_type}: ${session.scheduled_time} (${session.session_title})`);
  });

  // Step 6: Verify
  console.log('\n6️⃣ Verifying fix...');
  const { data: verifyBatch } = await supabase
    .from('batches')
    .select('*, batch_class_sessions(count)')
    .eq('id', newBatch.id)
    .single();

  if (verifyBatch) {
    console.log(`   ✅ Batch verified:`);
    console.log(`      - Batch ${verifyBatch.batch_number} exists`);
    console.log(`      - Sessions: ${verifyBatch.batch_class_sessions?.[0]?.count || 0}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ FIX COMPLETE!');
  console.log(`\n📚 CPA MARKETING class is now configured to start on THURSDAY`);
  console.log(`📦 Batch ${nextBatchNumber} has been created for today (${todayStr})`);
  console.log(`📅 ${sessionsToCreate.length} sessions have been scheduled for today`);
  console.log('\n');
}

fixCPAMarketing().catch(console.error);
