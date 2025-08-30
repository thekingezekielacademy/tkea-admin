-- Comprehensive RLS Policy Fix for user_subscriptions and user_trials
-- This script addresses the 406 errors by ensuring proper access policies

-- 1. First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials')
ORDER BY tablename, policyname;

-- 2. Drop all existing policies for these tables
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON user_subscriptions;

DROP POLICY IF EXISTS "Users can view their own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can insert their own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can update their own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can delete their own trials" ON user_trials;

-- 3. Create new, more permissive SELECT policies
-- For user_subscriptions: Allow authenticated users to view any subscription
CREATE POLICY "Authenticated users can view subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.role() = 'authenticated');

-- For user_trials: Allow authenticated users to view any trial
CREATE POLICY "Authenticated users can view trials" ON user_trials
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create INSERT policies (users can only insert their own)
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trials" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create UPDATE policies (users can only update their own)
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trials" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create DELETE policies (users can only delete their own)
CREATE POLICY "Users can delete their own subscriptions" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trials" ON user_trials
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials')
ORDER BY tablename, policyname;

-- 8. Test the policies work
-- This should return data if policies are working
SELECT COUNT(*) as subscription_count FROM user_subscriptions WHERE user_id = '90140669-be77-47f8-bbc3-ece0e49b18d6';
SELECT COUNT(*) as trial_count FROM user_trials WHERE user_id = '90140669-be77-47f8-bbc3-ece0e49b18d6';
