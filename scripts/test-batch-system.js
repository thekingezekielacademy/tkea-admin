// Quick test script to check if system is working
// Run this to see what's happening

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function testSystem() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Make sure .env file has:');
    console.log('- REACT_APP_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();
  const dayOfWeek = today.getDay();

  console.log('🔍 QUICK SYSTEM CHECK');
  console.log('═'.repeat(60));
  console.log(`Today: ${today.toLocaleDateString()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]})`);

  // Check batches
  const { data: batches } = await supabase
    .from('batches')
    .select('class_name, batch_number, start_date')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(10);

  console.log(`\n📦 Active Batches: ${batches?.length || 0}`);
  batches?.forEach(b => console.log(`   - ${b.class_name} Batch ${b.batch_number} (${b.start_date})`));

  // Check today's sessions
  const todayStr = today.toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('batch_class_sessions')
    .select('class_name, session_number, scheduled_time, session_type')
    .eq('scheduled_date', todayStr)
    .order('scheduled_time');

  console.log(`\n📅 Today's Sessions: ${sessions?.length || 0}`);
  sessions?.forEach(s => console.log(`   - ${s.class_name} Class ${s.session_number} (${s.session_type}) at ${s.scheduled_time}`));

  // Expected class
  const dayMap = {1:'FREELANCING', 2:'INFORMATION MARKETING', 3:'YOUTUBE', 4:'EBOOKS', 5:'CPA MARKETING'};
  const expected = dayMap[dayOfWeek];
  console.log(`\n🎯 Expected Class Today: ${expected || 'None (weekend)'}`);

  if (!batches || batches.length === 0) {
    console.log('\n⚠️  NO BATCHES FOUND!');
    console.log('💡 Run: POST /api/cron/create-batch (or use kickstart)');
  }

  if (!sessions || sessions.length === 0) {
    console.log('\n⚠️  NO SESSIONS FOUND FOR TODAY!');
    console.log('💡 Run: POST /api/cron/generate-batch-sessions');
  }

  console.log('\n' + '═'.repeat(60));
}

testSystem().catch(console.error);
