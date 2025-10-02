-- SAFE Course Overview Database Fix
-- This script is conservative and won't break existing data
-- Run this in your Supabase SQL Editor

-- 1. First, let's check what tables already exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_courses', 'user_lesson_progress', 'user_subscriptions')
ORDER BY table_name, ordinal_position;

-- 2. Create user_courses table ONLY if it doesn't exist
-- Using the most basic schema to avoid conflicts
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 3. Create user_lesson_progress table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0,
  time_watched INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, lesson_id)
);

-- 4. Add foreign key constraints ONLY if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for user_courses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_courses_user_id_fkey'
  ) THEN
    ALTER TABLE user_courses ADD CONSTRAINT user_courses_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_courses_course_id_fkey'
  ) THEN
    ALTER TABLE user_courses ADD CONSTRAINT user_courses_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign keys for user_lesson_progress if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_lesson_progress_user_id_fkey'
  ) THEN
    ALTER TABLE user_lesson_progress ADD CONSTRAINT user_lesson_progress_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_lesson_progress_course_id_fkey'
  ) THEN
    ALTER TABLE user_lesson_progress ADD CONSTRAINT user_lesson_progress_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON user_lesson_progress(course_id);

-- 6. Enable Row Level Security (only if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'user_courses' AND relrowsecurity = true
  ) THEN
    ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'user_lesson_progress' AND relrowsecurity = true
  ) THEN
    ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 7. Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
  -- user_courses policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can view their own course enrollments'
  ) THEN
    CREATE POLICY "Users can view their own course enrollments" ON user_courses
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can insert their own course enrollments'
  ) THEN
    CREATE POLICY "Users can insert their own course enrollments" ON user_courses
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can update their own course enrollments'
  ) THEN
    CREATE POLICY "Users can update their own course enrollments" ON user_courses
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- user_lesson_progress policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can view their own lesson progress'
  ) THEN
    CREATE POLICY "Users can view their own lesson progress" ON user_lesson_progress
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can insert their own lesson progress'
  ) THEN
    CREATE POLICY "Users can insert their own lesson progress" ON user_lesson_progress
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can update their own lesson progress'
  ) THEN
    CREATE POLICY "Users can update their own lesson progress" ON user_lesson_progress
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 8. Grant permissions (safe to run multiple times)
GRANT ALL ON user_courses TO authenticated;
GRANT ALL ON user_lesson_progress TO authenticated;

-- 9. Final verification
SELECT 'Tables created successfully' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_courses', 'user_lesson_progress')
ORDER BY table_name, ordinal_position;
