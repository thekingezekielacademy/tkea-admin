# 📚 Live Booth - Admin Guide

## Overview

Live Booth is a **Scheduled Live-Class Experience** system that delivers the feel of a live class using pre-recorded, high-quality videos. Instead of one-time live sessions, the same class can be scheduled and run multiple times per week, allowing the academy to scale without reducing quality or instructor availability.

### Key Features

- ✅ **Automated Scheduling**: Classes are automatically scheduled when courses are converted
- ✅ **Manual Calendar/Playlist**: Admins can manually assign videos to specific dates (NEW)
- ✅ **Multiple Daily Sessions**: Each lesson runs 3 times per day (Morning, Afternoon, Evening)
- ✅ **Cyclical "On Repeat" System**: Classes automatically cycle through lessons
- ✅ **Free Classes**: First 2 classes of each course are automatically free
- ✅ **Pay Later Restriction**: Pay Later only available for 1st class (NEW)
- ✅ **Payment Integration**: Full course or single class purchase options
- ✅ **Automated Reminders**: Telegram and email reminders sent automatically
- ✅ **Q&A Management**: Students can ask questions during classes
- ✅ **Admin Controls**: Manual class start, scheduling, and management

---

## 🎯 Quick Start Guide

### For New Admins

1. **Convert a Course**: Go to `/live-classes/all` → Click "Convert Courses to Live Booth"
2. **Activate Scheduling**: Click "Activate Now" to schedule classes
3. **Customize Schedule** (Optional): Go to `/admin/live-booth/calendar` to manually assign videos to dates
4. **Monitor Classes**: View all classes at `/live-classes/all`

### Key Admin Pages

- **All Classes**: `/live-classes/all` - View and manage all scheduled classes
- **Calendar/Playlist**: `/admin/live-booth/calendar` - Manually schedule videos to dates
- **Individual Course**: `/live-classes/[liveClassId]` - View schedule for specific course

---

## 🚀 Getting Started

### Step 1: Convert a Course to Live Booth

**Option A: Via All Classes Page (Recommended)**

1. Navigate to `/live-classes/all`
2. If you see "No Classes Found", click **"Convert Courses to Live Booth"** button
3. Select a course from the list
4. Click **"Convert"**
5. Classes will be automatically scheduled for the next 30 days

**Option B: Via API**

```bash
POST /api/admin/live-booth/convert-course
Content-Type: application/json

{
  "courseId": "your-course-id"
}
```

**What Happens:**
- Creates a Live Booth record for the course
- Automatically schedules classes starting from tomorrow
- Creates 3 sessions per day (morning, afternoon, evening) for each lesson
- Schedules for the next 30 days automatically

### Step 2: Activate Classes and Reminders

1. Go to `/live-classes/all`
2. Click **"Activate Now"** button (admin only)
3. This will:
   - Schedule classes for all active Live Booth courses
   - Process and send pending reminders

**Or via API:**

```bash
# Activate Scheduling
POST /api/cron/auto-schedule-live-booth

# Activate Reminders
POST /api/cron/live-booth-reminders
```

---

## 📅 Class Scheduling

### Automated Scheduling

Classes are **automatically scheduled** when:
- A course is converted to Live Booth
- The daily cron job runs (midnight daily)
- You manually trigger the scheduling endpoint

**Scheduling Rules:**
- Each lesson gets 3 sessions per day:
  - 🌅 **Morning**: 6:30 AM - 7:30 AM
  - ☀️ **Afternoon**: 1:00 PM - 2:00 PM
  - 🌙 **Evening**: 7:30 PM - 9:00 PM
- Classes are scheduled 30 days in advance
- System automatically maintains 30 days of scheduled classes

### Manual Calendar Scheduling (Playlist)

**NEW:** Admins can now manually select which videos play on which dates using a calendar interface.

**How to Use:**

1. Navigate to `/admin/live-booth/calendar` (or click "Open Calendar" on `/live-classes/all`)
2. Select a Live Booth course from the dropdown
3. View all available course videos (lessons)
4. For each date (next 30 days):
   - Select a date
   - Choose which video/lesson should play on that date
   - Click "Add Assignment"
5. Review your calendar assignments
6. Click "Save Calendar" to apply changes

**What Happens When You Save:**
- Existing scheduled sessions for assigned dates are deleted
- New sessions are created: 3 sessions per day (morning, afternoon, evening) for each assigned video
- The system maintains your manual schedule for the next 30 days

**Use Cases:**
- Custom lesson sequences
- Special event scheduling
- Override automated scheduling
- Create custom playlists

**API Endpoint:**
```bash
POST /api/admin/live-booth/update-calendar
Content-Type: application/json

{
  "liveClassId": "live-class-id",
  "assignments": [
    { "date": "2025-01-27", "videoId": "video-id-1", "videoName": "Lesson 1" },
    { "date": "2025-01-28", "videoId": "video-id-2", "videoName": "Lesson 2" }
  ]
}
```

### Manual Scheduling (Trigger Automated)

If you need to manually trigger automated scheduling:

```bash
POST /api/cron/auto-schedule-live-booth
```

This will:
- Check all active Live Booth courses
- Schedule classes for courses that have less than 25 days scheduled
- Create sessions for the next 30 days

**Note:** Manual calendar assignments take precedence over automated scheduling.

### Cyclical "On Repeat" System

When a course has 5+ lessons:
- Classes cycle through lessons in order
- Day 1 → Lesson 1, Day 2 → Lesson 2, ..., Day 5 → Lesson 5
- Day 6 → Back to Lesson 1 (cycle repeats)
- System automatically advances the cycle day

**Note:** Manual calendar assignments override the cyclical system.

---

## 🎮 Admin Controls

### Manual Class Start

Admins can manually start a class session before its scheduled time:

**Via API:**
```bash
POST /api/admin/live-booth/start-session
Content-Type: application/json

{
  "sessionId": "session-id-here"
}
```

**What Happens:**
- Session status changes to `in_progress`
- `started_at` timestamp is set
- Students can now join the class

**Use Cases:**
- Testing classes
- Starting early for special events
- Troubleshooting

### View All Classes

Navigate to `/live-classes/all` to see:
- All upcoming classes across all Live Booth courses
- Filter by date, session type, or status
- View available slots
- See which classes are free
- **Admin Actions:**
  - "Activate Classes & Reminders" - Trigger scheduling and reminders
  - "Open Calendar" - Access manual calendar/playlist interface
  - "Convert Courses to Live Booth" - Convert new courses

---

## 💬 Q&A Management

### How Students Ask Questions

1. Students join a class session
2. During the class, they can submit questions in the Q&A section
3. Questions appear in real-time

### Admin Response

**Current Status:** Q&A management interface is pending implementation.

**Planned Features:**
- View all questions for a session
- Respond to questions
- Mark questions as answered
- View question history

**Database Table:** `live_class_qa`
- `session_id`: The class session
- `user_id`: Student who asked
- `question_text`: The question
- `answer_text`: Admin response (nullable)
- `answered_at`: When admin responded

---

## 💰 Payment & Access

### Payment Types

1. **Full Course Purchase**
   - User pays for entire course
   - Gets access to ALL classes in that course
   - Can access classes anytime (still in scheduled format)

2. **Single Class Purchase**
   - User pays for one specific class session
   - Gets access to that session only
   - Can access anytime (still in scheduled format)

### Free Classes

- **1st and 2nd classes** (lessons with `order_index` 1 and 2) are automatically free
- Students can access these without payment
- **1st class only** has "Pay Now" or "Pay Later" options
- **2nd class and beyond** only have "Pay Now" option (Pay Later is disabled)

### Pay Later Restriction

**Important:** "Pay Later" is **only available for the 1st class** (`order_index = 1`).

- ✅ **1st Class**: Students can choose "Pay Now" or "Pay Later"
- ❌ **2nd Class and Beyond**: Students must pay to join (only "Purchase to Join" button shown)

This ensures students commit to payment after experiencing the first free class.

### Access Control

**Database Tables:**
- `live_class_payments`: Records all payments
- `live_class_access`: Grants access to users
- `product_purchases`: Links to main payment system

**Access Check Logic:**
1. Check if session is free → Grant access
2. Check `live_class_access` table → Grant if exists
3. Check `live_class_payments` → Grant if paid
4. Check `product_purchases` for full course → Grant if paid

---

## 📢 Reminders System

### Automated Reminders

The system automatically sends reminders via:

1. **Telegram Channel** (`@LIVECLASSREMINDER`)
   - Few hours before class
   - 1 hour before
   - 30 minutes before
   - 2 minutes before
   - When class starts

2. **Email Reminders**
   - 24 hours before class
   - 2 hours before class
   - Sent to users who signed up for email reminders

### Reminder Processing

**Cron Job:** Runs every 5 minutes
- Endpoint: `/api/cron/live-booth-reminders`
- Checks for upcoming sessions
- Sends appropriate reminders
- Records sent reminders to prevent duplicates

**Manual Trigger:**
```bash
POST /api/cron/live-booth-reminders
```

### Reminder Content

**Telegram Reminders Include:**
- Course name
- Lesson/class name
- Session type (Morning/Afternoon/Evening)
- Date and time
- Direct link to join class
- Telegram channel link

**Email Reminders Include:**
- Course name
- Lesson/class name
- Date and time
- Session type
- Direct link to join class

---

## 🔧 Database Schema

### Key Tables

1. **`live_classes`**
   - Maps courses to Live Booth experiences
   - `course_id`: The course
   - `is_active`: Whether Live Booth is active
   - `cycle_day`: Current day in cycle (1-5)

2. **`class_sessions`**
   - Individual scheduled sessions
   - `live_class_id`: Parent Live Booth
   - `course_video_id`: The lesson/video
   - `session_type`: morning/afternoon/evening
   - `scheduled_datetime`: When class starts
   - `is_free`: True for 1st and 2nd classes
   - `current_slots`: Available slots (starts at 25)

3. **`live_class_payments`**
   - Payment records
   - `payment_type`: full_course or single_class
   - `payment_status`: completed/pending/failed

4. **`live_class_access`**
   - Access grants
   - `access_type`: full_course/single_class/free

5. **`live_class_qa`**
   - Questions and answers
   - `question_text`: Student question
   - `answer_text`: Admin response

6. **`class_reminders`**
   - Tracks sent reminders
   - Prevents duplicate reminders

---

## 🎯 Common Tasks

### Convert Multiple Courses

1. Go to `/live-classes/all`
2. Click "Convert Courses to Live Booth"
3. Convert courses one by one
4. Click "Activate Now" to schedule all classes

### Schedule Custom Playlist (Calendar)

1. Go to `/admin/live-booth/calendar` (or click "Open Calendar" on `/live-classes/all`)
2. Select the Live Booth course
3. Assign videos to specific dates
4. Click "Save Calendar" to apply
5. System will create 3 sessions per day (morning, afternoon, evening) for each assignment

### Check Scheduled Classes

1. Go to `/live-classes/all`
2. Use filters to find specific classes
3. View by date, session type, or status

### Manually Start a Class

**Via API:**
```bash
POST /api/admin/live-booth/start-session
{
  "sessionId": "session-id"
}
```

### View Student Questions

**Current:** Check `live_class_qa` table in database

**Future:** Admin interface will be available

### Check Reminder Status

**Database Query:**
```sql
SELECT * FROM class_reminders 
WHERE session_id = 'session-id'
ORDER BY sent_at DESC;
```

### View Payment Records

**Database Query:**
```sql
SELECT * FROM live_class_payments 
WHERE live_class_id = 'live-class-id'
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### No Classes Showing

**Problem:** "No Classes Found" message

**Solutions:**
1. Convert a course to Live Booth (see Step 1)
2. Click "Activate Now" to trigger scheduling
3. Check if course has lessons (`course_videos` table)
4. Verify `live_classes.is_active = true`

### Classes Not Scheduling

**Problem:** Classes not being created automatically

**Solutions:**
1. Manually trigger scheduling:
   ```bash
   POST /api/cron/auto-schedule-live-booth
   ```
2. Check cron job configuration in `vercel.json`
3. Verify `CRON_SECRET` environment variable
4. Check server logs for errors

### Reminders Not Sending

**Problem:** Students not receiving reminders

**Solutions:**
1. Manually trigger reminders:
   ```bash
   POST /api/cron/live-booth-reminders
   ```
2. Check Telegram bot configuration
3. Verify email service (Resend) configuration
4. Check `class_reminders` table for sent records
5. Verify Telegram channel: `@LIVECLASSREMINDER`

### Payment Issues

**Problem:** Users paid but can't access classes

**Solutions:**
1. Check `live_class_payments` table for payment record
2. Check `live_class_access` table for access grant
3. Verify webhook processed payment correctly
4. Check user's `product_purchases` for full course access

### Slot Count Issues

**Problem:** Slots not decrementing on purchase

**Solutions:**
1. Check if `decrementSlots()` is called in webhook
2. Verify `class_sessions.current_slots` is updating
3. Slots reset to 25 when they reach 0

---

## 📊 Monitoring & Analytics

### Check Active Live Booth Courses

```sql
SELECT 
  lc.id,
  c.title as course_title,
  lc.is_active,
  lc.cycle_day,
  COUNT(cs.id) as total_sessions
FROM live_classes lc
JOIN courses c ON c.id = lc.course_id
LEFT JOIN class_sessions cs ON cs.live_class_id = lc.id
WHERE lc.is_active = true
GROUP BY lc.id, c.title, lc.is_active, lc.cycle_day;
```

### View Upcoming Classes

```sql
SELECT 
  cs.id,
  c.title as course_title,
  cv.name as lesson_name,
  cs.session_type,
  cs.scheduled_datetime,
  cs.current_slots,
  cs.is_free,
  cs.status
FROM class_sessions cs
JOIN live_classes lc ON lc.id = cs.live_class_id
JOIN courses c ON c.id = lc.course_id
JOIN course_videos cv ON cv.id = cs.course_video_id
WHERE cs.scheduled_datetime >= NOW()
ORDER BY cs.scheduled_datetime ASC
LIMIT 50;
```

### Payment Statistics

```sql
SELECT 
  payment_type,
  COUNT(*) as total_payments,
  SUM(amount) as total_revenue,
  COUNT(DISTINCT user_id) as unique_payers
FROM live_class_payments
WHERE payment_status = 'completed'
GROUP BY payment_type;
```

---

## 🔐 Security & Permissions

### Admin Access

- Admin role required for:
  - Converting courses to Live Booth
  - Manually starting classes
  - Activating scheduling/reminders
  - Accessing admin APIs

### API Authentication

**Cron Jobs:**
- Require `CRON_SECRET` in Authorization header
- Or `x-vercel-cron` header from Vercel
- Or no auth if `CRON_SECRET` not set (for testing)

**Admin APIs:**
- Require authenticated user
- Require `role = 'admin'` in profiles table

---

## 📝 Best Practices

1. **Convert Courses Early**
   - Convert courses before they're needed
   - Classes auto-schedule 30 days ahead

2. **Monitor Scheduling**
   - Check `/live-classes/all` regularly
   - Ensure classes are being scheduled
   - Use "Activate Now" if needed

3. **Respond to Q&A Promptly**
   - Check questions during/after classes
   - Respond within 24 hours for best engagement

4. **Test Before Launch**
   - Convert a test course first
   - Verify classes are scheduling
   - Test payment flow
   - Check reminders are sending

5. **Monitor Reminders**
   - Verify Telegram channel is active
   - Check email delivery rates
   - Monitor reminder timing

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Admin Q&A management interface
- [ ] Bulk course conversion
- [x] Custom scheduling (override automated) - **COMPLETED: Calendar interface available**
- [ ] Class analytics dashboard
- [ ] Student attendance tracking
- [ ] Class recording/playback
- [ ] Advanced reminder customization

---

## 📞 Support

### Common Issues

**Q: How do I convert a course?**
A: Go to `/live-classes/all` and click "Convert Courses to Live Booth"

**Q: Why are no classes showing?**
A: Convert a course first, then click "Activate Now"

**Q: How do I manually start a class?**
A: Use the API endpoint `/api/admin/live-booth/start-session`

**Q: How do reminders work?**
A: They're automated. Check `/api/cron/live-booth-reminders` to trigger manually.

**Q: Can I schedule classes manually?**
A: Yes! Use the Calendar interface at `/admin/live-booth/calendar` to manually assign videos to specific dates. This creates a custom playlist/sequence.

**Q: How does Pay Later work?**
A: Pay Later is only available for the 1st class. After that, students must pay to join. This ensures commitment after the free trial.

---

## 📚 Related Documentation

- `LIVE_BOOTH.md` - Full feature specification
- `supabase/migrations/20250126_001_create_live_booth_system.sql` - Database schema
- API endpoints in `/api/admin/live-booth/` and `/api/cron/`

---

**Last Updated:** January 2025
**Version:** 1.1

### Recent Updates (v1.1)

- ✅ **Calendar/Playlist Interface**: Admins can now manually schedule which videos play on which dates
- ✅ **Pay Later Restriction**: Pay Later is now only available for the 1st class (order_index = 1)
- ✅ **Admin Calendar Link**: Added "Open Calendar" button on `/live-classes/all` page for easy access
