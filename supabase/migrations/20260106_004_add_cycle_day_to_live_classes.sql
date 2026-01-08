-- Add missing cycle_day column to live_classes table
-- This column tracks the current day in the lesson cycle (1-5)

BEGIN;

-- Add cycle_day column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_classes' 
    AND column_name = 'cycle_day'
  ) THEN
    ALTER TABLE live_classes 
    ADD COLUMN cycle_day INTEGER DEFAULT 1 CHECK (cycle_day >= 1 AND cycle_day <= 5);
    
    RAISE NOTICE 'Added cycle_day column to live_classes table';
  ELSE
    RAISE NOTICE 'cycle_day column already exists';
  END IF;
END $$;

-- Update existing records to have cycle_day = 1 if they don't have it
UPDATE live_classes 
SET cycle_day = 1 
WHERE cycle_day IS NULL;

COMMIT;

