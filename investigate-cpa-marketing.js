const { createClient } = require('@supabase/supabase-js');

async function investigate() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const className = 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE';
  
  console.log('🔍 INVESTIGATING CPA MARKETING CLASS START ISSUE\n');
  console.log('='.repeat(60));

  // 1. Check current date and day of week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  console.log('\n📅 CURRENT DATE INFO:');
  console.log(`   Today: ${today.toISOString().split('T')[0]}`);
  console.log(`   Day of Week: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
  console.log(`   UTC Time: ${today.toISOString()}`);

  // 2. Check batch_classes configuration
  console.log('\n📋 BATCH_CLASSES CONFIGURATION:');
  const { data: batchClass, error: bcError } = await supabase
    .from('batch_classes')
    .select('*')
    .eq('class_name', className)
    .single();

  if (bcError) {
    console.error('   ❌ Error:', bcError.message);
  } else if (!batchClass) {
    console.error('   ❌ Class not found in batch_classes table!');
  } else {
    console.log(`   ✅ Class found:`);
    console.log(`      - ID: ${batchClass.id}`);
    console.log(`      - Name: ${batchClass.class_name}`);
    console.log(`      - Start Day of Week: ${batchClass.start_day_of_week} (${dayNames[batchClass.start_day_of_week === 0 ? 7 : batchClass.start_day_of_week + 1]})`);
    console.log(`      - Is Active: ${batchClass.is_active}`);
    console.log(`      - Course ID: ${batchClass.course_id || 'NULL'}`);
    console.log(`      - Total Sessions: ${batchClass.total_sessions || 0}`);
    
    // Check if configuration matches expectation
    const expectedDay = 3; // Thursday (0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday)
    if (batchClass.start_day_of_week !== expectedDay) {
      console.log(`   ⚠️  MISMATCH: Database says day ${batchClass.start_day_of_week} (${dayNames[batchClass.start_day_of_week === 0 ? 7 : batchClass.start_day_of_week + 1]}), but should be ${expectedDay} (Thursday)`);
    }
  }

  // 3. Check for live_class
  console.log('\n🎓 LIVE_CLASS STATUS:');
  let liveClassId = null;
  
  // Try by course_id first
  if (batchClass?.course_id) {
    const { data: liveClassByCourse, error: lcError1 } = await supabase
      .from('live_classes')
      .select('*')
      .eq('course_id', batchClass.course_id)
      .eq('is_active', true)
      .single();
    
    if (liveClassByCourse) {
      liveClassId = liveClassByCourse.id;
      console.log(`   ✅ Found by course_id:`);
      console.log(`      - ID: ${liveClassByCourse.id}`);
      console.log(`      - Title: ${liveClassByCourse.title || 'N/A'}`);
      console.log(`      - Is Active: ${liveClassByCourse.is_active}`);
      console.log(`      - Access Type: ${liveClassByCourse.access_type || 'N/A'}`);
    }
  }
  
  // Try by title
  if (!liveClassId) {
    const { data: liveClassByTitle, error: lcError2 } = await supabase
      .from('live_classes')
      .select('*')
      .eq('title', className)
      .eq('is_active', true)
      .single();
    
    if (liveClassByTitle) {
      liveClassId = liveClassByTitle.id;
      console.log(`   ✅ Found by title:`);
      console.log(`      - ID: ${liveClassByTitle.id}`);
      console.log(`      - Title: ${liveClassByTitle.title}`);
      console.log(`      - Is Active: ${liveClassByTitle.is_active}`);
      console.log(`      - Access Type: ${liveClassByTitle.access_type || 'N/A'}`);
    } else {
      console.log(`   ❌ No active live_class found for "${className}"`);
      if (lcError2) console.log(`      Error: ${lcError2.message}`);
    }
  }

  // 4. Check for batches
  console.log('\n📦 BATCHES STATUS:');
  const { data: batches, error: batchesError } = await supabase
    .from('batches')
    .select('*')
    .eq('class_name', className)
    .order('batch_number', { ascending: false })
    .limit(5);

  if (batchesError) {
    console.error('   ❌ Error:', batchesError.message);
  } else if (!batches || batches.length === 0) {
    console.log('   ❌ NO BATCHES FOUND!');
    console.log('   ⚠️  This is the problem - no batch was created.');
  } else {
    console.log(`   ✅ Found ${batches.length} batch(es):`);
    batches.forEach(batch => {
      const batchStartDate = new Date(batch.start_date);
      const batchStartDay = batchStartDate.getDay();
      console.log(`      Batch ${batch.batch_number}:`);
      console.log(`         - ID: ${batch.id}`);
      console.log(`         - Start Date: ${batch.start_date}`);
      console.log(`         - Start Day: ${dayNames[batchStartDay]} (${batchStartDay})`);
      console.log(`         - Status: ${batch.status}`);
      console.log(`         - Live Class ID: ${batch.live_class_id || 'NULL'}`);
      
      // Check if this batch should have started today
      const todayStr = today.toISOString().split('T')[0];
      if (batch.start_date === todayStr) {
        console.log(`         ✅ This batch starts TODAY!`);
      } else if (batch.start_date < todayStr) {
        const daysSinceStart = Math.floor((today.getTime() - batchStartDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`         ℹ️  Started ${daysSinceStart} day(s) ago`);
      } else {
        const daysUntilStart = Math.floor((batchStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`         ⏳ Starts in ${daysUntilStart} day(s)`);
      }
    });
  }

  // 5. Check for sessions today
  console.log('\n📚 SESSIONS FOR TODAY:');
  const todayStr = today.toISOString().split('T')[0];
  
  if (batches && batches.length > 0) {
    // Check sessions for the most recent batch
    const latestBatch = batches[0];
    const { data: sessions, error: sessionsError } = await supabase
      .from('batch_class_sessions')
      .select('*')
      .eq('batch_id', latestBatch.id)
      .eq('scheduled_date', todayStr)
      .order('scheduled_time', { ascending: true });

    if (sessionsError) {
      console.error('   ❌ Error:', sessionsError.message);
    } else if (!sessions || sessions.length === 0) {
      console.log(`   ❌ NO SESSIONS FOUND for today (${todayStr})!`);
      console.log(`   ⚠️  Sessions were not generated for today.`);
    } else {
      console.log(`   ✅ Found ${sessions.length} session(s) for today:`);
      sessions.forEach(session => {
        console.log(`      - ${session.session_type}: ${session.scheduled_time} (Class ${session.session_number})`);
        console.log(`        Status: ${session.status}`);
        console.log(`        Title: ${session.session_title || 'N/A'}`);
      });
    }
  } else {
    console.log('   ⚠️  Cannot check sessions - no batches exist');
  }

  // 6. Check cron job configuration
  console.log('\n⏰ CRON JOB CONFIGURATION:');
  console.log('   From vercel.json:');
  console.log('   - create-batch: "0 0 * * 1-5" (Mon-Fri at 00:00 UTC)');
  console.log('   - generate-batch-sessions: "0 0 * * *" (Daily at 00:00 UTC)');
  
  // Check if today is the expected day
  const expectedDayOfWeek = 4; // Thursday in JavaScript (0=Sunday, 1=Monday, ..., 4=Thursday)
  if (dayOfWeek === expectedDayOfWeek) {
    console.log(`   ✅ Today IS Thursday - batch should have been created!`);
  } else {
    console.log(`   ⚠️  Today is ${dayNames[dayOfWeek]}, not Thursday`);
  }

  // 7. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  
  const issues = [];
  if (!batchClass) {
    issues.push('❌ Class not found in batch_classes table');
  } else if (batchClass.start_day_of_week !== 3) {
    issues.push(`⚠️  start_day_of_week is ${batchClass.start_day_of_week} (should be 3 for Thursday)`);
  }
  
  if (!liveClassId) {
    issues.push('❌ No active live_class found');
  }
  
  if (!batches || batches.length === 0) {
    issues.push('❌ No batches exist - batch was never created');
  } else {
    const todayBatch = batches.find(b => b.start_date === todayStr);
    if (!todayBatch) {
      issues.push(`❌ No batch found starting today (${todayStr})`);
    }
  }
  
  if (batches && batches.length > 0) {
    const latestBatch = batches[0];
    const { data: todaySessions } = await supabase
      .from('batch_class_sessions')
      .select('id')
      .eq('batch_id', latestBatch.id)
      .eq('scheduled_date', todayStr)
      .limit(1);
    
    if (!todaySessions || todaySessions.length === 0) {
      issues.push(`❌ No sessions generated for today (${todayStr})`);
    }
  }

  if (issues.length === 0) {
    console.log('   ✅ Everything looks good!');
  } else {
    console.log('   Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  }

  console.log('\n');
}

investigate().catch(console.error);
