-- Add course scheduling fields to existing courses table
-- Run this in your Supabase SQL Editor

-- Add scheduling columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Add indexes for scheduled courses queries
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_for ON courses(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_is_scheduled ON courses(is_scheduled);

-- Update existing courses to have proper status
UPDATE courses SET status = 'published' WHERE status IS NULL;

-- Test the new columns
SELECT id, title, is_scheduled, status, scheduled_for FROM courses LIMIT 5;
