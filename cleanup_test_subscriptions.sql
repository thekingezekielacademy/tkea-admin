-- Clean up test subscription data for live Flutterwave testing
-- This will remove all test subscriptions and payments

-- 1. Delete all test subscription payments
DELETE FROM subscription_payments;

-- 2. Delete all test user subscriptions
DELETE FROM user_subscriptions;

-- 3. Reset any user trial data (optional - uncomment if needed)
-- DELETE FROM user_trials;

-- 4. Reset any user achievements (optional - uncomment if needed)
-- DELETE FROM user_achievements;

-- 5. Reset any user course progress (optional - uncomment if needed)
-- DELETE FROM user_courses;

-- 6. Verify cleanup
SELECT 'subscription_payments' as table_name, COUNT(*) as remaining_records FROM subscription_payments
UNION ALL
SELECT 'user_subscriptions' as table_name, COUNT(*) as remaining_records FROM user_subscriptions
UNION ALL
SELECT 'user_trials' as table_name, COUNT(*) as remaining_records FROM user_trials
UNION ALL
SELECT 'user_achievements' as table_name, COUNT(*) as remaining_records FROM user_achievements
UNION ALL
SELECT 'user_courses' as table_name, COUNT(*) as remaining_records FROM user_courses;

-- 7. Show current state
SELECT 'Cleanup completed - ready for live Flutterwave testing' as status;
