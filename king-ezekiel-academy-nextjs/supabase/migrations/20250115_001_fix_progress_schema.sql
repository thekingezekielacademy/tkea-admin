-- Fix progress tracking schema issues

-- 1. Add missing columns to user_courses table
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

-- 2. Add missing columns to user_lesson_progress table
ALTER TABLE user_lesson_progress 
ADD COLUMN IF NOT EXISTS course_id TEXT;

-- 3. Create proper foreign key relationships
-- First, let's check if the foreign key constraint exists and drop it if it does
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_lesson_progress_lesson_id_fkey' 
        AND table_name = 'user_lesson_progress'
    ) THEN
        ALTER TABLE user_lesson_progress DROP CONSTRAINT user_lesson_progress_lesson_id_fkey;
    END IF;
END $$;

-- Now add the foreign key constraint properly
ALTER TABLE user_lesson_progress 
ADD CONSTRAINT user_lesson_progress_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

-- Add foreign key for course_id in user_lesson_progress
ALTER TABLE user_lesson_progress 
ADD CONSTRAINT user_lesson_progress_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- 4. Update existing user_lesson_progress records to have course_id
-- This will populate the course_id field for existing records
UPDATE user_lesson_progress 
SET course_id = (
    SELECT course_id 
    FROM lessons 
    WHERE lessons.id = user_lesson_progress.lesson_id
)
WHERE course_id IS NULL;

-- 5. Make course_id NOT NULL after populating it
ALTER TABLE user_lesson_progress 
ALTER COLUMN course_id SET NOT NULL;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course 
ON user_lesson_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson 
ON user_lesson_progress(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed 
ON user_lesson_progress(user_id, is_completed) 
WHERE is_completed = true;

-- 7. Update user_courses table to calculate total_lessons
UPDATE user_courses 
SET total_lessons = (
    SELECT COUNT(*) 
    FROM lessons 
    WHERE lessons.course_id = user_courses.course_id
)
WHERE total_lessons = 0;

-- 8. Create a function to automatically update course progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_course_progress_on_lesson_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user_courses table with the latest progress
    INSERT INTO user_courses (
        user_id, 
        course_id, 
        progress, 
        completed_lessons, 
        total_lessons,
        last_accessed,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.course_id,
        (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE ulp.is_completed = true)::DECIMAL / 
                 COUNT(*)::DECIMAL) * 100
            )
            FROM user_lesson_progress ulp
            WHERE ulp.user_id = NEW.user_id 
            AND ulp.course_id = NEW.course_id
        ),
        (
            SELECT COUNT(*) 
            FROM user_lesson_progress ulp
            WHERE ulp.user_id = NEW.user_id 
            AND ulp.course_id = NEW.course_id 
            AND ulp.is_completed = true
        ),
        (
            SELECT COUNT(*) 
            FROM lessons 
            WHERE course_id = NEW.course_id
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET
        progress = EXCLUDED.progress,
        completed_lessons = EXCLUDED.completed_lessons,
        total_lessons = EXCLUDED.total_lessons,
        last_accessed = EXCLUDED.last_accessed,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to automatically update course progress
DROP TRIGGER IF EXISTS trigger_update_course_progress ON user_lesson_progress;
CREATE TRIGGER trigger_update_course_progress
    AFTER INSERT OR UPDATE ON user_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_course_progress_on_lesson_completion();

-- 10. Create a view for easier progress querying
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    ulp.user_id,
    ulp.course_id,
    c.title as course_title,
    COUNT(*) as total_lessons,
    COUNT(*) FILTER (WHERE ulp.is_completed = true) as completed_lessons,
    ROUND(
        (COUNT(*) FILTER (WHERE ulp.is_completed = true)::DECIMAL / 
         COUNT(*)::DECIMAL) * 100
    ) as progress_percentage,
    MAX(ulp.last_watched_at) as last_accessed,
    MAX(ulp.completed_at) FILTER (WHERE ulp.is_completed = true) as last_lesson_completed
FROM user_lesson_progress ulp
JOIN courses c ON c.id = ulp.course_id
GROUP BY ulp.user_id, ulp.course_id, c.title;

-- Grant permissions
GRANT SELECT ON user_progress_summary TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
