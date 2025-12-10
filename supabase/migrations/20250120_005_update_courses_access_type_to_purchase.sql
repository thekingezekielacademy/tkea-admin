-- =====================================================
-- UPDATE COURSES ACCESS_TYPE FROM 'membership' TO 'purchase'
-- =====================================================
-- This migration updates the courses table to use 'purchase' 
-- instead of 'membership' to match the "Pay Once and Own" model
-- =====================================================

DO $$ 
BEGIN
  -- First, update all existing 'membership' values to 'purchase'
  UPDATE courses 
  SET access_type = 'purchase' 
  WHERE access_type = 'membership';
  
  -- Also update any NULL values to 'purchase' (default)
  UPDATE courses 
  SET access_type = 'purchase' 
  WHERE access_type IS NULL;
  
  -- Update default value for the column
  ALTER TABLE courses 
  ALTER COLUMN access_type SET DEFAULT 'purchase';
  
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_access_type_check'
  ) THEN
    ALTER TABLE courses DROP CONSTRAINT courses_access_type_check;
    RAISE NOTICE 'Dropped old courses_access_type_check constraint';
  END IF;
  
  -- Add the new constraint with 'purchase' instead of 'membership'
  ALTER TABLE courses ADD CONSTRAINT courses_access_type_check 
    CHECK (access_type IN ('free', 'purchase'));
  
  RAISE NOTICE 'Updated courses access_type constraint from membership to purchase';
  RAISE NOTICE 'All existing membership courses converted to purchase';
  
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration aligns courses with the learning_paths table
-- which uses 'free' and 'purchase' access types
-- All existing 'membership' courses are converted to 'purchase'
-- =====================================================
