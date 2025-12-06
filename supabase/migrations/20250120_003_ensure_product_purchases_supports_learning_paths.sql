-- =====================================================
-- ENSURE PRODUCT_PURCHASES SUPPORTS LEARNING PATHS
-- =====================================================
-- This migration ensures that the product_purchases table
-- supports 'learning_path' as a valid product_type
-- =====================================================

-- Check if product_purchases table exists and update product_type constraint
DO $$ 
BEGIN
  -- Check if product_purchases table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'product_purchases'
  ) THEN
    
    -- Check if product_type column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'product_purchases' 
      AND column_name = 'product_type'
    ) THEN
      
      -- Drop existing constraint if it exists
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_purchases_product_type_check'
      ) THEN
        ALTER TABLE product_purchases 
        DROP CONSTRAINT product_purchases_product_type_check;
      END IF;
      
      -- Add new constraint that includes 'learning_path'
      ALTER TABLE product_purchases 
      ADD CONSTRAINT product_purchases_product_type_check 
      CHECK (product_type IN ('course', 'learning_path'));
      
      RAISE NOTICE 'Updated product_purchases.product_type constraint to include learning_path';
      
    ELSE
      RAISE NOTICE 'product_purchases table exists but product_type column not found';
    END IF;
    
  ELSE
    RAISE NOTICE 'product_purchases table does not exist - skipping constraint update';
  END IF;
  
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration assumes product_purchases table has:
-- - buyer_id (UUID) - references profiles(id) or auth.users(id)
-- - product_id (UUID or TEXT) - ID of the purchased product
-- - product_type (TEXT) - 'course' or 'learning_path'
-- - payment_status (TEXT) - 'success', 'failed', 'pending'
-- - access_granted (BOOLEAN) - whether access was granted
-- - browser_fingerprint (TEXT) - for guest purchases
--
-- If the table structure is different, this migration will
-- need to be adjusted accordingly.
-- =====================================================

