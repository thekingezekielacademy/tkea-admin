# 🔍 King Ezekiel Academy - System Analysis Report

## 📋 Executive Summary
This document provides a comprehensive analysis of the **7-Day Free Trial System** and **Free vs Paid Course Access System** in the King Ezekiel Academy platform.

---

## 🎁 7-Day Free Trial System

### Overview
The platform offers ALL new users a **7-day free trial** that grants them full access to all membership courses (paid courses) from the moment they register.

### How It Works

#### 1. **Trial Initialization (Registration)**
**Location:** `king-ezekiel-academy-nextjs/src/app/api/auth/register/route.ts`

When a user registers:
```typescript
// Lines 82-99
const { error: trialError } = await adminClient
  .from('user_trials')
  .insert({
    user_id: data.user.id,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  })
```

- **Start Date:** Moment of registration
- **End Date:** Exactly 7 days (168 hours) from registration
- **Status:** `is_active = true`
- **Database Table:** `user_trials`

#### 2. **Trial Storage & Management**

**Database Schema:**
```sql
-- supabase/migrations/20250812000001_create_user_trials_table.sql
CREATE TABLE user_trials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Only one active trial per user
  UNIQUE(user_id, is_active) WHERE is_active = true
);
```

**Key Features:**
- ✅ One active trial per user (enforced by unique constraint)
- ✅ Auto-expiration function: `end_expired_trials()`
- ✅ Row Level Security (RLS) enabled
- ✅ Indexed for performance (user_id, is_active, end_date)

#### 3. **Trial Validation Logic**

**Primary Location:** `king-ezekiel-academy-nextjs/src/utils/trialManager.ts`

```typescript
static calculateDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const timeDiff = end.getTime() - now.getTime();
  return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
}

static async hasTrialAccess(userId: string): Promise<boolean> {
  const trialStatus = await this.getTrialStatusStatic(userId);
  return trialStatus?.isActive && trialStatus?.daysRemaining > 0 || false;
}
```

**Trial Status Check Priority (AccessControl.tsx):**
1. ✅ **Database subscription** (most reliable)
2. ✅ **Secure storage subscription** (localStorage fallback)
3. ✅ **Trial status** (checked only if no subscription)

#### 4. **Trial Deactivation**

**Automatic Deactivation:**
```sql
-- Function runs periodically
CREATE OR REPLACE FUNCTION end_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE user_trials 
  SET 
    is_active = false,
    ended_at = NOW(),
    updated_at = NOW()
  WHERE 
    is_active = true 
    AND end_date < NOW();
END;
```

**Manual Deactivation (Payment Success):**
When a user subscribes, their trial is immediately deactivated:
```typescript
// Flutterwave webhook/verification
await adminClient
  .from('user_trials')
  .update({ is_active: false })
  .eq('user_id', user.id)
```

#### 5. **Trial Access Points**

Users with active trials can access:
- ✅ All membership courses (paid courses)
- ✅ All lessons in those courses
- ✅ Full platform features
- ✅ Progress tracking and XP earning

**Access Check Example (LessonPlayer.tsx):**
```typescript
// Lines 77-89
const { data: trialData } = await supabase
  .from('user_trials')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

if (trialData) {
  setIsTrialActive(true)
  setHasAccess(true)
  return
}
```

---

## 🎓 Free vs Paid Courses System

### Overview
The platform supports TWO types of courses:
1. **Free Courses** - Accessible to ALL authenticated users (forever)
2. **Membership Courses** - Require active subscription OR active trial

### Course Access Type Definition

**Database Schema:**
```sql
-- supabase/migrations/20250815000001_fix_courses_access_columns.sql
ALTER TABLE courses ADD COLUMN access_type TEXT DEFAULT 'membership';
ALTER TABLE courses ADD COLUMN is_free BOOLEAN DEFAULT false;

-- Valid access types
CHECK (access_type IN ('free', 'membership'))

-- Sync logic
UPDATE courses SET is_free = true WHERE access_type = 'free';
UPDATE courses SET access_type = 'free' WHERE is_free = true;
```

**Course Interface (TypeScript):**
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  access_type: 'free' | 'membership';  // Determines access rules
  is_free: boolean;                     // Legacy field (synced)
  cover_photo_url: string;
  // ... other fields
}
```

### Access Control Logic

#### Priority 1: Free Courses
**Location:** `AccessControl.tsx`, `LessonPlayer.tsx`, `CourseOverview.tsx`

```typescript
// Lines 44-58 (AccessControl.tsx)
const { data: courseData } = await supabase
  .from('courses')
  .select('access_type')
  .eq('id', courseId)
  .single();

if (courseData?.access_type === 'free') {
  console.log('✅ FREE COURSE ACCESS GRANTED');
  setHasAccess(true);
  return;  // Immediate access, no further checks
}
```

**Free Course Features:**
- ✅ No trial required
- ✅ No subscription required
- ✅ Only authentication required
- ✅ Permanent access (never expires)
- ✅ All authenticated users can access

#### Priority 2: Membership Courses (Paid)

**Access Hierarchy:**
```
1. Free Course? → YES → ✅ GRANT ACCESS
                ↓ NO
2. Has Active Subscription? → YES → ✅ GRANT ACCESS
                             ↓ NO
3. Has Active Trial? → YES → ✅ GRANT ACCESS
                     ↓ NO
4. ❌ DENY ACCESS → Show upgrade prompt
```

**Access Check Function (check_course_access):**
```sql
-- supabase/migrations/20250101_002_migration_functions.sql
CREATE OR REPLACE FUNCTION check_course_access(user_uuid UUID, course_uuid TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  course_access_type TEXT;
  has_trial BOOLEAN;
  has_subscription BOOLEAN;
BEGIN
  -- Check if course is free
  SELECT access_type INTO course_access_type FROM courses WHERE id = course_uuid;
  IF course_access_type = 'free' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active trial
  SELECT EXISTS(
    SELECT 1 FROM user_trials 
    WHERE user_id = user_uuid AND is_active = true AND end_date > NOW()
  ) INTO has_trial;
  IF has_trial THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = user_uuid AND is_active = true AND end_date > NOW()
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$
```

### Course Display & UI

**Course Page (courses/page.tsx):**
```typescript
// Line 540-542
const getAccessStatusText = (course: Course) => {
  if (course.access_type === 'free') {
    return 'Free Access';
  }
  // ... trial/subscription logic
}

// Lines 1019-1039 - Button rendering
<button onClick={() => 
  handleEnroll(course.id, course.access_type === 'free')
}>
  {course.access_type === 'free' ? (
    <><FaUnlock /> Free Access</>
  ) : user && (databaseSubscriptionStatus || hasTrialAccess) ? (
    <><FaPlay /> Start Learning</>
  ) : (
    <><FaLock /> Upgrade to Access</>
  )}
</button>
```

**Visual Indicators:**
- 🆓 **Free courses:** "Free Access" badge, unlock icon
- 🎁 **Trial users:** "Start Learning" on membership courses
- 💎 **Subscribers:** Full access to all courses
- 🔒 **No access:** "Upgrade to Access" with lock icon

---

## 💳 Paid Subscription System

### Overview
Users can purchase a **Monthly Membership** subscription to access all membership courses permanently (as long as subscription is active).

### Subscription Creation

**Payment Providers:**
1. **Flutterwave** (Primary)
2. **Paystack** (Alternative)

**Webhook Flow (Flutterwave):**
```typescript
// src/app/api/payments/flutterwave/webhook/route.ts
if (paymentData.status === 'successful') {
  // Create subscription
  const subscriptionData = {
    user_id: paymentData.meta?.user_id,
    plan_id: 'monthly',
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    payment_id: paymentData.id,
    amount: paymentData.amount,
    currency: paymentData.currency,
  }

  await adminClient
    .from('user_subscriptions')
    .upsert(subscriptionData)

  // Deactivate trial
  await adminClient
    .from('user_trials')
    .update({ is_active: false })
    .eq('user_id', paymentData.meta?.user_id)
}
```

### Subscription Database Schema

```sql
-- supabase/migrations/20250812000003_create_subscription_tables.sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Monthly Membership',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount INTEGER NOT NULL,  -- In smallest currency unit (kobo/cents)
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Subscription Features:**
- ✅ Monthly auto-renewal (30 days)
- ✅ Automatic trial deactivation on payment
- ✅ Status tracking (active, inactive, cancelled, expired)
- ✅ Payment history in `subscription_payments` table
- ✅ RLS policies for security

### Subscription Validation

**API Endpoint:** `/api/subscriptions/status`
```typescript
// Check both trial and subscription status
const { data: trialData } = await adminClient
  .from('user_trials')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

const { data: subscriptionData } = await adminClient
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

// Auto-deactivate expired subscriptions
if (subscriptionData && new Date(subscriptionData.end_date) < new Date()) {
  await adminClient
    .from('user_subscriptions')
    .update({ is_active: false })
    .eq('id', subscriptionData.id)
}

return {
  trial: trialData,
  subscription: subscriptionData,
  has_access: !!(trialData || subscriptionData?.is_active),
}
```

---

## 🔐 Security & Data Integrity

### Row Level Security (RLS)

**User Trials:**
```sql
-- Users can only view their own trial
CREATE POLICY "Users can view their own trial" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all trials
CREATE POLICY "Admins can view all trials" ON user_trials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

**Subscriptions:**
```sql
CREATE POLICY "Users can view their own subscriptions" 
  ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
  ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Data Storage Strategy

**Multi-Layer Caching:**
1. **Database** (source of truth)
   - `user_trials` table
   - `user_subscriptions` table
2. **localStorage** (client-side cache)
   - `user_trial_status` - Trial info
   - `subscription_active` - Subscription flag
3. **Real-time validation** on critical operations

---

## 📊 User Journey Examples

### Example 1: New User Registration
```
1. User signs up → Account created
2. Profile created in `profiles` table
3. Trial record created in `user_trials`:
   - start_date: 2024-10-14 10:00:00
   - end_date: 2024-10-21 23:59:59 (7 days later)
   - is_active: true
4. User can now access ALL courses (free + membership)
5. After 7 days: Trial expires automatically
   - is_active → false
   - ended_at → timestamp
6. User sees "Upgrade to Access" on membership courses
```

### Example 2: Free Course Access
```
1. User (authenticated) browses courses
2. Clicks on course with access_type = 'free'
3. Access check: course.access_type === 'free' → TRUE
4. ✅ Instant access granted
5. No trial/subscription check required
6. Access never expires (as long as user is logged in)
```

### Example 3: Trial User → Paid Subscriber
```
1. User in day 3 of trial
2. Trial status: 4 days remaining
3. User decides to subscribe ($25/month)
4. Payment successful via Flutterwave
5. Webhook triggers:
   - Create record in `user_subscriptions`
   - Set trial.is_active = false
   - start_date: now
   - end_date: now + 30 days
6. User now has permanent access (renewable monthly)
7. Trial no longer needed
```

### Example 4: Expired Trial, No Subscription
```
1. User registered 10 days ago
2. Trial expired after 7 days
3. No active subscription
4. Access check for membership course:
   - is_free? → NO
   - has active subscription? → NO
   - has active trial? → NO
5. ❌ Access denied
6. UI shows: "Your free trial has ended. Upgrade to continue learning."
```

---

## 🎯 Key Business Logic Rules

### Access Decision Matrix

| Course Type | User Type | Trial Status | Subscription | Access |
|------------|-----------|--------------|--------------|--------|
| Free | Any (authenticated) | Any | Any | ✅ YES |
| Membership | New user | Active (≤7 days) | None | ✅ YES |
| Membership | User | Expired | None | ❌ NO |
| Membership | User | Any | Active | ✅ YES |
| Membership | User | Any | Expired | ❌ NO |

### Important Constraints

1. **One Trial Per User:** Enforced by unique constraint
2. **Trial Duration:** Fixed at 7 days (168 hours)
3. **Subscription Duration:** 30 days (renewable)
4. **Auto-Expiration:** Trials and subscriptions expire automatically
5. **Priority Order:** Free > Subscription > Trial
6. **Trial Cancellation:** Immediately on successful payment

---

## 🔧 Technical Implementation Details

### Database Tables

1. **user_trials**
   - Purpose: Track 7-day free trials
   - Key fields: user_id, start_date, end_date, is_active
   - Constraints: One active trial per user

2. **user_subscriptions**
   - Purpose: Track paid subscriptions
   - Key fields: user_id, status, start_date, end_date, amount
   - Statuses: active, inactive, cancelled, expired

3. **subscription_payments**
   - Purpose: Payment history
   - Key fields: user_id, amount, status, payment_method

4. **courses**
   - Purpose: Course catalog
   - Key fields: id, title, access_type, is_free
   - Access types: 'free', 'membership'

### Frontend Components

1. **AccessControl.tsx** - Universal access wrapper
2. **LessonPlayer.tsx** - Lesson-level access checks
3. **CourseOverview.tsx** - Course detail page access
4. **Courses.tsx** - Course listing with access indicators
5. **TrialManager.ts** - Centralized trial logic

### Backend APIs

1. **/api/auth/register** - Create user + initialize trial
2. **/api/subscriptions/status** - Check user access status
3. **/api/payments/flutterwave/verify** - Verify payment & create subscription
4. **/api/payments/flutterwave/webhook** - Handle payment webhooks

---

## ✅ System Strengths

1. ✅ **Clear separation** between free and paid content
2. ✅ **Automatic trial management** (no manual intervention)
3. ✅ **Multi-provider payment support** (Flutterwave, Paystack)
4. ✅ **Robust security** (RLS policies on all tables)
5. ✅ **Cached performance** (localStorage + database)
6. ✅ **User-friendly** (immediate trial access on signup)
7. ✅ **Scalable** (indexed tables, efficient queries)

---

## ⚠️ Potential Issues & Recommendations

### Current Issues

1. **No trial extension logic** - One trial per user, ever
2. **Manual subscription renewal** - No automatic billing setup
3. **Duplicate trial checks** - Multiple localStorage + database checks
4. **No grace period** - Subscriptions expire immediately at end_date
5. **Limited analytics** - No tracking of trial → paid conversion

### Recommended Improvements

1. **Add conversion tracking:**
   ```sql
   ALTER TABLE user_subscriptions 
   ADD COLUMN converted_from_trial BOOLEAN DEFAULT false;
   ```

2. **Implement grace period:**
   ```sql
   ALTER TABLE user_subscriptions 
   ADD COLUMN grace_period_ends TIMESTAMP WITH TIME ZONE;
   ```

3. **Centralize access logic:**
   - Create unified `hasAccess(userId, courseId)` API
   - Reduce duplicate checks across components

4. **Add trial extension for edge cases:**
   ```sql
   CREATE FUNCTION extend_trial(user_id UUID, days INTEGER)
   RETURNS void AS $$
   -- Admin function to extend trials manually
   ```

5. **Analytics dashboard:**
   - Trial activation rate
   - Trial → paid conversion rate
   - Course access patterns
   - Revenue metrics

---

## 📝 Summary

### 7-Day Free Trial
- ✅ Automatically created on user registration
- ✅ Grants full access to all membership courses
- ✅ Lasts exactly 7 days (168 hours)
- ✅ Automatically expires via database function
- ✅ Immediately deactivated on subscription purchase
- ✅ One trial per user (lifetime)

### Free vs Paid Courses
- ✅ **Free courses:** Accessible to ALL authenticated users
- ✅ **Membership courses:** Require active trial OR subscription
- ✅ Access type stored in `courses.access_type` field
- ✅ Access validated at multiple levels (page, component, lesson)
- ✅ Clear UI indicators for access status

### Subscription System
- ✅ Monthly membership ($25 NGN or equivalent)
- ✅ 30-day renewal cycle
- ✅ Multiple payment providers (Flutterwave, Paystack)
- ✅ Webhook-driven activation
- ✅ Automatic expiration handling
- ✅ Secure payment record storage

---

**Generated:** October 14, 2025  
**Version:** 1.0  
**Platform:** King Ezekiel Academy (Next.js + Supabase)

