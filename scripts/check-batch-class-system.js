const { createClient } = require('@supabase/supabase-js');

async function checkSystem() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
  
  console.log('🔍 BATCH CLASS SYSTEM DIAGNOSTICS');
  console.log('═'.repeat(60));
  console.log(`Today: ${today.toLocaleDateString()} (Day of week: ${dayOfWeek})`);
  console.log('═'.repeat(60));

  // 1. Check batch_classes
  console.log('\n1️⃣ Checking batch_classes...');
  const { data: batchClasses, error: bcError } = await supabase
    .from('batch_classes')
    .select('*')
    .eq('is_active', true);

  if (bcError) {
    console.error('❌ Error:', bcError);
  } else {
    console.log(`✅ Found ${batchClasses?.length || 0} active batch classes`);
    batchClasses?.forEach(bc => {
      console.log(`   - ${bc.class_name} (Starts: Day ${bc.start_day_of_week})`);
    });
  }

  // 2. Check live_classes
  console.log('\n2️⃣ Checking live_classes...');
  const { data: liveClasses, error: lcError } = await supabase
    .from('live_classes')
    .select('id, title, course_id, is_active')
    .eq('is_active', true);

  if (lcError) {
    console.error('❌ Error:', lcError);
  } else {
    console.log(`✅ Found ${liveClasses?.length || 0} active live_classes`);
    // Check if we have live_classes for batch classes
    const batchClassNames = batchClasses?.map(bc => bc.class_name) || [];
    const matchingLiveClasses = liveClasses?.filter(lc => 
      batchClassNames.includes(lc.title) || 
      (lc.course_id && batchClasses?.some(bc => bc.course_id === lc.course_id))
    ) || [];
    console.log(`   - ${matchingLiveClasses.length} live_classes match batch classes`);
    if (matchingLiveClasses.length < 5) {
      console.log('   ⚠️  WARNING: Need live_classes for all 5 batch classes!');
    }
  }

  // 3. Check batches
  console.log('\n3️⃣ Checking batches...');
  const { data: batches, error: batchesError } = await supabase
    .from('batches')
    .select('id, class_name, batch_number, start_date, status, live_class_id')
    .eq('status', 'active')
    .order('start_date', { ascending: false });

  if (batchesError) {
    console.error('❌ Error:', batchesError);
  } else {
    console.log(`✅ Found ${batches?.length || 0} active batches`);
    batches?.forEach(b => {
      console.log(`   - ${b.class_name} Batch ${b.batch_number} (Started: ${b.start_date})`);
    });
    if (batches?.length === 0) {
      console.log('   ⚠️  WARNING: No batches found! Batches need to be created.');
    }
  }

  // 4. Check today's sessions
  console.log('\n4️⃣ Checking today\'s sessions...');
  const todayDateStr = today.toISOString().split('T')[0];
  const { data: todaySessions, error: sessionsError } = await supabase
    .from('batch_class_sessions')
    .select('id, class_name, session_number, session_title, scheduled_datetime, session_type, status')
    .eq('scheduled_date', todayDateStr)
    .order('scheduled_datetime');

  if (sessionsError) {
    console.error('❌ Error:', sessionsError);
  } else {
    console.log(`✅ Found ${todaySessions?.length || 0} sessions scheduled for today`);
    if (todaySessions && todaySessions.length > 0) {
      todaySessions.forEach(s => {
        console.log(`   - ${s.class_name} Class ${s.session_number} (${s.session_type}) at ${new Date(s.scheduled_datetime).toLocaleTimeString()}`);
      });
    } else {
      console.log('   ⚠️  WARNING: No sessions found for today!');
    }
  }

  // 5. Check upcoming sessions (next 7 days)
  console.log('\n5️⃣ Checking upcoming sessions (next 7 days)...');
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 7);
  const { data: upcomingSessions, error: upcomingError } = await supabase
    .from('batch_class_sessions')
    .select('id, class_name, session_number, scheduled_datetime')
    .gte('scheduled_datetime', today.toISOString())
    .lte('scheduled_datetime', futureDate.toISOString())
    .order('scheduled_datetime');

  if (upcomingError) {
    console.error('❌ Error:', upcomingError);
  } else {
    console.log(`✅ Found ${upcomingSessions?.length || 0} upcoming sessions in next 7 days`);
  }

  // 6. Check notifications
  console.log('\n6️⃣ Checking notifications...');
  const { data: notifications, error: notifError } = await supabase
    .from('batch_class_notifications')
    .select('id, notification_type, status, scheduled_send_time, sent_at')
    .order('scheduled_send_time', { ascending: false })
    .limit(20);

  if (notifError) {
    console.error('❌ Error:', notifError);
  } else {
    console.log(`✅ Found ${notifications?.length || 0} recent notifications`);
    const pending = notifications?.filter(n => n.status === 'pending') || [];
    const sent = notifications?.filter(n => n.status === 'sent') || [];
    const failed = notifications?.filter(n => n.status === 'failed') || [];
    console.log(`   - Pending: ${pending.length}`);
    console.log(`   - Sent: ${sent.length}`);
    console.log(`   - Failed: ${failed.length}`);
    
    if (pending.length > 0) {
      console.log('\n   Pending notifications:');
      pending.slice(0, 5).forEach(n => {
        console.log(`   - ${n.notification_type} scheduled for ${new Date(n.scheduled_send_time).toLocaleString()}`);
      });
    }
  }

  // 7. Check what class should start today
  console.log('\n7️⃣ Expected class for today...');
  const dayMapping = {
    1: 'FREELANCING - THE UNTAPPED MARKET', // Monday
    2: 'INFORMATION MARKETING: THE INFINITE CASH LOOP', // Tuesday
    3: 'YOUTUBE MONETIZATION: From Setup To Monetization', // Wednesday
    4: 'EARN 500K SIDE INCOME SELLING EBOOKS', // Thursday
    5: 'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE' // Friday
  };
  const expectedClass = dayMapping[dayOfWeek];
  if (expectedClass) {
    console.log(`✅ Expected class today: ${expectedClass}`);
    const hasBatch = batches?.some(b => b.class_name === expectedClass);
    if (hasBatch) {
      console.log(`   ✅ Batch exists for this class`);
    } else {
      console.log(`   ⚠️  WARNING: No batch found for ${expectedClass}!`);
      console.log(`   💡 Run: POST /api/cron/create-batch`);
    }
  } else {
    console.log(`ℹ️  No class scheduled for today (${dayOfWeek === 0 ? 'Sunday' : 'Saturday'})`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Diagnostics complete!');
  console.log('═'.repeat(60));
}

checkSystem().catch(console.error);
