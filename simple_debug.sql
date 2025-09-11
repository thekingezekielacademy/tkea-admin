-- Simple debug script to check subscription data

-- 1. Check total subscriptions
SELECT 'Total subscriptions' as description, COUNT(*) as count FROM user_subscriptions;

-- 2. Check subscriptions by status
SELECT 'By status' as description, status, COUNT(*) as count 
FROM user_subscriptions 
GROUP BY status;

-- 3. Check subscription_payments table
SELECT 'subscription_payments' as table_name, COUNT(*) as count FROM subscription_payments;

-- 4. Check user_trials table
SELECT 'user_trials' as table_name, COUNT(*) as count FROM user_trials;

-- 5. Check all user_subscriptions records
SELECT id, user_id, status, plan_name, amount, created_at 
FROM user_subscriptions 
ORDER BY created_at DESC;

-- 6. Check all subscription_payments records
SELECT id, user_id, amount, status, paid_at, created_at 
FROM subscription_payments 
ORDER BY created_at DESC;
