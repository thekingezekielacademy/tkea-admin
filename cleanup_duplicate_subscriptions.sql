-- Clean up duplicate subscription records
-- This script will keep only the most recent subscription for each user

-- First, let's see what we have
SELECT 
  user_id, 
  COUNT(*) as subscription_count,
  array_agg(id) as subscription_ids,
  array_agg(created_at) as created_dates
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY subscription_count DESC;

-- Delete duplicate subscriptions, keeping only the most recent one for each user
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_subscriptions 
  WHERE status = 'active'
)
DELETE FROM user_subscriptions 
WHERE id IN (
  SELECT id 
  FROM ranked_subscriptions 
  WHERE rn > 1
);

-- Verify the cleanup
SELECT 
  user_id, 
  COUNT(*) as subscription_count,
  array_agg(id) as subscription_ids
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY user_id
ORDER BY subscription_count DESC;
