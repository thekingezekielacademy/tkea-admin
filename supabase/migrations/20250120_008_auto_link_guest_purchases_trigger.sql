-- =====================================================
-- AUTO-LINK GUEST PURCHASES ON PROFILE CREATION/UPDATE
-- =====================================================
-- This creates triggers that automatically link guest purchases
-- to user accounts when profiles are created or emails are updated.
-- This ensures guest purchases are always linked, regardless of
-- which codebase or registration method creates the profile.
-- =====================================================

-- Create trigger function that automatically links guest purchases
-- when a profile is created or email is updated
CREATE OR REPLACE FUNCTION auto_link_guest_purchases_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSON;
  v_linked_count INTEGER;
BEGIN
  -- Only proceed if email is provided
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- Call the existing link_guest_purchases_to_user function
  -- This function already handles normalization and all edge cases
  -- Check if function exists first (for safety)
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'link_guest_purchases_to_user'
  ) THEN
    SELECT link_guest_purchases_to_user(
      NEW.id,
      NEW.email
    ) INTO v_result;
  ELSE
    -- Function doesn't exist yet, skip linking (shouldn't happen if migrations run in order)
    RAISE WARNING 'link_guest_purchases_to_user function not found. Skipping guest purchase linking.';
    RETURN NEW;
  END IF;

  -- Log the result (optional - can be removed in production if desired)
  IF v_result->>'success' = 'true' THEN
    v_linked_count := (v_result->>'linked_count')::INTEGER;
    IF v_linked_count > 0 THEN
      RAISE NOTICE 'Auto-linked % guest purchase(s) for user % (email: %)', 
        v_linked_count, NEW.id, NEW.email;
    END IF;
  ELSE
    -- Log error but don't fail the profile creation/update
    RAISE WARNING 'Failed to auto-link guest purchases for user % (email: %): %', 
      NEW.id, NEW.email, v_result->>'error';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the profile creation/update
  -- This ensures user registration never fails due to linking issues
  RAISE WARNING 'Error in auto_link_guest_purchases_on_signup for user %: %', 
    NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION auto_link_guest_purchases_on_signup IS 
  'Automatically links guest purchases to user account when profile is created or email is updated. Uses SECURITY DEFINER to bypass RLS.';

-- Create trigger for AFTER INSERT on profiles
-- This fires when a new profile is created (user signs up)
DROP TRIGGER IF EXISTS trigger_auto_link_guest_purchases ON profiles;
CREATE TRIGGER trigger_auto_link_guest_purchases
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_link_guest_purchases_on_signup();

COMMENT ON TRIGGER trigger_auto_link_guest_purchases ON profiles IS 
  'Automatically links guest purchases when a new profile is created during user registration.';

-- Create trigger for AFTER UPDATE on profiles (when email changes)
-- This handles cases where user updates their email to match guest purchases
DROP TRIGGER IF EXISTS trigger_auto_link_guest_purchases_on_email_update ON profiles;
CREATE TRIGGER trigger_auto_link_guest_purchases_on_email_update
AFTER UPDATE OF email ON profiles
FOR EACH ROW
WHEN (
  -- Only fire if email actually changed
  OLD.email IS DISTINCT FROM NEW.email
  -- And new email is not null/empty
  AND NEW.email IS NOT NULL 
  AND LENGTH(TRIM(COALESCE(NEW.email, ''))) > 0
)
EXECUTE FUNCTION auto_link_guest_purchases_on_signup();

COMMENT ON TRIGGER trigger_auto_link_guest_purchases_on_email_update ON profiles IS 
  'Automatically links guest purchases when a user updates their email address to match guest purchase emails.';

-- =====================================================
-- TESTING / VERIFICATION
-- =====================================================
-- To test this trigger:
--
-- 1. Create a guest purchase:
--    INSERT INTO product_purchases (
--      product_id, product_type, buyer_email, buyer_id,
--      purchase_price, amount_paid, payment_status, access_granted,
--      payment_reference
--    ) VALUES (
--      'some-course-id', 'course', 'test@example.com', NULL,
--      1000, 1000, 'success', true, 'TEST_REF_123'
--    );
--
-- 2. Create a profile with matching email:
--    INSERT INTO profiles (id, email, name, role)
--    VALUES (
--      gen_random_uuid(), 'test@example.com', 'Test User', 'student'
--    );
--
-- 3. Verify the purchase was linked:
--    SELECT buyer_id, buyer_email FROM product_purchases
--    WHERE buyer_email = 'test@example.com';
--    -- buyer_id should now be set to the profile id
--
-- =====================================================
