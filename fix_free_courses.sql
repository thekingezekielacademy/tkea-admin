-- Fix courses table to include both is_free and access_type columns
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
  -- Add is_free column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_free') THEN
    ALTER TABLE courses ADD COLUMN is_free BOOLEAN DEFAULT false;
  END IF;
  
  -- Add access_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'access_type') THEN
    ALTER TABLE courses ADD COLUMN access_type TEXT DEFAULT 'membership';
  END IF;
  
  -- Add check constraint for valid access types
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_access_type_check'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_access_type_check 
      CHECK (access_type IN ('free', 'membership'));
  END IF;
  
  -- Sync is_free and access_type columns
  -- If access_type is 'free', set is_free to true
  UPDATE courses SET is_free = true WHERE access_type = 'free';
  
  -- If is_free is true but access_type is not 'free', set access_type to 'free'
  UPDATE courses SET access_type = 'free' WHERE is_free = true AND access_type != 'free';
  
  -- Set default values for existing courses that don't have these fields set
  UPDATE courses SET access_type = 'membership', is_free = false 
  WHERE access_type IS NULL OR is_free IS NULL;
  
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_is_free ON courses(is_free);
CREATE INDEX IF NOT EXISTS idx_courses_access_type ON courses(access_type);

-- Add some sample free courses for testing
INSERT INTO courses (id, title, description, level, cover_photo_url, is_free, access_type, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'Introduction to Web Development',
    'Learn the fundamentals of web development with HTML, CSS, and JavaScript. Perfect for beginners who want to start their coding journey.',
    'beginner',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
    true,
    'free',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'JavaScript Basics',
    'Master the fundamentals of JavaScript programming. Learn variables, functions, loops, and more.',
    'beginner',
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500',
    true,
    'free',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the changes
SELECT id, title, is_free, access_type FROM courses WHERE is_free = true LIMIT 5;
