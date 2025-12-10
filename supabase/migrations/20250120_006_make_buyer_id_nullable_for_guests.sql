-- =====================================================
-- MAKE BUYER_ID NULLABLE FOR GUEST PURCHASES
-- =====================================================
-- This migration makes buyer_id nullable to support
-- guest purchases (users not yet registered)
-- =====================================================

DO $$
DECLARE
  fk_constraint_name TEXT;
BEGIN
  -- Check if product_purchases table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'product_purchases'
  ) THEN
    RAISE EXCEPTION 'product_purchases table does not exist. Please create it first.';
  END IF;

  -- 1. Make buyer_id nullable (drop NOT NULL constraint if it exists)
  -- First, find and drop any foreign key constraints on buyer_id
  -- Find foreign key constraint on buyer_id
  SELECT conname INTO fk_constraint_name
  FROM pg_constraint 
  WHERE conrelid = 'product_purchases'::regclass
  AND contype = 'f'
  AND conkey::text LIKE '%buyer_id%'
  LIMIT 1;
  
  -- Drop the foreign key constraint if it exists
  IF fk_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE product_purchases DROP CONSTRAINT IF EXISTS %I', fk_constraint_name);
    RAISE NOTICE 'Dropped foreign key constraint: %', fk_constraint_name;
  END IF;

  -- 2. Make buyer_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'buyer_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE product_purchases 
    ALTER COLUMN buyer_id DROP NOT NULL;
    
    RAISE NOTICE 'Made buyer_id nullable in product_purchases table';
  ELSE
    RAISE NOTICE 'buyer_id is already nullable or column does not exist';
  END IF;

  -- 3. Re-add foreign key constraint (now nullable, with ON DELETE SET NULL)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'buyer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'product_purchases'::regclass
    AND contype = 'f'
    AND conkey::text LIKE '%buyer_id%'
  ) THEN
    -- Try to add foreign key to profiles table
    BEGIN
      ALTER TABLE product_purchases 
      ADD CONSTRAINT fk_product_purchases_buyer_id 
      FOREIGN KEY (buyer_id) 
      REFERENCES profiles(id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE 'Re-added foreign key constraint for buyer_id (nullable)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add foreign key constraint (may already exist or profiles table not found): %', SQLERRM;
    END;
  END IF;

  -- 3. Ensure buyer_email column exists (from previous migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'buyer_email'
  ) THEN
    ALTER TABLE product_purchases 
    ADD COLUMN buyer_email TEXT;
    
    RAISE NOTICE 'Added buyer_email column to product_purchases table';
  END IF;

  -- 4. Drop existing check constraint if it exists (we'll recreate it)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_buyer_identity'
  ) THEN
    ALTER TABLE product_purchases 
    DROP CONSTRAINT check_buyer_identity;
    
    RAISE NOTICE 'Dropped existing check_buyer_identity constraint';
  END IF;

  -- 5. Add constraint to ensure either buyer_id OR buyer_email is set
  ALTER TABLE product_purchases 
  ADD CONSTRAINT check_buyer_identity 
  CHECK (
    (buyer_id IS NOT NULL) OR 
    (buyer_email IS NOT NULL)
  );
  
  RAISE NOTICE 'Added check_buyer_identity constraint: Either buyer_id OR buyer_email must be set';

  -- 6. Create index on buyer_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_purchases_buyer_email'
  ) THEN
    CREATE INDEX idx_product_purchases_buyer_email 
    ON product_purchases(buyer_email) 
    WHERE buyer_email IS NOT NULL;
    
    RAISE NOTICE 'Created index on buyer_email column';
  END IF;

  -- 7. Ensure updated_at column exists (needed for linking function)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE product_purchases 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added updated_at column to product_purchases table';
  END IF;

END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- Usage:
-- - For existing users: Set both buyer_id and buyer_email
-- - For guest users: Set buyer_email only, buyer_id = NULL
-- 
-- Data Integrity:
-- - Either buyer_id OR buyer_email must be set (enforced by constraint)
-- - When buyer_id is set, buyer_email should match the user's email
-- 
-- When guest user signs up:
-- UPDATE product_purchases 
-- SET buyer_id = NEW_USER_ID 
-- WHERE buyer_email = USER_EMAIL AND buyer_id IS NULL;
-- =====================================================
