/**
 * Grant Subscription Access to Users
 * 
 * This script grants subscription access to users who subscribed before payment issues were fixed
 * 
 * Usage:
 * npx tsx scripts/grant-subscription-access.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
// These can be set as environment variables or passed directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users who need subscription access
const userEmails = [
  'enujiokeifeatu@gmail.com',
  'seyifunmielizabeth184@gmail.com'
];

// Default subscription values
const DEFAULT_PLAN_NAME = 'Monthly Membership';
const DEFAULT_AMOUNT = 250000; // 2500 NGN in kobo
const DEFAULT_CURRENCY = 'NGN';
const SUBSCRIPTION_DURATION_DAYS = 30; // 30 days subscription

async function grantSubscriptionAccess() {
  console.log('🚀 Starting subscription access grant...\n');

  try {
    for (const email of userEmails) {
      console.log(`📧 Processing user: ${email}`);

      // Find user by email in auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error(`❌ Error fetching users:`, authError);
        continue;
      }

      // Try exact match first
      let user = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      // If not found, try partial match (in case of typos)
      if (!user) {
        const emailParts = email.toLowerCase().split('@');
        const emailPrefix = emailParts[0];
        user = authUsers.users.find(u => {
          const userEmail = u.email?.toLowerCase();
          if (!userEmail) return false;
          const userEmailPrefix = userEmail.split('@')[0];
          return userEmailPrefix === emailPrefix || userEmail.includes(emailPrefix);
        });
        
        if (user) {
          console.log(`   ⚠️  Found similar email: ${user.email} (using this instead)`);
        }
      }

      if (!user) {
        console.error(`❌ User not found: ${email}`);
        // Try to find similar emails to help identify the correct one
        const searchTerm = email.toLowerCase().split('@')[0];
        const similarUsers = authUsers.users.filter(u => {
          const userEmail = u.email?.toLowerCase() || '';
          return userEmail.includes(searchTerm) || searchTerm.includes(userEmail.split('@')[0]);
        });
        
        if (similarUsers.length > 0) {
          console.log(`   💡 Found ${similarUsers.length} similar email(s):`);
          similarUsers.forEach(u => console.log(`      - ${u.email}`));
        }
        console.log('');
        continue;
      }

      console.log(`   ✅ Found user: ${user.id}`);

      // Check if user already has an active subscription
      const { data: existingSubscriptions, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (checkError) {
        console.error(`   ❌ Error checking existing subscriptions:`, checkError);
        continue;
      }

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        console.log(`   ⚠️  User already has an active subscription. Skipping...`);
        continue;
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATION_DAYS);
      const nextPaymentDate = new Date(endDate);

      // Generate a unique paystack_subscription_id (using timestamp + user id)
      const paystackSubscriptionId = `manual_${Date.now()}_${user.id.substring(0, 8)}`;

      // Create subscription record
      const { data: subscription, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          paystack_subscription_id: paystackSubscriptionId,
          paystack_customer_code: `manual_${user.id.substring(0, 8)}`,
          plan_name: DEFAULT_PLAN_NAME,
          status: 'active',
          amount: DEFAULT_AMOUNT,
          currency: DEFAULT_CURRENCY,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          next_payment_date: nextPaymentDate.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error(`   ❌ Error creating subscription:`, insertError);
        continue;
      }

      console.log(`   ✅ Subscription created successfully!`);
      console.log(`      Subscription ID: ${subscription.id}`);
      console.log(`      Status: ${subscription.status}`);
      console.log(`      End Date: ${endDate.toLocaleDateString()}`);
      console.log('');
    }

    console.log('✅ Subscription access grant complete!\n');

    // Verify the subscriptions
    console.log('🔍 Verifying subscriptions...\n');
    for (const email of userEmails) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const user = authUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (user) {
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (subscriptions && subscriptions.length > 0) {
          console.log(`✅ ${email}: Active subscription confirmed`);
        } else {
          console.log(`❌ ${email}: No active subscription found`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Grant subscription access failed:', error);
    process.exit(1);
  }
}

// Run the script
grantSubscriptionAccess();

