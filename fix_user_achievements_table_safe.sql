-- =====================================================
-- FIX: Create Missing user_achievements Table (SAFE VERSION)
-- This fixes the infinite loading issue on /achievements page
-- Handles existing policies gracefully
-- =====================================================

-- 1. Create user_achievements table if it doesn't exist
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

-- 2. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- 3. Enable Row Level Security (if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'user_achievements' AND relrowsecurity = true
    ) THEN
        ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" ON user_achievements
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON user_achievements TO authenticated;

-- 7. Add table comments
COMMENT ON TABLE user_achievements IS 'Tracks user achievements and rewards';
COMMENT ON COLUMN user_achievements.achievement_id IS 'Unique identifier for the achievement type';
COMMENT ON COLUMN user_achievements.xp_reward IS 'XP points awarded for this achievement';
COMMENT ON COLUMN user_achievements.earned_at IS 'When the achievement was earned';

-- 8. Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
ORDER BY ordinal_position;

-- 9. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_achievements';
