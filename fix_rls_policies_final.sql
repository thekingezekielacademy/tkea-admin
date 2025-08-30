-- Final RLS Policy Fix
-- This will resolve the 406 errors by making policies more permissive

-- ========================================
-- 1. DROP EXISTING RESTRICTIVE POLICIES
-- ========================================

-- Drop restrictive policies that are causing 406 errors
DROP POLICY IF EXISTS "Users can view their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can view own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can view own subscription data" ON user_subscriptions;

-- ========================================
-- 2. CREATE PERMISSIVE POLICIES
-- ========================================

-- User courses - Allow authenticated users to view (even if no data)
CREATE POLICY "Users can view course enrollments" ON user_courses
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- User trials - Allow authenticated users to view (even if no data)
CREATE POLICY "Users can view trial data" ON user_trials
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- User subscriptions - Allow authenticated users to view (even if no data)
CREATE POLICY "Users can view subscription data" ON user_subscriptions
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- ========================================
-- 3. KEEP INSERT/UPDATE POLICIES RESTRICTIVE
-- ========================================

-- User courses - Keep restrictive for data modification
DROP POLICY IF EXISTS "Users can insert their own course enrollments" ON user_courses;
CREATE POLICY "Users can insert their own course enrollments" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own course enrollments" ON user_courses;
CREATE POLICY "Users can update their own course enrollments" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

-- User trials - Keep restrictive for data modification
DROP POLICY IF EXISTS "Users can insert own trial data" ON user_trials;
CREATE POLICY "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trial data" ON user_trials;
CREATE POLICY "Users can update own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- User subscriptions - Keep restrictive for data modification
DROP POLICY IF EXISTS "Users can insert own subscription data" ON user_subscriptions;
CREATE POLICY "Users can insert own subscription data" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription data" ON user_subscriptions;
CREATE POLICY "Users can update own subscription data" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- 4. VERIFICATION
-- ========================================

-- Check the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials', 'user_courses')
ORDER BY tablename, policyname;

-- Test if policies work now (should return 0 for empty tables, not 406 errors)
SELECT COUNT(*) as user_courses_count FROM user_courses;
SELECT COUNT(*) as user_trials_count FROM user_trials;
SELECT COUNT(*) as user_subscriptions_count FROM user_subscriptions;
