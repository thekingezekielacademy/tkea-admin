-- =====================================================
-- ADD BUYER_EMAIL TO PRODUCT_PURCHASES TABLE
-- =====================================================
-- This migration adds buyer_email column to support
-- guest purchases (users not yet registered)
-- =====================================================

DO $$
BEGIN
  -- Check if product_purchases table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'product_purchases'
  ) THEN
    RAISE EXCEPTION 'product_purchases table does not exist. Please create it first.';
  END IF;

  -- 1. Add buyer_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'buyer_email'
  ) THEN
    ALTER TABLE product_purchases 
    ADD COLUMN buyer_email TEXT;
    
    RAISE NOTICE 'Added buyer_email column to product_purchases table';
  ELSE
    RAISE NOTICE 'buyer_email column already exists in product_purchases table';
  END IF;

  -- 2. Create index for faster lookups when users sign up
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_purchases_buyer_email'
  ) THEN
    CREATE INDEX idx_product_purchases_buyer_email 
    ON product_purchases(buyer_email) 
    WHERE buyer_email IS NOT NULL;
    
    RAISE NOTICE 'Created index on buyer_email column';
  ELSE
    RAISE NOTICE 'Index idx_product_purchases_buyer_email already exists';
  END IF;

  -- 3. Add comment explaining the column
  COMMENT ON COLUMN product_purchases.buyer_email IS 'Email address for guest purchases. When user signs up, purchases are linked by matching buyer_email to user email.';

  -- 4. Optional: Populate buyer_email for existing purchases that have buyer_id
  -- This ensures backward compatibility - existing purchases get their email populated
  UPDATE product_purchases pp
  SET buyer_email = (
    SELECT email 
    FROM profiles p 
    WHERE p.id = pp.buyer_id 
    LIMIT 1
  )
  WHERE pp.buyer_id IS NOT NULL 
    AND pp.buyer_email IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = pp.buyer_id
    );
  
  RAISE NOTICE 'Populated buyer_email for existing purchases with buyer_id';

END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- Usage:
-- - For existing users: Set both buyer_id and buyer_email
-- - For guest users: Set buyer_email only, buyer_id = NULL
-- 
-- Data Integrity:
-- - Either buyer_id OR buyer_email should be set (or both)
-- - When buyer_id is set, buyer_email should match the user's email
-- 
-- Optional: Add constraint to enforce data integrity (uncomment if needed):
-- ALTER TABLE product_purchases
-- ADD CONSTRAINT check_buyer_identity 
-- CHECK (
--   (buyer_id IS NOT NULL) OR 
--   (buyer_email IS NOT NULL)
-- );
-- 
-- When guest user signs up:
-- UPDATE product_purchases 
-- SET buyer_id = NEW_USER_ID 
-- WHERE buyer_email = USER_EMAIL AND buyer_id IS NULL;
-- =====================================================

