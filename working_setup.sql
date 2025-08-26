-- Working Database Setup for Achievements System
-- This script checks what exists and creates only what's missing

-- 1. Check if user_courses table exists and has the right structure
DO $$
BEGIN
    -- Check if user_courses table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_courses') THEN
        -- Create user_courses table
        CREATE TABLE user_courses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
            progress_percentage INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, course_id)
        );
        RAISE NOTICE 'Created user_courses table';
    ELSE
        -- Check if created_at column exists, add if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_courses' AND column_name = 'created_at') THEN
            ALTER TABLE user_courses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to user_courses';
        END IF;
        
        -- Check if updated_at column exists, add if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_courses' AND column_name = 'updated_at') THEN
            ALTER TABLE user_courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to user_courses';
        END IF;
        
        RAISE NOTICE 'user_courses table already exists, checked columns';
    END IF;
END $$;

-- 2. Create user_lesson_progress table if it doesn't exist
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

-- 3. Create user_achievements table if it doesn't exist
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

-- 4. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 5. Enable RLS if not already enabled
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can insert their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can update their own course enrollments" ON user_courses;

DROP POLICY IF EXISTS "Users can view their own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON user_lesson_progress;

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

-- Create new policies
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

-- 7. Insert test data for the current user
-- First, let's get a real course ID
DO $$
DECLARE
    course_uuid UUID;
BEGIN
    -- Get the first available course
    SELECT id INTO course_uuid FROM courses LIMIT 1;
    
    IF course_uuid IS NOT NULL THEN
        -- Insert test course enrollment
        INSERT INTO user_courses (user_id, course_id, status, progress_percentage)
        VALUES (
            '61ef5b9a-846c-46c7-b417-bbe753a64f26', -- Your user ID
            course_uuid,
            'in_progress',
            25
        ) ON CONFLICT (user_id, course_id) DO NOTHING;
        
        -- Insert test lesson progress
        INSERT INTO user_lesson_progress (user_id, course_id, lesson_id, status, progress_percentage)
        VALUES 
            ('61ef5b9a-846c-46c7-b417-bbe753a64f26', course_uuid, 'lesson-1', 'completed', 100),
            ('61ef5b9a-846c-46c7-b417-bbe753a64f26', course_uuid, 'lesson-2', 'completed', 100),
            ('61ef5b9a-846c-46c7-b417-bbe753a64f26', course_uuid, 'lesson-3', 'completed', 100)
        ON CONFLICT (user_id, lesson_id) DO NOTHING;
        
        RAISE NOTICE 'Inserted test data for course: %', course_uuid;
    ELSE
        RAISE NOTICE 'No courses found in database';
    END IF;
END $$;

-- 8. Show what was created
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('user_courses', 'user_lesson_progress', 'user_achievements')
ORDER BY table_name, ordinal_position;
