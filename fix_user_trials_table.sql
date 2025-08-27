-- Fix user_trials table structure and permissions
-- This script addresses the 406 (Not Acceptable) error when querying user_trials

-- 1. Check if user_trials table exists, if not create it
CREATE TABLE IF NOT EXISTS user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add RLS policies for user_trials table
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own trial data
CREATE POLICY IF NOT EXISTS "Users can view own trial data" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own trial data
CREATE POLICY IF NOT EXISTS "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own trial data
CREATE POLICY IF NOT EXISTS "Users can update own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_is_active ON user_trials(is_active);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_trials TO authenticated;
GRANT USAGE ON SEQUENCE user_trials_id_seq TO authenticated;

-- 5. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_trials' 
ORDER BY ordinal_position;
