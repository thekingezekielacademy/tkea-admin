# 🔔 Notification Timing Explanation

## ⚠️ CRITICAL ISSUE IDENTIFIED

**Problem:** Notifications aren't being sent because sessions are created TODAY, but notification times have already passed.

---

## 📅 How Notification Timing Works

### Normal Flow (Sessions Created in Advance):

**Example:** Session scheduled for **Monday, Jan 27th at 6:30 AM**

Notifications are sent at:
1. **5 days before** → Wednesday, Jan 22nd at 6:30 AM ✅
2. **48 hours before** → Saturday, Jan 25th at 6:30 AM ✅
3. **24 hours before** → Sunday, Jan 26th at 6:30 AM ✅
4. **3 hours before** → Monday, Jan 27th at 3:30 AM ✅
5. **30 minutes before** → Monday, Jan 27th at 6:00 AM ✅

**This works perfectly!**

---

### Problem Flow (Sessions Created Today):

**Example:** Session created **Tuesday, Jan 20th** for **Tuesday, Jan 20th at 6:30 AM**

Notification times would be:
1. **5 days before** → Thursday, Jan 15th at 6:30 AM ❌ **ALREADY PASSED**
2. **48 hours before** → Sunday, Jan 18th at 6:30 AM ❌ **ALREADY PASSED**
3. **24 hours before** → Monday, Jan 19th at 6:30 AM ❌ **ALREADY PASSED**
4. **3 hours before** → Tuesday, Jan 20th at 3:30 AM ❌ **ALREADY PASSED** (if it's past 3:30 AM)
5. **30 minutes before** → Tuesday, Jan 20th at 6:00 AM ❌ **ALREADY PASSED** (if it's past 6:00 AM)

**Result:** NO notifications sent! 😱

---

## ✅ SOLUTION IMPLEMENTED

### Updated Logic:

1. **Sessions Created Today:**
   - Send ALL notifications immediately (even if timing passed)
   - Only if session hasn't started yet

2. **Normal Timing:**
   - Still works for sessions created in advance
   - Sends at exact timing windows

3. **Today's Sessions:**
   - Send 3h and 30m notifications if within time window

---

## 🧪 How to Test

### Check Current Status:

```bash
# Run diagnostic script
node scripts/check-notification-status.js
```

### Manually Trigger Notifications:

```bash
# Send immediate notifications for today's sessions
curl -X POST https://your-domain.com/api/cron/send-immediate-batch-notifications \
  -H "x-vercel-cron: 1"
```

### Check Notification Cron:

```bash
# Trigger notification cron manually
curl -X POST https://your-domain.com/api/cron/batch-class-notifications \
  -H "x-vercel-cron: 1"
```

---

## 📊 Expected Behavior

### For Sessions Created Today:

**If session is at 6:30 AM and it's currently 12:00 PM:**
- ❌ Session already started → No notifications sent

**If session is at 6:30 PM and it's currently 12:00 PM:**
- ✅ Send ALL 5 notifications immediately (5_days, 48h, 24h, 3h, 30m)
- ✅ Notifications go to Telegram groups right away

**If session is at 6:30 PM and it's currently 4:00 PM:**
- ✅ Send 3h and 30m notifications (others already sent or will send)

---

## 🎯 Going Forward

### Best Practice:
- **Create sessions in advance** (e.g., create sessions for next week this week)
- This ensures all notification timings work correctly
- System will send notifications at proper intervals

### Current Fix:
- **Sessions created today** → Send all notifications immediately
- **Sessions created in advance** → Send at proper timing intervals

---

## 🔍 Debugging

### Check if notifications are being sent:

```sql
-- Check notification records
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  MAX(sent_at) as last_sent
FROM batch_class_notifications
GROUP BY notification_type, status
ORDER BY notification_type, status;
```

### Check today's sessions:

```sql
SELECT 
  class_name,
  session_number,
  scheduled_datetime,
  created_at
FROM batch_class_sessions
WHERE scheduled_date = CURRENT_DATE
ORDER BY scheduled_datetime;
```

---

**Last Updated:** January 2025  
**Status:** Fixed ✅ | Testing Required
