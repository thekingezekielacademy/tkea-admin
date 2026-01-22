const { createClient } = require('@supabase/supabase-js');

async function verify() {
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

  console.log('✅ FINAL VERIFICATION\n');
  console.log('='.repeat(60));

  // Check configuration
  const { data: batchClass } = await supabase
    .from('batch_classes')
    .select('*')
    .eq('class_name', className)
    .single();

  console.log('\n📋 Configuration:');
  console.log(`   ✅ start_day_of_week: ${batchClass.start_day_of_week} (${batchClass.start_day_of_week === 3 ? 'Thursday ✓' : 'WRONG'})`);
  console.log(`   ✅ is_active: ${batchClass.is_active}`);

  // Check batches
  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .eq('class_name', className)
    .order('batch_number', { ascending: false });

  console.log('\n📦 Batches:');
  if (batches && batches.length > 0) {
    batches.forEach(b => {
      console.log(`   ✅ Batch ${b.batch_number}: ${b.start_date} (${b.status})`);
    });
  } else {
    console.log('   ❌ No batches found');
  }

  // Check today's sessions
  if (batches && batches.length > 0) {
    const latestBatch = batches[0];
    const { data: sessions } = await supabase
      .from('batch_class_sessions')
      .select('*')
      .eq('batch_id', latestBatch.id)
      .eq('scheduled_date', todayStr)
      .order('scheduled_time', { ascending: true });

    console.log(`\n📚 Sessions for today (${todayStr}):`);
    if (sessions && sessions.length > 0) {
      sessions.forEach(s => {
        console.log(`   ✅ ${s.session_type}: ${s.scheduled_time} - ${s.session_title} (${s.status})`);
      });
    } else {
      // Check all sessions to see what dates exist
      const { data: allSessions } = await supabase
        .from('batch_class_sessions')
        .select('scheduled_date, session_type, scheduled_time')
        .eq('batch_id', latestBatch.id)
        .order('scheduled_date', { ascending: true })
        .limit(10);

      console.log(`   ⚠️  No sessions for today, but found sessions on:`);
      if (allSessions) {
        const dates = [...new Set(allSessions.map(s => s.scheduled_date))];
        dates.forEach(d => console.log(`      - ${d}`));
      }
    }
  }

  // Check upcoming sessions
  const { data: upcomingSessions } = await supabase
    .from('batch_class_sessions')
    .select('scheduled_date, scheduled_time, session_type, session_title')
    .eq('class_name', className)
    .gte('scheduled_date', todayStr)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(5);

  console.log('\n🔮 Upcoming sessions:');
  if (upcomingSessions && upcomingSessions.length > 0) {
    upcomingSessions.forEach(s => {
      console.log(`   📅 ${s.scheduled_date} ${s.scheduled_time} - ${s.session_type}: ${s.session_title}`);
    });
  } else {
    console.log('   ⚠️  No upcoming sessions found');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICATION COMPLETE\n');
}

verify().catch(console.error);
