-- Simplify course access to use only access_type field
-- Remove redundant is_free column and use only access_type

DO $$ 
BEGIN
  -- First, ensure all courses have proper access_type values
  -- Convert any is_free = true to access_type = 'free'
  UPDATE courses SET access_type = 'free' WHERE is_free = true;
  
  -- Set default access_type for any courses that don't have it set
  UPDATE courses SET access_type = 'membership' WHERE access_type IS NULL;
  
  -- Drop the is_free column since we're using access_type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_free') THEN
    ALTER TABLE courses DROP COLUMN is_free;
  END IF;
  
END $$;

-- Ensure we have the access_type constraint
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_access_type_check') THEN
    ALTER TABLE courses DROP CONSTRAINT courses_access_type_check;
  END IF;
  
  -- Add the constraint
  ALTER TABLE courses ADD CONSTRAINT courses_access_type_check 
    CHECK (access_type IN ('free', 'membership'));
END $$;

-- Create index for better performance on access_type queries
CREATE INDEX IF NOT EXISTS idx_courses_access_type ON courses(access_type);

-- Add some sample free courses for testing
INSERT INTO courses (id, title, description, level, cover_photo_url, access_type, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'Introduction to Web Development',
    'Learn the fundamentals of web development with HTML, CSS, and JavaScript. Perfect for beginners who want to start their coding journey.',
    'beginner',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
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
    'free',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'CSS Fundamentals',
    'Learn CSS from scratch. Master selectors, properties, layouts, and responsive design.',
    'beginner',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    'free',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the changes
SELECT id, title, access_type FROM courses WHERE access_type = 'free' LIMIT 5;
SELECT id, title, access_type FROM courses WHERE access_type = 'membership' LIMIT 5;
