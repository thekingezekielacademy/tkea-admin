# ⚠️ Vercel Hobby Plan Limitation - Cron Jobs

## ❌ **THE PROBLEM:**

Vercel Hobby plan **only allows cron jobs that run ONCE PER DAY maximum**.

This means:
- ❌ `*/5 * * * *` (every 5 minutes) - NOT ALLOWED
- ❌ `0 * * * *` (every hour) - NOT ALLOWED  
- ✅ `0 0 * * *` (once per day at midnight) - ALLOWED

## 🔧 **CURRENT SOLUTION:**

The cron jobs are set to run **once per day at midnight UTC**:
- `/api/cron/live-booth-reminders` - Runs daily at 00:00 UTC
- `/api/cron/batch-class-notifications` - Runs daily at 00:00 UTC

### How It Works:

1. **Runs once per day** at midnight UTC
2. **Checks for ALL sessions** in the next 48 hours
3. **Sends ALL reminders** that are due:
   - Reminders due within the next 24 hours are sent immediately
   - The ±5 minute window ensures reminders are caught

### Limitations:

- ⚠️ Reminders are sent **once per day** (not in real-time)
- ⚠️ "Class starting now" notifications might be sent up to 24 hours early
- ⚠️ Countdown reminders (1h, 30m, 2m before) might be sent early

## 💡 **BETTER SOLUTIONS:**

### Option 1: Upgrade to Vercel Pro ($20/month)
- Allows cron jobs to run as frequently as needed
- Can run every 5 minutes or every minute
- Best solution for real-time notifications

### Option 2: Use External Cron Service (Free)
Use a free service like:
- **cron-job.org** (free, runs every 5 minutes)
- **EasyCron** (free tier available)
- **UptimeRobot** (free monitoring + cron)

**Setup:**
1. Create account on cron service
2. Add cron job: `POST https://your-domain.com/api/cron/live-booth-reminders`
3. Set schedule: Every 5 minutes
4. Add header: `x-vercel-cron: 1` (or use CRON_SECRET)

### Option 3: Manual Trigger (Current Workaround)
Manually trigger reminders when needed:
```bash
curl -X POST https://your-domain.com/api/cron/live-booth-reminders \
  -H "x-vercel-cron: 1"
```

## 📋 **RECOMMENDED ACTION:**

For **real-time notifications**, use **Option 2** (External Cron Service):
1. Sign up for cron-job.org (free)
2. Create cron job pointing to your API endpoint
3. Set to run every 5 minutes
4. Add authentication header

This gives you real-time notifications without upgrading Vercel plan.

---

**Current Status:** ✅ Deployed with daily cron (works but not real-time)  
**Recommended:** Use external cron service for real-time notifications
