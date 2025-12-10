# 🧪 Testing Guide: Guest Purchase Auto-Linking Trigger

## ✅ **Migration Applied**

Make sure you've run the migration:
```
supabase/migrations/20250120_008_auto_link_guest_purchases_trigger.sql
```

---

## 🧪 **TESTING PROCEDURE**

### **Test 1: Basic Auto-Linking on Signup**

1. **Create a guest purchase** (via Admin Manual Add to Library or SQL):
   ```sql
   -- Find a course ID first
   SELECT id, title FROM courses LIMIT 1;
   
   -- Create guest purchase
   INSERT INTO product_purchases (
     product_id, 
     product_type, 
     buyer_email, 
     buyer_id,  -- NULL for guest
     purchase_price, 
     amount_paid, 
     payment_status, 
     access_granted,
     payment_reference
   ) VALUES (
     'YOUR_COURSE_ID_HERE',  -- Replace with actual course ID
     'course',
     'test-user@example.com',  -- Test email
     NULL,  -- Guest purchase (no buyer_id)
     1000.00,
     1000.00,
     'success',
     true,
     'TEST_GUEST_' || gen_random_uuid()::text
   );
   
   -- Verify guest purchase exists
   SELECT id, buyer_email, buyer_id, product_id 
   FROM product_purchases 
   WHERE buyer_email = 'test-user@example.com';
   -- buyer_id should be NULL
   ```

2. **Create a new user profile** (simulating signup):
   ```sql
   -- Create profile with matching email
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     gen_random_uuid(),
     'test-user@example.com',  -- Same email as guest purchase
     'Test User',
     'student'
   )
   RETURNING id, email;
   ```

3. **Verify the purchase was automatically linked**:
   ```sql
   -- Check if purchase is now linked
   SELECT id, buyer_email, buyer_id, product_id, product_type
   FROM product_purchases 
   WHERE buyer_email = 'test-user@example.com';
   -- buyer_id should now be set to the profile id from step 2
   ```

4. **Check trigger logs** (in Supabase logs):
   - Should see: `NOTICE: Auto-linked 1 guest purchase(s) for user ...`

---

### **Test 2: Email Case Insensitivity**

1. **Create guest purchase with lowercase email**:
   ```sql
   INSERT INTO product_purchases (
     product_id, product_type, buyer_email, buyer_id,
     purchase_price, amount_paid, payment_status, access_granted,
     payment_reference
   ) VALUES (
     'YOUR_COURSE_ID_HERE',
     'course',
     'case-test@example.com',  -- lowercase
     NULL,
     1000.00, 1000.00, 'success', true,
     'TEST_CASE_' || gen_random_uuid()::text
   );
   ```

2. **Create profile with different case**:
   ```sql
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     gen_random_uuid(),
     'Case-Test@Example.COM',  -- Different case
     'Case Test User',
     'student'
   )
   RETURNING id, email;
   ```

3. **Verify linking worked** (normalization handles case differences):
   ```sql
   SELECT buyer_email, buyer_id 
   FROM product_purchases 
   WHERE buyer_email ILIKE '%case-test%';
   -- Should be linked despite case difference
   ```

---

### **Test 3: Multiple Guest Purchases for Same Email**

1. **Create multiple guest purchases**:
   ```sql
   -- Get multiple course IDs
   SELECT id FROM courses LIMIT 3;
   
   -- Create 3 guest purchases for same email
   INSERT INTO product_purchases (
     product_id, product_type, buyer_email, buyer_id,
     purchase_price, amount_paid, payment_status, access_granted,
     payment_reference
   ) 
   SELECT 
     c.id,
     'course',
     'multi-test@example.com',
     NULL,
     1000.00, 1000.00, 'success', true,
     'MULTI_TEST_' || gen_random_uuid()::text
   FROM courses c
   LIMIT 3;
   ```

2. **Create profile**:
   ```sql
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     gen_random_uuid(),
     'multi-test@example.com',
     'Multi Purchase User',
     'student'
   )
   RETURNING id;
   ```

3. **Verify all purchases linked**:
   ```sql
   SELECT COUNT(*) as linked_count, buyer_id
   FROM product_purchases 
   WHERE buyer_email = 'multi-test@example.com'
   GROUP BY buyer_id;
   -- All 3 should have the same buyer_id
   ```

---

### **Test 4: Email Update Trigger**

1. **Create guest purchase**:
   ```sql
   INSERT INTO product_purchases (
     product_id, product_type, buyer_email, buyer_id,
     purchase_price, amount_paid, payment_status, access_granted,
     payment_reference
   ) VALUES (
     'YOUR_COURSE_ID_HERE',
     'course',
     'email-update@example.com',
     NULL,
     1000.00, 1000.00, 'success', true,
     'EMAIL_UPDATE_' || gen_random_uuid()::text
   );
   ```

2. **Create profile with different email first**:
   ```sql
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     gen_random_uuid(),
     'different@example.com',
     'Email Update User',
     'student'
   )
   RETURNING id, email;
   ```

3. **Update email to match guest purchase**:
   ```sql
   -- Get the profile ID from step 2
   UPDATE profiles 
   SET email = 'email-update@example.com'
   WHERE email = 'different@example.com'
   RETURNING id, email;
   ```

4. **Verify purchase was linked**:
   ```sql
   SELECT buyer_id, buyer_email 
   FROM product_purchases 
   WHERE buyer_email = 'email-update@example.com';
   -- buyer_id should now be set
   ```

---

### **Test 5: Real-World Flow (Via Admin UI)**

1. **Admin grants course access via email**:
   - Go to Admin → Manual Add to Library
   - Enter email: `ui-test@example.com` (user doesn't exist yet)
   - Select a course and add to library
   - Verify purchase created in database:
     ```sql
     SELECT buyer_email, buyer_id, access_granted
     FROM product_purchases
     WHERE buyer_email = 'ui-test@example.com';
     -- buyer_id should be NULL, access_granted should be true
     ```

2. **User signs up with same email**:
   - Use your app's signup form
   - Register with email: `ui-test@example.com`
   - Complete registration

3. **Verify automatic linking**:
   ```sql
   -- Get the new user's profile ID
   SELECT id, email FROM profiles WHERE email = 'ui-test@example.com';
   
   -- Check if purchase was linked
   SELECT buyer_id, buyer_email, product_id
   FROM product_purchases
   WHERE buyer_email = 'ui-test@example.com';
   -- buyer_id should match the profile id
   ```

4. **User should now have access**:
   - User logs in
   - Navigate to the course
   - Should have full access

---

## ✅ **VERIFICATION CHECKLIST**

After running tests, verify:

- [ ] Guest purchases are created with `buyer_id = NULL`
- [ ] When profile is created, trigger fires automatically
- [ ] Purchases are linked (buyer_id set) immediately after signup
- [ ] Case-insensitive email matching works
- [ ] Multiple purchases for same email all link correctly
- [ ] Email update trigger works
- [ ] Real-world flow (Admin grant → User signup → Access) works
- [ ] No errors in Supabase logs
- [ ] Profile creation never fails due to linking issues

---

## 🔍 **TROUBLESHOOTING**

### **Trigger not firing?**
```sql
-- Check if trigger exists
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%guest_purchase%';

-- Check trigger function exists
SELECT proname FROM pg_proc 
WHERE proname = 'auto_link_guest_purchases_on_signup';
```

### **Linking not working?**
```sql
-- Manually test the linking function
SELECT link_guest_purchases_to_user(
  'USER_ID_HERE',
  'test@example.com'
);

-- Check for guest purchases that should be linked
SELECT id, buyer_email, buyer_id 
FROM product_purchases 
WHERE buyer_email = 'test@example.com' 
  AND buyer_id IS NULL;
```

### **Check trigger logs:**
- Supabase Dashboard → Logs → Postgres Logs
- Look for NOTICE or WARNING messages about auto-linking

---

## 📝 **CLEANUP AFTER TESTING**

```sql
-- Remove test data
DELETE FROM product_purchases 
WHERE payment_reference LIKE 'TEST_%' 
   OR payment_reference LIKE 'MULTI_%' 
   OR payment_reference LIKE 'EMAIL_%';

DELETE FROM profiles 
WHERE email LIKE '%test%' 
  AND email LIKE '%@example.com';

-- Or more targeted cleanup:
-- DELETE FROM product_purchases WHERE buyer_email = 'specific-test-email@example.com';
-- DELETE FROM profiles WHERE email = 'specific-test-email@example.com';
```
