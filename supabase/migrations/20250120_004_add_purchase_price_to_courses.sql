-- =====================================================
-- ADD PURCHASE_PRICE TO COURSES TABLE
-- =====================================================
-- This migration adds purchase_price column to courses table
-- to support the "Pay Once and Own" business model
-- =====================================================

DO $$ 
BEGIN
  -- Check if courses table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'courses'
  ) THEN
    
    -- Add purchase_price column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'purchase_price'
    ) THEN
      ALTER TABLE courses 
      ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0;
      
      -- Add comment for documentation
      COMMENT ON COLUMN courses.purchase_price IS 'Price in NGN for purchasing the course (Pay Once and Own model)';
      
      RAISE NOTICE 'Added purchase_price column to courses table';
    ELSE
      RAISE NOTICE 'purchase_price column already exists in courses table';
    END IF;
    
  ELSE
    RAISE NOTICE 'courses table does not exist - skipping purchase_price column addition';
  END IF;
  
END $$;

-- Create index for better query performance (only if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'purchase_price'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_courses_purchase_price ON courses(purchase_price);
    RAISE NOTICE 'Created index on purchase_price column';
  END IF;
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration adds purchase_price to courses table
-- to match the learning_paths table structure
-- Default value is 0 (free course)
-- Price is in NGN (Nigerian Naira)
-- =====================================================

