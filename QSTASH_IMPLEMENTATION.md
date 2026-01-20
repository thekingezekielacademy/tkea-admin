# 🚀 QStash Implementation Guide - Complete Setup

## ✅ **Perfect Solution for Real-Time Notifications!**

QStash from Upstash is the ideal solution for your live class notifications. It provides:
- ✅ Real-time cron jobs (every 5 minutes)
- ✅ Free tier (10,000 requests/day)
- ✅ Built-in retry logic
- ✅ Works perfectly with Vercel

---

## 📋 **Complete Setup Steps:**

### Step 1: Create Upstash Account

1. Go to: https://upstash.com
2. Click "Sign Up" (free)
3. Create a new project
4. Go to "QStash" in the dashboard
5. Copy your **QStash Token** (you'll need this)

### Step 2: Install QStash SDK

```bash
cd /Users/macbook/tkea-admin
npm install @upstash/qstash
```

### Step 3: Add Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these:
```env
QSTASH_TOKEN=your_qstash_token_from_upstash
```

(Optional, for webhook verification):
```env
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

### Step 4: Deploy the QStash Endpoint

The file `api/cron/qstash-reminders.js` is already created. Just deploy:

```bash
git add api/cron/qstash-reminders.js
git commit -m "Add QStash reminder endpoint"
git push
vercel --prod --yes
```

### Step 5: Create the Schedule

**Option A: Using the Setup Script (Easiest)**

```bash
export QSTASH_TOKEN=your_token_here
export APP_URL=https://your-domain.com
node setup-qstash-schedule.js
```

**Option B: Using QStash Dashboard**

1. Go to Upstash Dashboard → QStash → Schedules
2. Click "Create Schedule"
3. Fill in:
   - **Destination**: `https://your-domain.com/api/cron/qstash-reminders`
   - **Cron Expression**: `*/5 * * * *` (every 5 minutes)
   - **Method**: POST
   - **Body**: `{"type":"live-booth-reminders"}`
4. Click "Create"

**Option C: Using QStash API**

```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/cron/qstash-reminders",
    "cron": "*/5 * * * *",
    "body": "{\"type\":\"live-booth-reminders\"}"
  }'
```

---

## 🎯 **How It Works:**

1. **QStash runs every 5 minutes** (based on cron: `*/5 * * * *`)
2. **Calls your endpoint**: `POST /api/cron/qstash-reminders`
3. **Your endpoint checks** for upcoming sessions
4. **Sends notifications** to all Telegram groups/channels
5. **QStash retries** automatically if your endpoint fails

---

## ✅ **Benefits Over Vercel Cron:**

| Feature | Vercel Hobby | QStash |
|---------|--------------|--------|
| Frequency | Once per day | Every 5 minutes ✅ |
| Real-time | ❌ No | ✅ Yes |
| Retry Logic | ❌ No | ✅ Yes |
| Free Tier | Limited | 10K/day ✅ |
| Setup | Easy | Easy ✅ |

---

## 🔧 **Monitoring:**

### Check Schedule Status:
- Go to Upstash Dashboard → QStash → Schedules
- See execution history and status

### Check Logs:
- Vercel Dashboard → Functions → `/api/cron/qstash-reminders` → Logs
- See when reminders are sent

---

## 🐛 **Troubleshooting:**

### Schedule Not Running?
1. Check QStash Dashboard → Schedules → See if it's active
2. Check execution history for errors
3. Verify your endpoint URL is correct and accessible

### Notifications Not Sending?
1. Check Vercel logs for errors
2. Verify `TELEGRAM_GROUP_ID` is set correctly
3. Test endpoint manually:
   ```bash
   curl -X POST https://your-domain.com/api/cron/qstash-reminders \
     -H "Content-Type: application/json"
   ```

### Webhook Verification Issues?
- The code includes optional signature verification
- For testing, you can disable it temporarily
- In production, enable full verification

---

## 📊 **Cost:**

**Free Tier:**
- 10,000 requests/day
- Perfect for your use case!

**If you exceed:**
- $0.20 per 1M requests
- Very affordable

---

## 🎉 **Result:**

Once set up, you'll have:
- ✅ Real-time notifications (every 5 minutes)
- ✅ Automatic retries on failure
- ✅ Reliable delivery
- ✅ No Vercel plan upgrade needed!

---

## 📝 **Next Steps:**

1. ✅ Create Upstash account
2. ✅ Install QStash SDK
3. ✅ Add environment variables
4. ✅ Deploy endpoint
5. ✅ Create schedule
6. ✅ Test and monitor

**You're all set!** 🚀
