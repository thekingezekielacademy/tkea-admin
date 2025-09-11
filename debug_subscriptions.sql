-- Debug subscription data to understand what's in the database

-- 1. Check all subscription records (any status)
SELECT 
  id,
  user_id,
  status,
  plan_name,
  amount,
  created_at
FROM user_subscriptions 
ORDER BY created_at DESC;

-- 2. Check active subscriptions only
SELECT 
  id,
  user_id,
  status,
  plan_name,
  amount,
  created_at
FROM user_subscriptions 
WHERE status = 'active'
ORDER BY created_at DESC;

-- 3. Count by status
SELECT 
  status,
  COUNT(*) as count
FROM user_subscriptions 
GROUP BY status
ORDER BY count DESC;

-- 4. Count unique users by status
SELECT 
  status,
  COUNT(DISTINCT user_id) as unique_users
FROM user_subscriptions 
GROUP BY status
ORDER BY unique_users DESC;

-- 5. Check if there are any subscriptions with different statuses
SELECT DISTINCT status FROM user_subscriptions;
