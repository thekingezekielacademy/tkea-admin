-- Quick fix for progress tracking schema issues
-- Run this in your Supabase SQL editor

-- 1. First, let's check the column types to understand the schema
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_lesson_progress', 'lessons', 'courses')
AND column_name IN ('id', 'lesson_id', 'course_id')
ORDER BY table_name, column_name;

-- 2. Add missing columns to user_lesson_progress table
ALTER TABLE user_lesson_progress 
ADD COLUMN IF NOT EXISTS course_id UUID;

-- 3. Add missing columns to user_courses table  
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

-- 4. Update existing user_lesson_progress records to have course_id
-- This will populate the course_id field for existing records
UPDATE user_lesson_progress 
SET course_id = (
    SELECT course_id 
    FROM lessons 
    WHERE lessons.id = user_lesson_progress.lesson_id
)
WHERE course_id IS NULL;

-- 4. Make course_id NOT NULL after populating it (only if we have data)
-- Uncomment the next line if you have lesson progress data:
-- ALTER TABLE user_lesson_progress ALTER COLUMN course_id SET NOT NULL;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course 
ON user_lesson_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson 
ON user_lesson_progress(user_id, lesson_id);

-- 6. Test the fix by checking if we can query the data
SELECT 
    ulp.user_id,
    ulp.course_id,
    ulp.lesson_id,
    ulp.is_completed,
    ulp.completed_at
FROM user_lesson_progress ulp
LIMIT 5;

-- 7. Check if we can count lessons per course
SELECT 
    course_id,
    COUNT(*) as total_lessons
FROM lessons
GROUP BY course_id
LIMIT 5;

-- 8. Test course progress calculation
SELECT 
    ulp.user_id,
    ulp.course_id,
    COUNT(*) as total_progress_records,
    COUNT(*) FILTER (WHERE ulp.is_completed = true) as completed_lessons,
    ROUND(
        (COUNT(*) FILTER (WHERE ulp.is_completed = true)::DECIMAL / 
         COUNT(*)::DECIMAL) * 100
    ) as progress_percentage
FROM user_lesson_progress ulp
WHERE ulp.course_id IS NOT NULL
GROUP BY ulp.user_id, ulp.course_id
LIMIT 5;
