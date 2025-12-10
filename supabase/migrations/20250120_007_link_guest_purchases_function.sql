-- =====================================================
-- CREATE FUNCTION TO LINK GUEST PURCHASES ON SIGNUP
-- =====================================================
-- This function automatically links guest purchases to a user
-- when they sign up or sign in with the same email
-- =====================================================

CREATE OR REPLACE FUNCTION link_guest_purchases_to_user(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS JSON AS $$
DECLARE
  v_linked_count INTEGER;
  v_purchases JSON;
  v_has_updated_at BOOLEAN;
BEGIN
  -- Normalize email
  p_user_email := LOWER(TRIM(p_user_email));
  
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_purchases' 
    AND column_name = 'updated_at'
  ) INTO v_has_updated_at;
  
  -- Find all guest purchases (buyer_id IS NULL) with matching email
  SELECT COUNT(*) INTO v_linked_count
  FROM product_purchases
  WHERE buyer_email = p_user_email
    AND buyer_id IS NULL;
  
  -- Update all guest purchases to link to the user account
  IF v_has_updated_at THEN
    -- updated_at column exists, update both buyer_id and updated_at
    UPDATE product_purchases
    SET buyer_id = p_user_id,
        updated_at = NOW()
    WHERE buyer_email = p_user_email
      AND buyer_id IS NULL;
  ELSE
    -- updated_at column doesn't exist, just update buyer_id
    UPDATE product_purchases
    SET buyer_id = p_user_id
    WHERE buyer_email = p_user_email
      AND buyer_id IS NULL;
  END IF;
  
  -- Get linked purchases for return (all purchases now linked to this user with this email)
  SELECT json_agg(
    json_build_object(
      'id', id,
      'product_id', product_id,
      'product_type', product_type,
      'purchase_price', purchase_price
    )
  ) INTO v_purchases
  FROM product_purchases
  WHERE buyer_id = p_user_id
    AND buyer_email = p_user_email;
  
  RETURN json_build_object(
    'success', true,
    'linked_count', v_linked_count,
    'purchases', COALESCE(v_purchases, '[]'::json)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'linked_count', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION link_guest_purchases_to_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION link_guest_purchases_to_user(UUID, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION link_guest_purchases_to_user IS 'Links guest purchases (buyer_email only) to a user account when they sign up/sign in';

-- =====================================================
-- NOTES
-- =====================================================
-- This function should be called:
-- 1. After user registration (in registration handler)
-- 2. After user login (in login handler or auth state change)
-- 
-- Usage:
-- SELECT link_guest_purchases_to_user('user-uuid', 'user@example.com');
-- 
-- Returns:
-- {
--   "success": true,
--   "linked_count": 2,
--   "purchases": [...]
-- }
-- =====================================================
