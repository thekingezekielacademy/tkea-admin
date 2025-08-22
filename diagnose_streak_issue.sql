-- Diagnostic script to identify streak function issues
-- Run this in your Supabase SQL Editor to troubleshoot

-- 1. Check if profiles table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('xp', 'streak_count', 'last_activity_date')
ORDER BY ordinal_position;

-- 2. Check if the function exists
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_user_xp_and_streak';

-- 3. Check if there are any syntax errors in existing functions
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%IF%' 
  AND routine_definition LIKE '%last_activity%';

-- 4. Test basic date arithmetic
SELECT 
  CURRENT_DATE as today,
  CURRENT_DATE - INTERVAL '1 day' as yesterday,
  CURRENT_DATE - INTERVAL '2 days' as day_before_yesterday;

-- 5. Check if profiles table has any data
SELECT 
  COUNT(*) as total_profiles,
  COUNT(xp) as profiles_with_xp,
  COUNT(streak_count) as profiles_with_streak,
  COUNT(last_activity_date) as profiles_with_activity_date
FROM profiles;

-- 6. Check for any existing streak data
SELECT 
  id,
  xp,
  streak_count,
  last_activity_date,
  created_at
FROM profiles 
WHERE streak_count > 0 OR xp > 0
LIMIT 5;
