-- Test script to check payment data access and RLS policies

-- 1. Check if there are any RLS policies on subscription_payments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscription_payments';

-- 2. Check if RLS is enabled on subscription_payments
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'subscription_payments';

-- 3. Check all payment records (as superuser/admin)
SELECT 
  id,
  user_id,
  status,
  amount,
  paid_at,
  created_at
FROM subscription_payments 
ORDER BY created_at DESC;

-- 4. Check payment records by status
SELECT 
  status,
  COUNT(*) as count
FROM subscription_payments 
GROUP BY status;

-- 5. Check if there are any constraints or issues
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subscription_payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
