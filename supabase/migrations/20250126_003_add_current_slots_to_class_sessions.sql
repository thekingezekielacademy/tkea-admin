-- Add current_slots column to class_sessions if it doesn't exist
-- This column tracks remaining available slots (starts at available_slots value)
-- Safe to run multiple times - checks if column exists first

DO $$ 
BEGIN
  -- Add current_slots column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'class_sessions' 
    AND column_name = 'current_slots'
  ) THEN
    -- Add the column with default 25
    ALTER TABLE class_sessions 
    ADD COLUMN current_slots INTEGER DEFAULT 25;
    
    RAISE NOTICE 'Added current_slots column to class_sessions table';
    
    -- Initialize current_slots with available_slots value for existing records
    -- If available_slots exists, use it; otherwise default to 25
    UPDATE class_sessions
    SET current_slots = COALESCE(available_slots, 25)
    WHERE current_slots IS NULL;
    
    RAISE NOTICE 'Initialized current_slots from available_slots for existing records';
  ELSE
    RAISE NOTICE 'current_slots column already exists in class_sessions table - skipping';
  END IF;
END $$;

-- Add constraint to ensure current_slots >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'class_sessions_current_slots_check'
  ) THEN
    ALTER TABLE class_sessions 
    ADD CONSTRAINT class_sessions_current_slots_check 
    CHECK (current_slots >= 0);
    
    RAISE NOTICE 'Added constraint to ensure current_slots >= 0';
  END IF;
END $$;

-- Create index for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_class_sessions_current_slots ON class_sessions(current_slots);

-- Add comment explaining the column
COMMENT ON COLUMN class_sessions.current_slots IS 'Current number of available slots. Decrements when users purchase/register. Starts at available_slots value.';

