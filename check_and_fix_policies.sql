-- Check what policies exist and fix them properly
-- First, let's see what we have

-- 1. Check existing policies
SELECT policyname, tablename, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials');

-- 2. Drop ALL existing policies for these tables
DROP POLICY IF EXISTS "users_view_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "users_insert_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "users_update_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "users_delete_own_subscriptions" ON user_subscriptions;

DROP POLICY IF EXISTS "users_view_own_trials" ON user_trials;
DROP POLICY IF EXISTS "users_insert_own_trials" ON user_trials;
DROP POLICY IF EXISTS "users_update_own_trials" ON user_trials;
DROP POLICY IF EXISTS "users_delete_own_trials" ON user_trials;

-- Also drop the old overly permissive ones
DROP POLICY IF EXISTS "subscription_select_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_insert_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_update_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "subscription_delete_policy" ON user_subscriptions;

DROP POLICY IF EXISTS "trial_select_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_insert_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_update_policy" ON user_trials;
DROP POLICY IF EXISTS "trial_delete_policy" ON user_trials;

-- 3. Create new, proper policies
CREATE POLICY "users_view_own_subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_subscriptions" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_view_own_trials" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_trials" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_trials" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_trials" ON user_trials
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Verify the new policies
SELECT policyname, tablename, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials');
