# 🔧 Live Class Reminder Fix - Summary

## ❌ **THE PROBLEM:**

The cron job for live booth reminders was **NOT configured in `vercel.json`**, so it was never running automatically!

## ✅ **THE FIX:**

### 1. Added Cron Job to `vercel.json`

Added this cron job configuration:
```json
{
  "path": "/api/cron/live-booth-reminders",
  "schedule": "*/5 * * * *"
}
```

This makes the reminder system run **every 5 minutes** automatically.

### 2. What This Means:

- ✅ Cron job will now run automatically every 5 minutes
- ✅ Checks for upcoming sessions in the next 25 hours
- ✅ Sends reminders at the right times:
  - 24h before (email)
  - 2h before (email)
  - 1h before (Telegram)
  - 30m before (Telegram)
  - 2m before (Telegram)
  - **When class starts** (Telegram to all groups/channels)

## 📋 **What You Need to Do:**

### Step 1: Deploy to Vercel

The `vercel.json` file has been updated. You need to:

1. **Commit and push the changes:**
   ```bash
   git add vercel.json
   git commit -m "Add live booth reminders cron job"
   git push
   ```

2. **Or manually trigger a deployment in Vercel Dashboard**

### Step 2: Verify Environment Variables in Vercel

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- ✅ `TELEGRAM_BOT_TOKEN` = `8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo`
- ✅ `TELEGRAM_GROUP_ID` = `-1001846920075,-1003630393405,-1003586764205`
- ✅ `TELEGRAM_CHANNEL_ID` = `@LIVECLASSREMINDER` (or channel ID)
- ✅ `SUPABASE_URL` / `REACT_APP_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Verify Cron Job is Running

After deployment, check Vercel Dashboard → Functions → Cron Jobs:
- You should see `/api/cron/live-booth-reminders` listed
- It should show "Runs every 5 minutes"

### Step 4: Test Manually (Optional)

You can manually trigger the cron job to test:

```bash
curl -X POST https://your-domain.com/api/cron/live-booth-reminders \
  -H "x-vercel-cron: 1"
```

Or use Vercel Dashboard → Functions → Click on the function → "Invoke"

## 🔍 **How the Timing Works:**

The cron runs every 5 minutes and checks:

1. **Gets all sessions** scheduled in the next 25 hours
2. **For each session**, calculates time until start
3. **Checks if any reminder timing matches** (within ±5 minute window):
   - `start`: 0ms before (triggers when class time = now ± 5 min)
   - `2m_before`: 2 minutes before ± 5 min
   - `30m_before`: 30 minutes before ± 5 min
   - `1h_before`: 1 hour before ± 5 min
   - `2h_before`: 2 hours before ± 5 min
   - `24h_before`: 24 hours before ± 5 min

4. **If timing matches AND reminder not already sent**, sends notification

## ⚠️ **Important Notes:**

- The cron job runs every 5 minutes, so reminders might be sent up to 5 minutes early/late
- The "start" notification triggers when the class time is within ±5 minutes of now
- Reminders are tracked in `class_reminders` table to prevent duplicates
- If a reminder fails, it's logged but doesn't stop other reminders

## 🐛 **If Still Not Working:**

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on `/api/cron/live-booth-reminders`
   - Check the "Logs" tab for errors

2. **Verify Sessions Exist:**
   - Make sure you have `class_sessions` with `status = 'scheduled'`
   - Sessions must be in the future (within 25 hours)

3. **Check Environment Variables:**
   - Verify all required env vars are set in Vercel
   - Make sure `TELEGRAM_GROUP_ID` has all 3 IDs (comma-separated)

4. **Test Manually:**
   - Use the curl command above to trigger manually
   - Check the response for errors

## ✅ **Expected Behavior After Fix:**

- ✅ Cron job runs automatically every 5 minutes
- ✅ Checks for upcoming sessions
- ✅ Sends Telegram notifications to all 3 groups/channels when classes start
- ✅ Sends countdown reminders at appropriate times
- ✅ Sends email reminders 24h and 2h before

---

**Status:** ✅ Fixed - Cron job added to `vercel.json`
**Action Required:** Deploy to Vercel and verify environment variables
