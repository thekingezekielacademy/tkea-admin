-- Add access_type column to courses table
DO $$ 
BEGIN
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
  
  -- Set default value for existing courses that don't have this field set
  UPDATE courses SET access_type = 'membership' WHERE access_type IS NULL;
  
END $$;

-- Create index for better performance on access_type queries
CREATE INDEX IF NOT EXISTS idx_courses_access_type ON courses(access_type);
