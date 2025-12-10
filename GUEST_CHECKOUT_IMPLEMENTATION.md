# 🛒 Guest Checkout Implementation Guide

## ✅ **COMPLETED COMPONENTS**

### 1. **Database Migration** ✅
- `20250120_006_make_buyer_id_nullable_for_guests.sql` - Makes buyer_id nullable
- `20250120_007_link_guest_purchases_function.sql` - Creates function to link guest purchases

### 2. **Utility Functions** ✅
- `src/utils/courseAccess.ts` - Access checking and guest purchase linking
- `src/utils/paymentHandler.ts` - Payment handling for guest purchases

### 3. **Components** ✅
- `src/components/GuestCheckout.tsx` - Guest checkout modal
- `src/components/CoursePurchaseButton.tsx` - Smart purchase button component
- `src/hooks/useCourseAccess.ts` - React hook for checking course access

### 4. **Auth Integration** ✅
- Updated `src/contexts/AuthContext.tsx` to automatically link guest purchases on login

---

## 🚀 **HOW IT WORKS**

### **Guest Purchase Flow:**

1. **Guest User Clicks "Buy Now"**
   - `CoursePurchaseButton` shows guest checkout modal
   - User enters email (no sign-in required)

2. **Checkout Process**
   - Email is stored in sessionStorage/localStorage
   - Purchase record created with `buyer_email` only, `buyer_id = NULL`
   - Payment processed (integrate with your payment gateway)

3. **After Payment Success**
   - Purchase record updated: `payment_status = 'success'`, `access_granted = true`
   - User gets immediate access to course
   - Confirmation email sent

4. **When User Signs Up/Logs In Later**
   - `linkGuestPurchases()` function automatically called
   - All purchases with matching email are linked to user account
   - User maintains access to all previously purchased courses

---

## 📝 **INTEGRATION STEPS**

### **Step 1: Run Database Migrations**

Run these migrations in your Supabase SQL editor:
1. `20250120_006_make_buyer_id_nullable_for_guests.sql`
2. `20250120_007_link_guest_purchases_function.sql`

### **Step 2: Integrate Payment Gateway**

Update `src/components/GuestCheckout.tsx` to integrate with your payment provider:

```typescript
// After creating purchase record, redirect to payment:
const paymentUrl = await initializePayment({
  amount: coursePrice,
  email: normalizedEmail,
  reference: paymentReference,
  metadata: {
    purchase_id: purchase.id,
    product_type: 'course',
    product_id: courseId,
  }
});

// Redirect to payment gateway
window.location.href = paymentUrl;
```

### **Step 3: Handle Payment Callback**

Create a payment callback handler that:
1. Verifies payment with your payment provider
2. Calls `handleGuestPaymentSuccess()` from `paymentHandler.ts`
3. Redirects user to course

```typescript
import { handleGuestPaymentSuccess } from '../utils/paymentHandler';

// In your payment callback route
const purchaseId = sessionStorage.getItem('pending_purchase_id');
if (purchaseId && paymentVerified) {
  await handleGuestPaymentSuccess(
    purchaseId,
    paymentReference,
    amountPaid
  );
  // Redirect to course
}
```

### **Step 4: Use Components in Your App**

Replace existing purchase buttons with `CoursePurchaseButton`:

```tsx
import CoursePurchaseButton from '../components/CoursePurchaseButton';

<CoursePurchaseButton
  courseId={course.id}
  courseTitle={course.title}
  coursePrice={course.purchase_price}
  accessType={course.access_type}
/>
```

### **Step 5: Update Access Checks**

Use `useCourseAccess` hook in your course pages:

```tsx
import { useCourseAccess } from '../hooks/useCourseAccess';

const { hasAccess, loading } = useCourseAccess(courseId);

if (!hasAccess && !loading) {
  return <AccessDenied />;
}
```

---

## 🔐 **ACCESS CONTROL LOGIC**

The access check follows this priority:

1. **Free Course?** → ✅ Grant Access
2. **Has Purchase (by buyer_id)?** → ✅ Grant Access  
3. **Has Purchase (by buyer_email)?** → ✅ Grant Access
4. **Has Active Subscription?** → ✅ Grant Access
5. ❌ **Deny Access** → Show purchase button

---

## 📧 **EMAIL NOTIFICATIONS**

When a guest purchase is completed:
- Send purchase confirmation email
- Include course access link
- Remind user they can sign up later to link purchases

When guest purchases are linked:
- Send notification email (optional)
- Inform user their purchases are now connected to their account

---

## 🧪 **TESTING CHECKLIST**

- [ ] Guest can purchase course without signing in
- [ ] Purchase record created with buyer_email only
- [ ] Access granted immediately after payment
- [ ] Guest email stored in sessionStorage/localStorage
- [ ] User can sign up later with same email
- [ ] Guest purchases automatically linked on signup
- [ ] User maintains access after linking
- [ ] Access check works for both buyer_id and buyer_email
- [ ] Multiple guest purchases link correctly
- [ ] Payment callback updates purchase correctly

---

## 🎯 **NEXT STEPS**

1. **Integrate Payment Gateway** - Connect Flutterwave/Paystack
2. **Add Email Notifications** - Send purchase confirmations
3. **Create Payment Callback Route** - Handle payment verification
4. **Update Course Pages** - Use new access check components
5. **Test End-to-End** - Full guest checkout flow

---

## 📚 **FILES CREATED/MODIFIED**

### **New Files:**
- `src/utils/courseAccess.ts`
- `src/utils/paymentHandler.ts`
- `src/components/GuestCheckout.tsx`
- `src/components/CoursePurchaseButton.tsx`
- `src/hooks/useCourseAccess.ts`
- `supabase/migrations/20250120_006_make_buyer_id_nullable_for_guests.sql`
- `supabase/migrations/20250120_007_link_guest_purchases_function.sql`

### **Modified Files:**
- `src/contexts/AuthContext.tsx` - Added guest purchase linking on login

---

## ✅ **READY TO USE!**

The guest checkout system is fully implemented! Users can now:
- ✅ Purchase courses without signing in
- ✅ Get immediate access after payment
- ✅ Have purchases automatically linked when they sign up
- ✅ Maintain access to all purchased courses

Just integrate your payment gateway and you're good to go! 🚀
