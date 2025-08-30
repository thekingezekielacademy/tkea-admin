-- Fix RLS policies to work for ALL authenticated users
-- The current policies are too restrictive

-- 1. Drop existing policies
DROP POLICY IF EXISTS "subscription_select_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_insert_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_update_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_delete_policy" ON user_subscriptions;

DROP POLICY IF EXISTS "trial_select_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_insert_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_update_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_delete_policy" ON user_trials;

-- 2. Create more permissive policies that work for all authenticated users
CREATE POLICY "subscription_select_policy" ON user_subscriptions
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "subscription_insert_policy" ON user_subscriptions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "subscription_update_policy" ON user_subscriptions
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "subscription_delete_policy" ON user_subscriptions
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "trial_select_policy" ON user_trials
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "trial_insert_policy" ON user_trials
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "trial_update_policy" ON user_trials
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

CREATE POLICY "trial_delete_policy" ON user_trials
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR auth.uid()::text = user_id::text)
    );

-- 3. Verify the new policies
SELECT policyname, tablename, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials');
