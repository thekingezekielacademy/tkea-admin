-- Comprehensive debug to understand what happened to the subscription data

-- 1. Check if there are any subscriptions at all (any status)
SELECT 
  'Total subscriptions' as description,
  COUNT(*) as count
FROM user_subscriptions;

-- 2. Check subscriptions by status
SELECT 
  'By status' as description,
  status,
  COUNT(*) as count
FROM user_subscriptions 
GROUP BY status;

-- 3. Check if there are any subscriptions in other tables
SELECT 
  'subscription_payments' as table_name,
  COUNT(*) as count
FROM subscription_payments;

-- 4. Check if there are any user_trials
SELECT 
  'user_trials' as table_name,
  COUNT(*) as count
FROM user_trials;

-- 5. Check the structure of profiles table first
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check all columns in user_subscriptions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check if there are any soft-deleted records (if there's a deleted_at column)
SELECT 
  'Soft deleted subscriptions' as description,
  COUNT(*) as count
FROM user_subscriptions 
WHERE deleted_at IS NOT NULL;

-- 8. Check recent activity in user_subscriptions
SELECT 
  'Recent activity' as description,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM user_subscriptions;
