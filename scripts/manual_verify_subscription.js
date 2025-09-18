#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MTQ1NSwiZXhwIjoyMDcwMjQ3NDU1fQ.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/manual_verify_subscription.js <email>');
    process.exit(1);
  }

  console.log(`🔎 Verifying user by email: ${email}`);

  let { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if ((userError && userError.code === 'PGRST116') || !user) {
    // Try case-insensitive match as fallback
    const { data: user2, error: userError2 } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', email)
      .single();
    user = user2;
    userError = userError2;
  }

  if (userError || !user) {
    console.error('❌ User not found for email:', email, userError?.message || userError);
    process.exit(1);
  }

  console.log('👤 User:', user.id, user.email);

  // Check existing active subscription
  const { data: existing, error: existingErr } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.warn('⚠️ Error checking existing subscription:', existingErr.message || existingErr);
  }

  if (existing) {
    console.log('✅ User already has an active subscription:', existing.id);
    console.log(existing);
    process.exit(0);
  }

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const manualRef = `MANUAL_${now.getTime()}`;

  const amountKobo = 250000; // ₦2500 default
  const planName = 'Monthly Membership';

  // Insert subscription
  const { data: subscription, error: subErr } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      paystack_subscription_id: manualRef,
      paystack_customer_code: user.id,
      plan_name: planName,
      status: 'active',
      amount: amountKobo,
      currency: 'NGN',
      start_date: now.toISOString(),
      next_payment_date: nextMonth.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .select()
    .single();

  if (subErr) {
    console.error('❌ Failed to create subscription:', subErr.message || subErr);
    process.exit(1);
  }

  console.log('✅ Created subscription:', subscription.id);

  // Insert a payment record
  const { error: payErr } = await supabase
    .from('subscription_payments')
    .insert({
      user_id: user.id,
      paystack_transaction_id: manualRef,
      paystack_reference: manualRef,
      amount: amountKobo,
      currency: 'NGN',
      status: 'success',
      payment_method: 'card',
      paid_at: now.toISOString(),
      created_at: now.toISOString()
    });

  if (payErr) {
    console.warn('⚠️ Failed to create payment record:', payErr.message || payErr);
  } else {
    console.log('✅ Created payment record');
  }

  console.log('🎉 Manual verification complete.');
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});


