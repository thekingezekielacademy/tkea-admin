-- Test RLS policies to see why users can't access their own data
-- Run this in Supabase SQL Editor

-- 1. Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '61ef5b9a-846c-46c7-b417-bbe753a64f26';

-- 2. Check if there are any subscription records for this user
SELECT * FROM user_subscriptions 
WHERE user_id = '61ef5b9a-846c-46c7-b417-bbe753a64f26';

-- 3. Check if there are any trial records for this user
SELECT * FROM user_trials 
WHERE user_id = '61ef5b9a-846c-46c7-b417-bbe753a64f26';

-- 4. Test RLS policies by checking current user context
SELECT current_user, session_user, auth.uid();

-- 5. Check if RLS policies exist and are correct
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
WHERE tablename IN ('user_subscriptions', 'user_trials');

-- 6. Check if tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_subscriptions', 'user_trials');

-- 7. Test a simple query to see what error we get
SELECT COUNT(*) FROM user_subscriptions;
