# 📝 Batch Class System - Migration Notes

## ⚠️ Important: Migration Differences

### 1. **batches table requires `live_class_id`**

The migration you ran requires batches to be linked to existing `live_classes`:

```sql
live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE
```

**What this means:**
- Before creating a batch, you must have a `live_class` record
- The `live_class` can be linked to a course (`course_id`) OR standalone (`title`)
- Batch creation will fail if no `live_class` exists

**Solution:**
- Ensure each of the 5 classes has a corresponding `live_class` record
- Link `batch_classes.course_id` to courses, OR
- Create standalone `live_classes` with `title` matching the class name

### 2. **Notification System Discrepancy**

**Migration has:**
```sql
user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
```

**We built:**
- Telegram group broadcasts (no `user_id` needed)
- Notifications sent to groups, not individual users

**Options:**
1. **Keep Telegram groups** - Modify migration to remove `user_id` requirement
2. **Add per-user notifications** - Update notification system to support both
3. **Hybrid approach** - Telegram for announcements, email for enrolled users

**Recommendation:** Keep Telegram groups for announcements, add optional email notifications for enrolled users.

---

## ✅ Code Updates Made

All API endpoints have been updated to work with `live_class_id`:

1. **`api/cron/create-batch.js`** ✅
   - Now finds/requires `live_class_id` before creating batch
   - Looks for `live_class` by `course_id` or `title`

2. **`api/cron/generate-batch-sessions.js`** ✅
   - Updated to work with `live_class_id`
   - Gets `course_id` from `live_classes` table

3. **`api/admin/batch-classes/kickstart.js`** ✅
   - Updated to find `live_class_id` before creating batch

4. **`api/batches/[batchId]/sessions.js`** ✅
   - Updated to verify batch exists with `live_class_id`

---

## 🔧 Setup Steps

### Step 1: Create Live Classes for Each Batch Class

For each of the 5 classes, ensure a `live_class` exists:

**Option A: Link to Course**
```sql
-- If you have courses for these classes
INSERT INTO live_classes (course_id, is_active)
SELECT id, true
FROM courses
WHERE title IN (
  'FREELANCING - THE UNTAPPED MARKET',
  'INFORMATION MARKETING: THE INFINITE CASH LOOP',
  'YOUTUBE MONETIZATION: From Setup To Monetization',
  'EARN 500K SIDE INCOME SELLING EBOOKS',
  'CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE'
)
ON CONFLICT (course_id) DO NOTHING;
```

**Option B: Create Standalone Live Classes**
```sql
-- Create standalone live classes
INSERT INTO live_classes (title, is_active, access_type)
VALUES
  ('FREELANCING - THE UNTAPPED MARKET', true, 'paid'),
  ('INFORMATION MARKETING: THE INFINITE CASH LOOP', true, 'paid'),
  ('YOUTUBE MONETIZATION: From Setup To Monetization', true, 'paid'),
  ('EARN 500K SIDE INCOME SELLING EBOOKS', true, 'paid'),
  ('CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE', true, 'free')
ON CONFLICT DO NOTHING;
```

### Step 2: Link batch_classes to courses (if using Option A)

```sql
-- Update batch_classes to link to courses
UPDATE batch_classes bc
SET course_id = c.id
FROM courses c
WHERE bc.class_name = c.title
AND bc.course_id IS NULL;
```

### Step 3: Test Batch Creation

```bash
# Test creating a batch (will find live_class automatically)
curl -X POST https://your-domain.com/api/cron/create-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📋 Checklist

- [ ] Migration run successfully
- [ ] `live_classes` created for all 5 classes
- [ ] `batch_classes` linked to courses (if applicable)
- [ ] Test batch creation endpoint
- [ ] Test session generation endpoint
- [ ] Verify notifications work (Telegram groups)

---

## 🚨 Troubleshooting

### Error: "No active live_class found"
**Solution:** Create `live_class` records for each batch class (see Step 1 above)

### Error: "Foreign key constraint violation"
**Solution:** Ensure `live_class_id` exists before creating batch

### Batches not creating
**Solution:** 
1. Check if `live_classes` exist and are active
2. Verify `batch_classes` are linked to courses (if using course-based approach)
3. Check cron job logs

---

**Last Updated:** January 2025
