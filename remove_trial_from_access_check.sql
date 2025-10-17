-- =====================================================
-- TRIAL REMOVAL: Update Database Access Function
-- =====================================================
-- This script removes trial checking logic from the 
-- check_course_access() function.
--
-- HOW TO RUN:
-- 1. Go to your Supabase project dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire script
-- 5. Click "Run" or press Cmd/Ctrl + Enter
-- =====================================================

-- Drop and recreate the check_course_access function without trial logic
CREATE OR REPLACE FUNCTION check_course_access(user_uuid UUID, course_uuid TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  course_access_type TEXT;
  has_subscription BOOLEAN;
BEGIN
  -- Check if course is free
  SELECT access_type INTO course_access_type FROM courses WHERE id = course_uuid;
  
  IF course_access_type = 'free' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = user_uuid 
      AND status = 'active'
      AND (next_payment_date > NOW() OR next_payment_date IS NULL)
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test the function (replace with actual UUIDs from your database)
-- SELECT check_course_access('your-user-uuid', 'your-course-uuid');

-- Expected behavior:
-- - Returns TRUE for free courses (access_type = 'free')
-- - Returns TRUE for users with active subscriptions
-- - Returns FALSE for users without subscriptions trying to access membership courses

-- =====================================================
-- NOTES
-- =====================================================
-- Changes made:
-- 1. Removed has_trial variable declaration
-- 2. Removed trial check query (lines that checked user_trials table)
-- 3. Removed IF has_trial THEN RETURN TRUE block
-- 4. Updated subscription check to use 'status' column (not 'is_active')
-- 5. Function now only checks:
--    a. Is the course free? → Grant access
--    b. Does user have active subscription (status = 'active')? → Grant access
--    c. Otherwise → Deny access
--
-- The user_trials table still exists but is no longer used
-- You can optionally drop it later if you want:
-- DROP TABLE IF EXISTS user_trials CASCADE;
-- =====================================================

