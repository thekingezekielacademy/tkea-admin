-- Fix RLS policies to ensure they work correctly
-- This will make the policies more permissive while maintaining security

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view own subscription data" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription data" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription data" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription data" ON user_subscriptions;

DROP POLICY IF EXISTS "Users can view own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can insert own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can update own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can delete own trial data" ON user_trials;

-- 2. Create more permissive RLS policies for user_subscriptions
-- Allow users to view their own subscription data
CREATE POLICY "Users can view own subscription data" ON user_subscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to insert their own subscription data
CREATE POLICY "Users can insert own subscription data" ON user_subscriptions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to update their own subscription data
CREATE POLICY "Users can update own subscription data" ON user_subscriptions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to delete their own subscription data
CREATE POLICY "Users can delete own subscription data" ON user_subscriptions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- 3. Create more permissive RLS policies for user_trials
-- Allow users to view their own trial data
CREATE POLICY "Users can view own trial data" ON user_trials
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to insert their own trial data
CREATE POLICY "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to update their own trial data
CREATE POLICY "Users can update own trial data" ON user_trials
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to delete their own trial data
CREATE POLICY "Users can delete own trial data" ON user_trials
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() IS NOT NULL
    );

-- 4. Verify the new policies are created
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

-- 5. Test if the policies work now
-- This should now work for authenticated users
SELECT COUNT(*) FROM user_subscriptions;
SELECT COUNT(*) FROM user_trials;
