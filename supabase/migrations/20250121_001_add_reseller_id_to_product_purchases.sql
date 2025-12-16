-- =====================================================
-- ADD RESELLER_ID TO PRODUCT_PURCHASES TABLE
-- =====================================================
-- This migration adds reseller_id column to track
-- which reseller made each sale
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

  -- 1. Add reseller_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'reseller_id'
  ) THEN
    ALTER TABLE product_purchases 
    ADD COLUMN reseller_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added reseller_id column to product_purchases table';
  ELSE
    RAISE NOTICE 'reseller_id column already exists in product_purchases table';
  END IF;

  -- 2. Create index for faster lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_purchases_reseller_id'
  ) THEN
    CREATE INDEX idx_product_purchases_reseller_id 
    ON product_purchases(reseller_id) 
    WHERE reseller_id IS NOT NULL;
    
    RAISE NOTICE 'Created index on reseller_id column';
  ELSE
    RAISE NOTICE 'Index idx_product_purchases_reseller_id already exists';
  END IF;

  -- 3. Add comment explaining the column
  COMMENT ON COLUMN product_purchases.reseller_id IS 'ID of the reseller who made this sale. References profiles(id). NULL if purchase was not made through a reseller.';

END $$;
