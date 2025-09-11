-- Safe cleanup - only removes subscription data, keeps user profiles and course progress
-- This is safer than the full cleanup above

-- 1. Delete all subscription payments
DELETE FROM subscription_payments;

-- 2. Delete all user subscriptions  
DELETE FROM user_subscriptions;

-- 3. Verify cleanup
SELECT 
  'subscription_payments' as table_name, 
  COUNT(*) as remaining_records 
FROM subscription_payments
UNION ALL
SELECT 
  'user_subscriptions' as table_name, 
  COUNT(*) as remaining_records 
FROM user_subscriptions;

-- 4. Show current state
SELECT 'Safe cleanup completed - subscription data cleared, user profiles preserved' as status;
