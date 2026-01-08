-- Verification script for RLS circular dependency fix
-- Run this in Supabase SQL Editor to verify the migration was applied correctly

-- 1. Verify is_admin() function exists and has SECURITY DEFINER
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'is_admin' 
  AND routine_schema = 'public';

-- 2. Check that profiles policies now use is_admin() function
SELECT 
  tablename,
  policyname,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
  AND policyname LIKE '%Admin%'
ORDER BY policyname;

-- 3. Verify the policies don't have direct profiles queries (should show is_admin() calls)
-- Look for policies that should NOT contain "FROM profiles" in their USING clause
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%is_admin%' THEN '✅ Using is_admin() function'
    WHEN qual LIKE '%FROM profiles%' THEN '❌ Still has circular dependency!'
    ELSE '⚠️ Check manually'
  END as status,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'courses', 'lessons', 'live_classes', 'class_sessions')
  AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- 4. Test is_admin() function (replace with your user ID)
-- This should return true/false without timing out
SELECT is_admin('61ef5b9a-846c-46c7-b417-bbe753a64f26'::uuid) as is_user_admin;

-- 5. Check all admin-related policies across tables
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%is_admin%' THEN '✅ Fixed'
    WHEN qual LIKE '%FROM profiles%' THEN '❌ Needs fix'
    ELSE 'N/A'
  END as fix_status
FROM pg_policies 
WHERE policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

