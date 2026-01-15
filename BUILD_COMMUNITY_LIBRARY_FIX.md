# BUILD COMMUNITY Library Fix - Investigation Report

## Problem
User granted BUILD COMMUNITY access via admin panel, received email successfully, but **no courses appear in their library**.

## Root Cause Analysis

### Issue 1: Library Only Shows Courses With Progress
The `CourseProgressService.getUserCourseProgress()` method was only returning courses that had progress data (from `user_lesson_progress` or `user_progress_summary`). It did NOT query `product_purchases` to show courses that were purchased but not yet started.

**Location:** `king-ezekiel-academy-nextjs/src/services/courseProgressService.ts`

**Previous Behavior:**
- Only returned courses with lesson progress
- Purchased courses without progress = **not shown in library**

### Issue 2: Guest Purchase Linking
If a user was granted access as a guest (only `buyer_email`, no `buyer_id`), the courses wouldn't show until:
1. User signs up/signs in
2. Guest purchases are linked via `link_guest_purchases_to_user()` function

## Solution Implemented

### Fix 1: Query product_purchases for ALL Purchased Courses
Updated `getUserCourseProgress()` to:
1. Get courses with progress (existing behavior)
2. **ALSO query `product_purchases` table** to get ALL purchased courses
3. Find purchased courses that don't have progress yet
4. Add them to the library with 0% progress

### Fix 2: Auto-Link Guest Purchases
Added fallback logic:
1. If no purchases found by `buyer_id`, check by `buyer_email`
2. If guest purchases found, automatically link them to user account
3. This ensures courses show up immediately even if granted as guest

## Code Changes

**File:** `king-ezekiel-academy-nextjs/src/services/courseProgressService.ts`

**Key Changes:**
```typescript
// Step 2: Get user's email for fallback query
const { data: userProfile } = await supabase
  .from('profiles')
  .select('email')
  .eq('id', userId)
  .single();

// Step 3: Get ALL purchased courses from product_purchases
// First try by buyer_id
let { data: purchases } = await supabase
  .from('product_purchases')
  .select('product_id, product_type, access_granted_at')
  .eq('buyer_id', userId)
  .eq('product_type', 'course')
  .eq('payment_status', 'success')
  .eq('access_granted', true);

// If no purchases found by buyer_id, try by email (for guest purchases)
if ((!purchases || purchases.length === 0) && userProfile?.email) {
  // Check by buyer_email and auto-link
  ...
}

// Step 4: Add purchased courses without progress to library
if (missingCourseIds.length > 0) {
  // Fetch course details and add with 0% progress
  ...
}
```

## Testing Checklist

- [ ] User with existing account granted BUILD COMMUNITY access → Courses appear in library
- [ ] Guest user granted access → Courses appear after signup/login
- [ ] User with some progress → All purchased courses show (with and without progress)
- [ ] User refreshes library page → Courses persist

## Deployment Status
✅ Committed and pushed to GitHub
⏳ Needs deployment to Next.js app (not admin panel)

## Next Steps
1. Deploy the Next.js app to production
2. Test with a user who was granted BUILD COMMUNITY access
3. Verify courses appear in library immediately
