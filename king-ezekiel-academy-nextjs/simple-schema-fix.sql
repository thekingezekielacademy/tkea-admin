-- SIMPLE SCHEMA FIX - Run this first to add missing columns
-- This avoids the data type issues by just adding the columns

-- 1. Add missing columns to user_lesson_progress table
ALTER TABLE user_lesson_progress 
ADD COLUMN IF NOT EXISTS course_id UUID;

-- 2. Add missing columns to user_courses table  
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

-- 3. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course 
ON user_lesson_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson 
ON user_lesson_progress(user_id, lesson_id);

-- 4. Test that the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_lesson_progress' 
AND column_name IN ('course_id', 'lesson_id', 'user_id')
ORDER BY column_name;
