-- Clear all existing subscriptions for Flutterwave testing
-- Run this in your Supabase SQL Editor

-- Clear user_subscriptions table
DELETE FROM user_subscriptions;

-- Clear subscription_payments table  
DELETE FROM subscription_payments;

-- Optional: Reset any user subscription status
UPDATE profiles 
SET subscription_active = false 
WHERE subscription_active = true;

-- Verify the tables are empty
SELECT 'user_subscriptions' as table_name, COUNT(*) as record_count FROM user_subscriptions
UNION ALL
SELECT 'subscription_payments' as table_name, COUNT(*) as record_count FROM subscription_payments;
