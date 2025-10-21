# Console Errors Investigation Report

## Date: October 18, 2025

## Issues Identified

### 1. 🔴 CRITICAL: Missing `is_active` Column in `user_subscriptions` Table

**Error:**
```
GET https://evqerkqiquwxqlizdqmg.supabase.co/rest/v1/user_subscriptions?select=*&user_id=eq.75b5402a-ae0d-4a8c-9700-8736fe722af6&status=eq.active&is_active=eq.true 400 (Bad Request)
❌ Database subscription query error: {code: '42703', details: null, hint: null, message: 'column user_subscriptions.is_active does not exist'}
```

**Location:** `/king-ezekiel-academy-nextjs/src/app/dashboard/page.tsx:148`

**Root Cause:** 
The code queries `user_subscriptions` table with `.eq('is_active', true)`, but this column doesn't exist in the database schema. The table only has a `status` column.

**Impact:** 
- Subscription status checks fail
- Users cannot verify if they have active subscriptions
- Dashboard shows incorrect subscription state

---

### 2. 🔴 CRITICAL: Missing `user_progress_summary` View

**Error:**
```
GET https://evqerkqiquwxqlizdqmg.supabase.co/rest/v1/user_progress_summary?select=*&user_id=eq.75b5402a-ae0d-4a8c-9700-8736fe722af6 404 (Not Found)
```

**Location:** `/king-ezekiel-academy-nextjs/src/services/courseProgressService.ts:22-26, 200-204`

**Root Cause:**
The `CourseProgressService` tries to use a database view called `user_progress_summary` that doesn't exist. The code has a fallback to manual calculation, but the initial query still fails.

**Impact:**
- Dashboard course progress loading is slower (falls back to manual calculation)
- Extra database queries are made
- Console shows errors even though functionality works via fallback

---

### 3. ⚠️ MEDIUM: Multiple GoTrueClient Instances

**Error:**
```
Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
```

**Location:** Multiple locations create Supabase clients:
- `/king-ezekiel-academy-nextjs/src/contexts/AuthContextOptimized.tsx` (lines 72, 158, 192, 238, 279, 327, 394, 409)
- `/king-ezekiel-academy-nextjs/src/app/dashboard/page.tsx` (lines 142, 205, 310)
- `/king-ezekiel-academy-nextjs/src/services/courseProgressService.ts` (uses imported singleton)

**Root Cause:**
Multiple components are calling `createClient()` which creates new Supabase client instances instead of reusing a singleton. The client.ts has a singleton pattern, but it's not being consistently enforced.

**Impact:**
- Potential race conditions with auth state
- Increased memory usage
- Possible undefined behavior with concurrent operations

---

### 4. ℹ️ INFO: Facebook Pixel Network Error

**Error:**
```
GET https://connect.facebook.net/en_US/fbevents.js net::ERR_INTERNET_DISCONNECTED
```

**Location:** `/king-ezekiel-academy-nextjs/src/app/layout.tsx:91`

**Root Cause:**
Facebook Pixel script is trying to load but:
1. User might be offline/have poor connection
2. Ad blocker might be blocking Facebook domains
3. Network firewall might be blocking the request

**Impact:**
- Facebook Pixel tracking doesn't work (not critical for app functionality)
- Shows error in console (cosmetic issue)
- No impact on user experience

---

## Solutions

### Solution 1: Fix `user_subscriptions` Schema

**Option A: Add `is_active` column to database** (Recommended)
```sql
-- Add is_active column with default true for active subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing records based on status
UPDATE user_subscriptions 
SET is_active = (status = 'active');

-- Create index for performance
CREATE INDEX idx_user_subscriptions_is_active 
ON user_subscriptions(user_id, is_active) 
WHERE is_active = true;
```

**Option B: Remove `is_active` from queries** (Quick fix)
```typescript
// Remove the .eq('is_active', true) filter from dashboard/page.tsx:148
const { data: subData, error: subError } = await supabase
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')  // Only use status column
  .order('created_at', { ascending: false })
  .limit(1);
```

### Solution 2: Create `user_progress_summary` View or Remove Dependency

**Option A: Create the view in database** (Recommended)
```sql
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  ulp.user_id,
  ulp.course_id,
  c.title as course_title,
  COUNT(DISTINCT ulp.lesson_id) as total_lessons,
  COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END) as completed_lessons,
  ROUND(
    (COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END)::numeric / 
     NULLIF(COUNT(DISTINCT ulp.lesson_id), 0)) * 100
  ) as progress_percentage,
  MAX(ulp.started_at) as last_accessed,
  MAX(ulp.completed_at) as last_lesson_completed
FROM user_lesson_progress ulp
JOIN courses c ON c.id = ulp.course_id
GROUP BY ulp.user_id, ulp.course_id, c.title;
```

**Option B: Remove view dependency** (Quick fix)
Remove the initial view query and go straight to manual calculation.

### Solution 3: Fix Multiple Supabase Client Instances

**Enforce singleton pattern:**
```typescript
// Update client.ts to throw error if multiple instances are attempted
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let clientCreationCount = 0;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  clientCreationCount++;
  if (clientCreationCount > 1) {
    console.warn('Multiple createClient calls detected. Reusing existing instance.');
    if (supabaseClient) return supabaseClient;
  }

  // ... rest of creation logic
}
```

**Alternative:** Create a context to share the client:
```typescript
// Create SupabaseContext to share a single client instance
const SupabaseContext = createContext<SupabaseClient | null>(null);

export const useSupabase = () => {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider');
  return client;
};
```

### Solution 4: Handle Facebook Pixel Gracefully

**Wrap in try-catch and check for network:**
```typescript
// Add error handling for Facebook Pixel
try {
  if (navigator.onLine && typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }
} catch (error) {
  console.debug('Facebook Pixel not loaded (might be blocked)');
}
```

---

## Priority Fixes

### High Priority (Fix Immediately)
1. ✅ Remove `is_active` filter from subscription queries OR add column to database
2. ✅ Create `user_progress_summary` view OR remove initial query attempt

### Medium Priority (Fix Soon)
3. ⚠️ Fix multiple Supabase client instances

### Low Priority (Optional)
4. ℹ️ Add graceful handling for Facebook Pixel errors

---

## Testing Checklist

After fixes:
- [ ] Dashboard loads without console errors
- [ ] Subscription status displays correctly
- [ ] Course progress shows accurate data
- [ ] No "Multiple GoTrueClient" warnings
- [ ] Facebook Pixel error is handled gracefully
- [ ] User authentication works correctly
- [ ] Profile fetching works without errors

---

## Files to Modify

1. `/king-ezekiel-academy-nextjs/src/app/dashboard/page.tsx` - Remove `is_active` filter
2. `/king-ezekiel-academy-nextjs/src/services/courseProgressService.ts` - Remove or fix view dependency
3. `/king-ezekiel-academy-nextjs/src/lib/supabase/client.ts` - Enforce singleton
4. `/king-ezekiel-academy-nextjs/src/app/layout.tsx` - Add error handling for Facebook Pixel

---

## SQL Migrations Needed

### Migration 1: Add `is_active` column
```sql
-- File: add_is_active_to_subscriptions.sql
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE user_subscriptions 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active 
ON user_subscriptions(user_id, is_active) 
WHERE is_active = true;
```

### Migration 2: Create progress summary view
```sql
-- File: create_user_progress_summary_view.sql
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  ulp.user_id,
  ulp.course_id,
  c.title as course_title,
  COUNT(DISTINCT ulp.lesson_id) as total_lessons,
  COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END) as completed_lessons,
  ROUND(
    (COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END)::numeric / 
     NULLIF(COUNT(DISTINCT ulp.lesson_id), 0)) * 100
  ) as progress_percentage,
  MAX(ulp.started_at) as last_accessed,
  MAX(ulp.completed_at) as last_lesson_completed
FROM user_lesson_progress ulp
JOIN courses c ON c.id = ulp.course_id
GROUP BY ulp.user_id, ulp.course_id, c.title;
```

