-- Add support for standalone live classes (not tied to courses)
-- This allows creating live classes that only appear in live classes section, not in courses

BEGIN;

-- 1. Make course_id nullable in live_classes (standalone classes don't need a course)
ALTER TABLE live_classes 
  ALTER COLUMN course_id DROP NOT NULL;

-- 2. Add title and description fields for standalone live classes
ALTER TABLE live_classes 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add constraint: either course_id OR title must be present (standalone or course-based)
-- Note: This will fail if existing rows violate the constraint, but all existing rows should have course_id
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'live_classes_course_or_title_check'
  ) THEN
    ALTER TABLE live_classes 
    ADD CONSTRAINT live_classes_course_or_title_check 
    CHECK (
      (course_id IS NOT NULL) OR (title IS NOT NULL)
    );
    RAISE NOTICE 'Added constraint: live_classes_course_or_title_check';
  ELSE
    RAISE NOTICE 'Constraint live_classes_course_or_title_check already exists';
  END IF;
END $$;

-- 4. Make course_video_id nullable in class_sessions (standalone classes use direct video URLs)
ALTER TABLE class_sessions 
  ALTER COLUMN course_video_id DROP NOT NULL;

-- 5. Add direct video support for standalone classes
ALTER TABLE class_sessions 
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_title TEXT,
  ADD COLUMN IF NOT EXISTS video_description TEXT;

-- 6. Add constraint: either course_video_id OR video_url must be present
-- Note: This will fail if existing rows violate the constraint, but all existing rows should have course_video_id
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'class_sessions_video_check'
  ) THEN
    ALTER TABLE class_sessions 
    ADD CONSTRAINT class_sessions_video_check 
    CHECK (
      (course_video_id IS NOT NULL) OR (video_url IS NOT NULL)
    );
    RAISE NOTICE 'Added constraint: class_sessions_video_check';
  ELSE
    RAISE NOTICE 'Constraint class_sessions_video_check already exists';
  END IF;
END $$;

-- 7. Update unique constraint on live_classes to allow multiple standalone classes
-- First, find and drop the existing unique constraint (PostgreSQL auto-names it)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the unique constraint on course_id
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'live_classes'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND (SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = conkey[1]) = 'course_id';
  
  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE live_classes DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped unique constraint: %', constraint_name;
  END IF;
END $$;

-- 8. Add unique constraint: course_id must be unique when present, but NULL is allowed multiple times
CREATE UNIQUE INDEX IF NOT EXISTS live_classes_course_id_unique 
  ON live_classes (course_id) 
  WHERE course_id IS NOT NULL;

-- 9. Add index for standalone classes (those without course_id)
CREATE INDEX IF NOT EXISTS idx_live_classes_standalone 
  ON live_classes (is_active) 
  WHERE course_id IS NULL;

COMMIT;

