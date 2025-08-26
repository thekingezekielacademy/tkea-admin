-- Test script to populate initial data for testing the achievements system
-- Run this after creating the tables to test the achievements functionality

-- 1. Insert test course enrollment for the current user
INSERT INTO user_courses (user_id, course_id, status, progress_percentage)
VALUES (
    '61ef5b9a-846c-46c7-b417-bbe753a64f26', -- Replace with actual user ID
    '130dd1b1-a792-4bf2-b159-c037aa42e918', -- Replace with actual course ID
    'in_progress',
    25
) ON CONFLICT (user_id, course_id) DO NOTHING;

-- 2. Insert test lesson progress (completed lessons)
INSERT INTO user_lesson_progress (user_id, course_id, lesson_id, status, completed_at, progress_percentage)
VALUES 
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-1-id', 'completed', NOW(), 100),
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-2-id', 'completed', NOW(), 100),
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', '130dd1b1-a792-4bf2-b159-c037aa42e918', 'lesson-3-id', 'completed', NOW(), 100)
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- 3. Insert test achievements
INSERT INTO user_achievements (user_id, achievement_id, title, description, category, xp_reward)
VALUES 
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', 'first-steps', 'First Steps', 'Complete your first lesson', 'learning', 50),
    ('61ef5b9a-846c-46c7-b417-bbe753a64f26', 'lesson-3', 'Lesson 3', 'Complete 3 lessons', 'learning', 100)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- 4. Update user profile with XP and level (if not already set)
UPDATE profiles 
SET xp = COALESCE(xp, 0) + 150, 
    level = GREATEST(1, 1 + ((COALESCE(xp, 0) + 150) / 100)),
    updated_at = NOW()
WHERE id = '61ef5b9a-846c-46c7-b417-bbe753a64f26';

-- Note: Replace the user_id and course_id values with actual IDs from your database
-- You can find these by running:
-- SELECT id FROM auth.users LIMIT 1;
-- SELECT id FROM courses LIMIT 1;
