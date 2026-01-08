-- Add is_free column to class_sessions if it doesn't exist
-- This migration fixes the schema to match the intended design
-- Safe to run multiple times - checks if column exists first

DO $$ 
BEGIN
  -- Add is_free column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'class_sessions' 
    AND column_name = 'is_free'
  ) THEN
    -- Add the column with default false (NOT NULL added after setting defaults on existing rows)
    ALTER TABLE class_sessions 
    ADD COLUMN is_free BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Added is_free column to class_sessions table';
    
    -- Update existing records: set is_free to true for first 2 lessons (order_index 0 and 1)
    -- Only update if there are existing records
    UPDATE class_sessions cs
    SET is_free = true
    FROM course_videos cv
    WHERE cs.course_video_id = cv.id
    AND cv.order_index IN (0, 1);
    
    -- Show how many records were updated
    RAISE NOTICE 'Updated existing class_sessions to mark first 2 lessons as free';
  ELSE
    RAISE NOTICE 'is_free column already exists in class_sessions table - skipping';
  END IF;
END $$;

-- Create index for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_class_sessions_is_free ON class_sessions(is_free);

-- Add comment explaining the column (safe to run multiple times)
COMMENT ON COLUMN class_sessions.is_free IS 'True for first 2 classes (order_index 0 and 1). Automatically set by mark_free_classes() trigger for new records.';

