-- Allow public (unauthenticated) access to free live class sessions
-- Classes 1 and 2 (order_index 0 and 1) should be accessible without sign-in
--
-- Note: The existing policies already allow public access with USING (true),
-- but we verify they exist and ensure course_videos is also publicly accessible.

BEGIN;

-- Ensure course_videos has public read access (needed to check order_index for free classes)
-- Check if the existing "Users can view all course videos" policy exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'course_videos' 
    AND policyname = 'Users can view all course videos'
  ) THEN
    -- Create public read policy for course_videos if it doesn't exist
    CREATE POLICY "Users can view all course videos" ON course_videos
      FOR SELECT USING (true);
    RAISE NOTICE 'Created public read policy for course_videos';
  ELSE
    RAISE NOTICE 'Public read policy for course_videos already exists';
  END IF;
END $$;

-- Verify live_classes has public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'live_classes' 
    AND policyname = 'Users can view all live classes'
  ) THEN
    CREATE POLICY "Users can view all live classes" ON live_classes
      FOR SELECT USING (true);
    RAISE NOTICE 'Created public read policy for live_classes';
  ELSE
    RAISE NOTICE 'Public read policy for live_classes already exists';
  END IF;
END $$;

-- Verify class_sessions has public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'class_sessions' 
    AND policyname = 'Users can view scheduled sessions'
  ) THEN
    CREATE POLICY "Users can view scheduled sessions" ON class_sessions
      FOR SELECT USING (true);
    RAISE NOTICE 'Created public read policy for class_sessions';
  ELSE
    RAISE NOTICE 'Public read policy for class_sessions already exists';
  END IF;
END $$;

COMMIT;

