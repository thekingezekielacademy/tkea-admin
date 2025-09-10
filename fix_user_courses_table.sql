-- Fix user_courses table to use auth.users instead of profiles
-- This will resolve the enrollment and progress tracking issues

-- Drop the existing table and recreate with correct references
DROP TABLE IF EXISTS user_courses CASCADE;

-- Create user_courses table with correct auth.users reference
CREATE TABLE user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons JSONB DEFAULT '[]',
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure one enrollment per user per course
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX idx_user_courses_progress ON user_courses(progress);
CREATE INDEX idx_user_courses_last_accessed ON user_courses(last_accessed);
CREATE INDEX idx_user_courses_completed ON user_courses(is_completed);
CREATE INDEX idx_user_courses_active ON user_courses(is_active);

-- Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own course enrollments" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all enrollments
CREATE POLICY "Admins can view all course enrollments" ON user_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all enrollments
CREATE POLICY "Admins can update all course enrollments" ON user_courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE user_courses IS 'Tracks user enrollment and progress in courses';
COMMENT ON COLUMN user_courses.progress IS 'Course completion percentage (0-100)';
COMMENT ON COLUMN user_courses.completed_lessons IS 'Array of completed lesson IDs';
COMMENT ON COLUMN user_courses.last_accessed IS 'Last time user accessed this course';
COMMENT ON COLUMN user_courses.is_completed IS 'Whether the course is fully completed';
COMMENT ON COLUMN user_courses.is_active IS 'Whether the enrollment is active';

-- Grant permissions
GRANT ALL ON user_courses TO authenticated;