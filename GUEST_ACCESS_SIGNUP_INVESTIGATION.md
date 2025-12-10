# 🔍 Guest Access Signup Investigation Report

## ❌ **PROBLEM STATEMENT**

When an admin grants course access to a guest user via email (using Manual Add to Library), the user **does not automatically receive access** when they sign up with the same email address.

---

## ✅ **WHAT'S WORKING CORRECTLY**

1. **Admin Manual Grant Flow** ✅
   - `ManualAddToLibrary.tsx` correctly creates purchase records
   - Sets `buyer_email` to the provided email
   - Sets `buyer_id = NULL` for guest users (line 244-246)
   - Purchase is created with `access_granted = true` and `payment_status = 'success'`

2. **Database Function** ✅
   - `link_guest_purchases_to_user()` function exists and works correctly
   - Properly normalizes emails (LOWER/TRIM)
   - Updates `buyer_id` for matching guest purchases

3. **Login Flow** ✅
   - `AuthContext.tsx` calls `linkGuestPurchases()` in `signIn()` method (line 212-217)
   - Also calls it in `onAuthStateChange` listener (lines 82-92)

---

## ❌ **THE ISSUE**

### **Root Cause: Missing Linking on Signup**

The `linkGuestPurchases()` function is **NOT being called** during the signup/registration flow in a reliable way:

1. **AuthContext.tsx has NO signUp method**
   - The current admin app's `AuthContext` only has `signIn()` and `signOut()`
   - There's no explicit `signUp()` method that calls `linkGuestPurchases()`

2. **Linking relies on `onAuthStateChange` listener**
   - The linking happens in the `onAuthStateChange` event (lines 82-92)
   - **BUT** this might fire before the profile is fully created
   - **OR** the signup might happen in a different app/route that doesn't trigger this

3. **Next.js Registration Route Missing Linking**
   - `king-ezekiel-academy-nextjs/src/app/api/auth/register/route.ts` 
   - Creates the user and profile but **DOES NOT call `linkGuestPurchases()`**
   - This is likely where users are actually signing up

4. **Server-side Auth Route Missing Linking**
   - `server/routes/auth.js` (Express route) also doesn't call linking after registration

---

## 📊 **CURRENT FLOW DIAGRAM**

```
Admin Grants Access (ManualAddToLibrary)
  ↓
Creates purchase: buyer_email="user@example.com", buyer_id=NULL ✅
  ↓
User Signs Up
  ↓
Profile Created
  ↓
onAuthStateChange fires (might be too early or missed)
  ↓
linkGuestPurchases() may or may not run ❌
  ↓
Result: Purchase remains unlinked (buyer_id still NULL) ❌
```

---

## 🔧 **RECOMMENDED SOLUTION**

### **Option 1: Ensure Linking in AuthContext on Signup (Recommended)**

Add explicit linking after signup is complete. Since `onAuthStateChange` already handles it, the issue might be:
- Timing: Profile not ready yet
- Email case sensitivity differences
- Signup happening in different codebase

**Enhancement**: Make the linking more robust with retry logic:

```typescript
// In AuthContext.tsx - enhance onAuthStateChange
useEffect(() => {
  // ... existing code ...
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
      
      // Link guest purchases with retry logic
      if (session.user.email) {
        let retries = 3;
        let linked = false;
        
        while (retries > 0 && !linked) {
          try {
            const result = await linkGuestPurchases(session.user.id, session.user.email);
            if (result.linked > 0) {
              console.log(`✅ Linked ${result.linked} guest purchase(s)`);
              linked = true;
            } else {
              // Wait a bit before retry (profile might still be creating)
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries--;
            }
          } catch (error) {
            console.error('Error linking guest purchases:', error);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }
    }
  });
}, []);
```

### **Option 2: Add Linking to Registration API Route**

If signup happens via API route (`/api/auth/register`), add linking there:

```typescript
// In king-ezekiel-academy-nextjs/src/app/api/auth/register/route.ts
import { linkGuestPurchases } from '@/utils/courseAccess'; // Need to create this

// After profile creation:
if (data.user && data.user.email) {
  // Link any guest purchases
  try {
    await linkGuestPurchases(data.user.id, data.user.email.toLowerCase().trim());
  } catch (linkError) {
    console.error('Failed to link guest purchases:', linkError);
    // Don't fail registration if linking fails
  }
}
```

### **Option 3: Database Trigger (Most Reliable)**

Create a database trigger that automatically links purchases when a profile is created:

```sql
-- Trigger function to auto-link guest purchases on profile creation
CREATE OR REPLACE FUNCTION auto_link_guest_purchases_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize email for comparison
  PERFORM link_guest_purchases_to_user(
    NEW.id,
    LOWER(TRIM(NEW.email))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after profile insert
CREATE TRIGGER trigger_auto_link_guest_purchases
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_link_guest_purchases_on_signup();

-- Also trigger on email update (in case user changes email)
CREATE TRIGGER trigger_auto_link_guest_purchases_on_update
AFTER UPDATE OF email ON profiles
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION auto_link_guest_purchases_on_signup();
```

**Advantages of Trigger Approach:**
- ✅ Always runs when profile is created
- ✅ Works regardless of which app/codebase creates the user
- ✅ Automatic and foolproof
- ✅ No code changes needed in multiple places
- ✅ Works even if called from server routes, API routes, or direct DB inserts

---

## 🎯 **IMPLEMENTATION PRIORITY**

### **Phase 1: Immediate Fix (Database Trigger)**
1. Create database trigger function (most reliable)
2. Test with a guest purchase and new signup

### **Phase 2: Code Enhancements**
1. Add retry logic to `AuthContext` linking
2. Add linking to registration API routes if they exist
3. Ensure email normalization is consistent everywhere

### **Phase 3: Verification**
1. Test complete flow: Admin grant → User signup → Access verified
2. Add logging/monitoring to track linking success
3. Create admin tool to manually trigger linking if needed

---

## 🔍 **ADDITIONAL CONSIDERATIONS**

### **Email Normalization**
- ✅ ManualAddToLibrary normalizes: `email.toLowerCase().trim()`
- ✅ linkGuestPurchases normalizes: `userEmail.toLowerCase().trim()`
- ✅ Database function normalizes: `LOWER(TRIM(p_user_email))`
- **Ensure consistency everywhere emails are compared**

### **Edge Cases**
1. **User signs up with different email case** - Should work (normalization handles it)
2. **User already exists but email wasn't linked** - Need manual linking tool
3. **Multiple guest purchases for same email** - All should link at once
4. **Profile creation fails but auth user created** - Trigger won't fire (expected)

### **Your Suggestion (Email in Guest Access)**

You suggested: *"Also include email in the users guest access, so when the user signs up the onboarding process would check if they have any courses in guest access"*

**This is already implemented!** ✅
- `product_purchases.buyer_email` column exists
- `link_guest_purchases_to_user()` function checks for matching emails
- The issue is just that linking isn't being called reliably during signup

---

## 📝 **RECOMMENDED ACTION PLAN**

### **Immediate (Today)**
1. ✅ Create database trigger to auto-link on profile creation
2. ✅ Test the trigger with a guest purchase + new signup

### **Short-term (This Week)**
1. Add retry logic to AuthContext linking
2. Verify all registration paths call linking
3. Add logging to track linking success/failures

### **Long-term (Monitoring)**
1. Create admin dashboard to see guest purchases waiting to be linked
2. Add manual "Link Guest Purchases" button for admins
3. Add email notification when guest purchases are linked

---

## 🧪 **TESTING CHECKLIST**

- [ ] Admin grants course to guest email (e.g., `test@example.com`)
- [ ] Verify purchase created: `buyer_email='test@example.com'`, `buyer_id=NULL`
- [ ] New user signs up with `test@example.com`
- [ ] Verify trigger/linking runs
- [ ] Verify purchase updated: `buyer_id` now set to new user ID
- [ ] Verify user can access the course
- [ ] Test with different email cases (Test@Example.com vs test@example.com)
- [ ] Test multiple guest purchases for same email

---

## 💡 **MY RECOMMENDATION**

**Use Option 3 (Database Trigger) as the primary solution** because:
1. ✅ Most reliable - always runs when profile is created
2. ✅ Works across all codebases (admin app, Next.js app, API routes)
3. ✅ No code changes needed in multiple places
4. ✅ Future-proof - works even if new registration methods are added

**Keep Option 1/2 as backup** for additional reliability, but the trigger should handle the primary case.

---

## ✅ **IMPLEMENTATION COMPLETE**

**Migration Created:** `20250120_008_auto_link_guest_purchases_trigger.sql`

This migration creates:
1. ✅ Trigger function `auto_link_guest_purchases_on_signup()` that calls the linking function
2. ✅ Trigger on `profiles` INSERT - fires when new user signs up
3. ✅ Trigger on `profiles` UPDATE (email changes) - handles email updates
4. ✅ Error handling - won't fail profile creation if linking fails
5. ✅ Logging - provides notices/warnings for debugging

**Next Steps:**
1. Run the migration in Supabase SQL editor
2. Test with a guest purchase + new signup
3. Verify purchases are automatically linked
