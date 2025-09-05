-- =====================================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- This will fix the user_achievements table issue
-- =====================================================

-- Step 1: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;

-- Step 2: Create the table if it doesn't exist
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

-- Step 3: Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT ALL ON user_achievements TO authenticated;

-- Step 6: Verify it worked
SELECT 'user_achievements table created successfully' as status;
