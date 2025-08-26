-- Quick Database Setup for Achievements System
-- Run this in your Supabase SQL Editor to create the missing tables

-- 1. Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 2. Create user_lesson_progress table
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

-- 3. Create user_achievements table
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

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 5. Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Users can view their own course enrollments" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lesson progress" ON user_lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" ON user_lesson_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" ON user_lesson_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Insert some test data for the current user
INSERT INTO user_courses (user_id, course_id, status, progress_percentage)
VALUES (
    '61ef5b9a-846c-46c7-b417-bbe753a64f26', -- Your user ID
    '130dd1b1-a792-4bf2-b159-c037aa42e918', -- Replace with actual course ID
    'in_progress',
    25
) ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO user_lesson_progress (user_id, course_id, lesson_id, status, progress_percentage)
VALUES 
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-1', 'completed', 100),
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-2', 'completed', 100),
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-3', 'completed', 100)
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Note: Replace the course_id with an actual course ID from your courses table
-- You can find this by running: SELECT id FROM courses LIMIT 1;
