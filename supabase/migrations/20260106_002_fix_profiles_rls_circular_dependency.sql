-- Fix circular dependency in profiles RLS policies
-- Problem: Admin policies query profiles table directly, causing infinite recursion
-- Solution: Use is_admin() SECURITY DEFINER function which bypasses RLS

BEGIN;

-- Ensure is_admin function exists and properly bypasses RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER runs with function owner privileges, bypassing RLS
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- Drop and recreate profiles policies to use is_admin() function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Use is_admin() function instead of direct profiles query to avoid circular dependency
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Also fix other tables that have the same circular dependency issue
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete course covers" ON storage.objects;
CREATE POLICY "Admins can delete course covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-covers'
    AND is_admin(auth.uid())
  );

-- Fix live_classes and class_sessions policies (from the recent migration)
DROP POLICY IF EXISTS "Admins can manage live classes" ON live_classes;
CREATE POLICY "Admins can manage live classes"
ON live_classes
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage class sessions" ON class_sessions;
CREATE POLICY "Admins can manage class sessions"
ON class_sessions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

COMMIT;

