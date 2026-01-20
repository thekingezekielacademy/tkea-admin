# 🔧 Batch Class Notification Fix

## 🚨 Issue Identified

**Problem:** No notifications are being sent for Tuesday's class.

**Root Causes:**
1. **Sessions created today** - If sessions are created TODAY, notification times for:
   - 5 days before (already passed)
   - 48 hours before (already passed)  
   - 24 hours before (already passed)
   
   These won't send because the time window has passed.

2. **Only future notifications work** - The system only sends:
   - 3 hours before (if session is >3 hours away)
   - 30 minutes before (if session is >30 min away)

3. **Batches/Sessions may not exist** - Need to verify:
   - Batches were created
   - Sessions were generated
   - Live classes exist

---

## ✅ Fixes Applied

### 1. Updated Notification Logic
**File:** `api/cron/batch-class-notifications.js`

**Changes:**
- Now includes sessions from today (not just future)
- Sends immediate notifications for sessions created today
- Handles "late" notifications (sends even if time passed)

### 2. Created Immediate Notification Endpoint
**File:** `api/cron/send-immediate-batch-notifications.js`

**Purpose:** Send notifications immediately for sessions created today
**Usage:** Can be called manually to send notifications right away

---

## 🔍 Diagnostic Steps

### Step 1: Check if Batches Exist

```sql
-- Run in Supabase SQL Editor
SELECT 
  class_name,
  batch_number,
  start_date,
  status
FROM batches
WHERE status = 'active'
ORDER BY start_date DESC;
```

**Expected:** Should see batches for each class

### Step 2: Check if Sessions Exist for Today

```sql
-- Run in Supabase SQL Editor
SELECT 
  class_name,
  session_number,
  session_title,
  scheduled_time,
  session_type,
  created_at
FROM batch_class_sessions
WHERE scheduled_date = CURRENT_DATE
ORDER BY scheduled_time;
```

**Expected:** Should see 3 sessions per batch (morning, afternoon, evening)

### Step 3: Check Live Classes

```sql
-- Run in Supabase SQL Editor
SELECT 
  lc.id,
  lc.title,
  lc.course_id,
  lc.is_active,
  bc.class_name
FROM live_classes lc
RIGHT JOIN batch_classes bc ON lc.title = bc.class_name
WHERE bc.is_active = true;
```

**Expected:** Should see 5 live_classes matching the 5 batch classes

---

## 🚀 Quick Fix Actions

### Action 1: Create Batches (if missing)

```bash
# If today is Tuesday, create Information Marketing batch
curl -X POST https://your-domain.com/api/cron/create-batch \
  -H "x-vercel-cron: 1"
```

### Action 2: Generate Sessions (if missing)

```bash
# Generate sessions for all active batches
curl -X POST https://your-domain.com/api/cron/generate-batch-sessions \
  -H "x-vercel-cron: 1"
```

### Action 3: Send Immediate Notifications

```bash
# Send notifications for today's sessions immediately
curl -X POST https://your-domain.com/api/cron/send-immediate-batch-notifications \
  -H "x-vercel-cron: 1"
```

### Action 4: Use Kickstart (All-in-One)

```javascript
// In browser console (logged in as admin)
fetch('/api/admin/batch-classes/kickstart', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Kickstart result:', d);
  // Then send immediate notifications
  return fetch('/api/cron/send-immediate-batch-notifications', {
    method: 'POST',
    headers: { 'x-vercel-cron': '1' }
  });
})
.then(r => r.json())
.then(d => console.log('✅ Notifications sent:', d));
```

---

## 📋 Checklist

- [ ] Run migration: `20250117_002_setup_batch_class_live_classes.sql`
- [ ] Verify live_classes exist (should be 5)
- [ ] Create batches (use kickstart or create-batch endpoint)
- [ ] Generate sessions (use generate-batch-sessions endpoint)
- [ ] Send immediate notifications (use send-immediate-batch-notifications)
- [ ] Verify notifications sent (check Telegram groups)
- [ ] Check cron jobs are running in Vercel

---

## 🔄 How It Should Work Going Forward

### Normal Flow (Sessions Created in Advance):
1. **Monday:** Batch created → Sessions generated for next 7 days
2. **Notifications:** Sent automatically at 5 intervals (5 days, 48h, 24h, 3h, 30m before)
3. **Tuesday:** Class starts → All notifications already sent

### If Sessions Created Today:
1. **Sessions created** → Immediate notifications sent
2. **Remaining notifications** → Sent at 3h and 30m before session

---

## 🎯 Expected Behavior

**For Tuesday's class (Information Marketing):**
- Batch should exist (created Monday or Tuesday)
- Sessions should exist for today (3 sessions: morning, afternoon, evening)
- Notifications should send:
  - Immediately (if sessions just created)
  - OR at 3 hours before each session
  - OR at 30 minutes before each session

---

**Last Updated:** January 2025  
**Status:** Fixes Applied ✅ | Testing Required
