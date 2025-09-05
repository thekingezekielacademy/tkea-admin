-- =====================================================
-- COMPREHENSIVE DATABASE FIX
-- Fixes all 406 errors and missing tables
-- =====================================================

-- 1. Fix user_achievements table
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON user_achievements TO authenticated;

-- 2. Fix user_trials table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can insert their own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can update their own trials" ON user_trials;

CREATE POLICY "Users can view their own trials" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trials" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trials" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON user_trials TO authenticated;

-- 3. Fix user_subscriptions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'NGN',
    paystack_subscription_id TEXT,
    paystack_customer_code TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON user_subscriptions TO authenticated;

-- 4. Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('user_achievements', 'user_trials', 'user_subscriptions')
ORDER BY table_name;

-- 5. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_achievements', 'user_trials', 'user_subscriptions')
ORDER BY tablename;
