-- Manual subscription activation for theisraelolayemi@gmail.com
-- This script will:
-- 1. Check if user exists
-- 2. Check current subscription status
-- 3. Create active subscription if needed
-- 4. Add payment history

-- Step 1: Check if user exists
SELECT 'User Check' as step, id, email, name, created_at 
FROM profiles 
WHERE email = 'theisraelolayemi@gmail.com';

-- Step 2: Check current subscription status
SELECT 'Current Subscriptions' as step, 
       us.id, 
       us.user_id, 
       us.status, 
       us.plan_name, 
       us.amount, 
       us.created_at,
       p.email
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY us.created_at DESC;

-- Step 3: Check current payment history
SELECT 'Payment History' as step,
       sp.id,
       sp.user_id,
       sp.amount,
       sp.status,
       sp.paid_at,
       sp.created_at,
       p.email
FROM subscription_payments sp
JOIN profiles p ON sp.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY sp.created_at DESC;

-- Step 4: Create active subscription (if user exists and no active subscription)
-- First, get the user_id
WITH user_data AS (
  SELECT id as user_id FROM profiles WHERE email = 'theisraelolayemi@gmail.com'
),
existing_subscription AS (
  SELECT COUNT(*) as count FROM user_subscriptions us
  JOIN user_data ud ON us.user_id = ud.user_id
  WHERE us.status = 'active'
)
INSERT INTO user_subscriptions (
  user_id,
  email,
  plan_name,
  status,
  amount,
  currency,
  start_date,
  next_payment_date,
  created_at,
  updated_at
)
SELECT 
  ud.user_id,
  'theisraelolayemi@gmail.com',
  'Monthly Membership',
  'active',
  250000, -- 2500 NGN in kobo
  'NGN',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
FROM user_data ud
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions us 
  WHERE us.user_id = ud.user_id AND us.status = 'active'
);

-- Step 5: Add payment history (if subscription was created)
WITH user_data AS (
  SELECT id as user_id FROM profiles WHERE email = 'theisraelolayemi@gmail.com'
)
INSERT INTO subscription_payments (
  user_id,
  paystack_reference,
  amount,
  currency,
  status,
  payment_method,
  paid_at,
  created_at
)
SELECT 
  ud.user_id,
  'MANUAL_' || EXTRACT(EPOCH FROM NOW())::TEXT, -- Generate manual reference
  250000, -- 2500 NGN in kobo
  'NGN',
  'success',
  'manual',
  NOW(),
  NOW()
FROM user_data ud
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_payments sp 
  WHERE sp.user_id = ud.user_id 
  AND sp.paystack_reference LIKE 'MANUAL_%'
  AND sp.created_at > NOW() - INTERVAL '1 hour'
);

-- Step 6: Verify the changes
SELECT 'Final Verification' as step,
       us.id as subscription_id,
       us.user_id,
       us.status,
       us.plan_name,
       us.amount,
       us.created_at,
       p.email,
       p.name
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY us.created_at DESC;

SELECT 'Payment Verification' as step,
       sp.id as payment_id,
       sp.user_id,
       sp.amount,
       sp.status,
       sp.paid_at,
       p.email
FROM subscription_payments sp
JOIN profiles p ON sp.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY sp.created_at DESC;
