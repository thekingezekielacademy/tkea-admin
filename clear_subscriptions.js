// Clear all existing subscriptions for Flutterwave testing
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllSubscriptions() {
  try {
    console.log('🧹 Starting to clear all existing subscriptions...');
    
    // Clear user_subscriptions table
    console.log('📋 Clearing user_subscriptions table...');
    const { data: subData, error: subError } = await supabase
      .from('user_subscriptions')
      .delete()
      .neq('id', 0); // This will delete all records
    
    if (subError) {
      console.error('❌ Error clearing user_subscriptions:', subError);
    } else {
      console.log('✅ User subscriptions cleared successfully');
    }
    
    // Clear subscription_payments table
    console.log('💳 Clearing subscription_payments table...');
    const { data: paymentData, error: paymentError } = await supabase
      .from('subscription_payments')
      .delete()
      .neq('id', 0); // This will delete all records
    
    if (paymentError) {
      console.error('❌ Error clearing subscription_payments:', paymentError);
    } else {
      console.log('✅ Subscription payments cleared successfully');
    }
    
    // Clear any local storage subscriptions
    console.log('🗑️ Clearing local storage...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('subscription_active');
      localStorage.removeItem('subscription_id');
      localStorage.removeItem('subscription_ref');
      localStorage.removeItem('subscription_amount');
      localStorage.removeItem('subscription_currency');
      localStorage.removeItem('subscription_next_renewal');
    }
    
    console.log('🎉 All subscription data cleared successfully!');
    console.log('✅ Ready for Flutterwave testing!');
    
  } catch (error) {
    console.error('💥 Error clearing subscriptions:', error);
  }
}

// Run the function
clearAllSubscriptions();
