-- Fix BUILD COMMUNITY Access Records
-- This script creates the missing product_purchases records with product_type='live_class'
-- for users who already have BUILD COMMUNITY access but are missing this record

-- IMPORTANT: This script will:
-- 1. Update the product_type constraint to allow 'live_class'
-- 2. Create missing product_purchases records for BUILD COMMUNITY members
-- 3. Verify the results

-- Step 0: Update product_type constraint to allow 'live_class'
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_purchases_product_type_check'
  ) THEN
    ALTER TABLE product_purchases 
    DROP CONSTRAINT product_purchases_product_type_check;
    
    RAISE NOTICE 'Dropped existing product_type constraint';
  END IF;
  
  -- Add new constraint that includes 'live_class'
  ALTER TABLE product_purchases 
  ADD CONSTRAINT product_purchases_product_type_check 
  CHECK (product_type IN ('course', 'learning_path', 'live_class'));
  
  RAISE NOTICE 'Updated product_type constraint to include live_class';
END $$;

-- Step 1: Find users who have BUILD COMMUNITY course purchases but are missing the live_class purchase record
-- BUILD COMMUNITY courses:
-- - FREELANCING - THE UNTAPPED MARKET
-- - INFORMATION MARKETING: THE INFINITE CASH LOOP
-- - YOUTUBE MONETIZATION: From Setup To Monetization
-- - EARN 500K SIDE INCOME SELLING EBOOKS
-- - CPA MARKETING BLUEPRINT: TKEA RESELLERS

WITH build_community_users AS (
  -- Find users who have at least 3 BUILD COMMUNITY courses (to ensure they have BUILD COMMUNITY access)
  SELECT DISTINCT 
    pp.buyer_id as user_id,
    pp.buyer_email as user_email
  FROM product_purchases pp
  INNER JOIN courses c ON pp.product_id = c.id
  WHERE pp.product_type = 'course'
    AND pp.payment_status = 'success'
    AND pp.access_granted = true
    AND (
      c.title ILIKE '%FREELANCING%UNTAPPED MARKET%' OR
      c.title ILIKE '%INFORMATION MARKETING%INFINITE CASH LOOP%' OR
      c.title ILIKE '%YOUTUBE MONETIZATION%' OR
      c.title ILIKE '%EARN 500K SIDE INCOME SELLING EBOOKS%' OR
      c.title ILIKE '%CPA MARKETING BLUEPRINT%TKEA RESELLERS%'
    )
  GROUP BY pp.buyer_id, pp.buyer_email
  HAVING COUNT(DISTINCT c.id) >= 3  -- At least 3 BUILD courses
),
missing_records AS (
  -- Find users who DON'T have the live_class purchase record
  SELECT 
    bcu.user_id,
    bcu.user_email
  FROM build_community_users bcu
  WHERE NOT EXISTS (
    SELECT 1
    FROM product_purchases pp2
    WHERE pp2.product_type = 'live_class'
      AND pp2.payment_status = 'success'
      AND pp2.access_granted = true
      AND (
        (bcu.user_id IS NOT NULL AND pp2.buyer_id = bcu.user_id) OR
        (bcu.user_id IS NULL AND pp2.buyer_email = bcu.user_email)
      )
  )
)
-- Insert missing product_purchases records
INSERT INTO product_purchases (
  buyer_id,
  buyer_email,
  product_id,
  product_type,
  amount_paid,
  purchase_price,
  payment_status,
  payment_reference,
  access_granted,
  access_granted_at,
  access_token,
  created_at,
  updated_at
)
SELECT 
  mr.user_id,
  NULLIF(mr.user_email, '') as user_email,  -- Convert empty string back to NULL
  lc.id as product_id,  -- Use first active live class
  'live_class' as product_type,
  1 as amount_paid,  -- 1 kobo minimum
  1 as purchase_price,  -- 1 kobo minimum
  'success' as payment_status,
  'BUILD_COMMUNITY_RETROACTIVE_' || COALESCE(mr.user_id::text, md5(COALESCE(mr.user_email, ''))) || '_' || EXTRACT(EPOCH FROM NOW())::bigint as payment_reference,
  true as access_granted,
  NOW() as access_granted_at,
  encode(gen_random_bytes(32), 'hex') as access_token,
  NOW() as created_at,
  NOW() as updated_at
FROM missing_records mr
CROSS JOIN LATERAL (
  SELECT id FROM live_classes 
  WHERE is_active = true 
  LIMIT 1
) lc
WHERE lc.id IS NOT NULL  -- Only if there's at least one active live class
  AND (mr.user_id IS NOT NULL OR (mr.user_email IS NOT NULL AND mr.user_email != ''))  -- Ensure at least one identifier exists
ON CONFLICT DO NOTHING;  -- Skip if record already exists (if there's a unique constraint)

-- Verify the fix
SELECT 
  'BUILD COMMUNITY users with live_class record' as status,
  COUNT(DISTINCT COALESCE(buyer_id::text, buyer_email)) as user_count
FROM product_purchases
WHERE product_type = 'live_class'
  AND payment_status = 'success'
  AND access_granted = true;
