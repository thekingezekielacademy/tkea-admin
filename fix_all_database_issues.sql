-- Comprehensive Database Fix Script
-- This will resolve all 406 errors and create missing tables

-- ========================================
-- 1. FIX USER_COURSES TABLE
-- ========================================

-- Drop and recreate user_courses table with correct schema
DROP TABLE IF EXISTS user_courses CASCADE;

CREATE TABLE user_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
    progress INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ========================================
-- 2. FIX USER_TRIALS TABLE
-- ========================================

-- Drop and recreate user_trials table
DROP TABLE IF EXISTS user_trials CASCADE;

CREATE TABLE user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. FIX USER_SUBSCRIPTIONS TABLE
-- ========================================

-- Drop and recreate user_subscriptions table
DROP TABLE IF EXISTS user_subscriptions CASCADE;

CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    paystack_subscription_id TEXT,
    paystack_customer_code TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    billing_cycle TEXT DEFAULT 'monthly',
    next_billing_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. CREATE SUBSCRIPTION_PAYMENTS TABLE
-- ========================================

-- Create subscription_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. CREATE ADDITIONAL TABLES
-- ========================================

-- Create user_lesson_progress table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'started', 'completed')),
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    xp_reward INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- User courses indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);

-- User trials indexes
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_is_active ON user_trials(is_active);

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paystack_id ON user_subscriptions(paystack_subscription_id);

-- Subscription payments indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_ref ON subscription_payments(paystack_reference);

-- User lesson progress indexes
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON user_lesson_progress(course_id);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ========================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. CREATE RLS POLICIES
-- ========================================

-- User courses policies
DROP POLICY IF EXISTS "Users can view their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can insert their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can update their own course enrollments" ON user_courses;

CREATE POLICY "Users can view their own course enrollments" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

-- User trials policies
DROP POLICY IF EXISTS "Users can view own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can insert own trial data" ON user_trials;
DROP POLICY IF EXISTS "Users can update own trial data" ON user_trials;

CREATE POLICY "Users can view own trial data" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription data" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription data" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription data" ON user_subscriptions;

CREATE POLICY "Users can view own subscription data" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription data" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription data" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscription payments policies
DROP POLICY IF EXISTS "Users can view own payment data" ON subscription_payments;
DROP POLICY IF EXISTS "Users can insert own payment data" ON subscription_payments;

CREATE POLICY "Users can view own payment data" ON subscription_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment data" ON subscription_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User lesson progress policies
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON user_lesson_progress;

CREATE POLICY "Users can view their own lesson progress" ON user_lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" ON user_lesson_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" ON user_lesson_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- User achievements policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 9. GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON user_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_trials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT ON subscription_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_lesson_progress TO authenticated;
GRANT SELECT, INSERT ON user_achievements TO authenticated;

-- ========================================
-- 10. VERIFICATION QUERIES
-- ========================================

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN (
    'user_courses', 
    'user_trials', 
    'user_subscriptions', 
    'subscription_payments',
    'user_lesson_progress',
    'user_achievements'
)
ORDER BY table_name;

-- Check RLS policies
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
WHERE tablename IN (
    'user_courses', 
    'user_trials', 
    'user_subscriptions', 
    'subscription_payments',
    'user_lesson_progress',
    'user_achievements'
)
ORDER BY tablename, policyname;

-- Test if policies work (should return 0 for empty tables, not 406 errors)
SELECT COUNT(*) as user_courses_count FROM user_courses;
SELECT COUNT(*) as user_trials_count FROM user_trials;
SELECT COUNT(*) as user_subscriptions_count FROM user_subscriptions;
SELECT COUNT(*) as subscription_payments_count FROM subscription_payments;
SELECT COUNT(*) as user_lesson_progress_count FROM user_lesson_progress;
SELECT COUNT(*) as user_achievements_count FROM user_achievements;
