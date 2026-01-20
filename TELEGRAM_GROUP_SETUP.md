# ✅ Telegram Group Setup - COMPLETE!

## 🎯 Your Telegram Groups

### Group 1 (Found):
**Group Name:** The King Ezekiel Academy Group  
**Group Username:** @KEFREETraining  
**🔑 GROUP ID:** `-1001846920075`

### Channel 2 (Found!):
**Channel Name:** LIVE CLASSES REMINDER - 5 Ways Nigerians Monetize Skills to Earn ₦1M–₦3M  
**Channel Username:** @LIVECLASSREMINDER  
**🔑 CHANNEL ID:** `-1003630393405` ✅

### Group 3 (Found!):
**Group Name:** BUILD COMMUNITY(5 Ways Nigerians Monetize Their Skills to Earn ₦1M–₦3M Monthly)  
**Type:** Supergroup (for paid students)  
**🔑 GROUP ID:** `-1003586764205` ✅

**Note:** Channels work the same as groups! Bots can send to channels if they're admins.

---

## 📝 Step-by-Step: Add to Vercel Environment Variables

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Find your project (likely `tkea-admin` or similar)
   - Click on it

3. **Go to Settings**
   - Click **"Settings"** tab at the top

4. **Click "Environment Variables"**
   - In the left sidebar, click **"Environment Variables"**

5. **Add the New Variable**
   - Click **"Add New"** button
   - **Key:** `TELEGRAM_GROUP_ID`
   - **Value:** `-1001846920075,-1003630393405,-1003586764205` (comma-separated, no spaces)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**
   
   **Note:** 
   - To send to MULTIPLE groups/channels, separate IDs with commas (no spaces)
   - Channels work the same as groups - bots can send to both!
   - Your setup: 2 Groups + 1 Channel = All 3 will receive notifications

6. **Redeploy Your Project**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Or just push a new commit to trigger auto-deploy

### Option 2: Via Vercel CLI (If you have it installed)

```bash
vercel env add TELEGRAM_GROUP_ID
# When prompted, enter: -1001846920075
# Select all environments (Production, Preview, Development)
```

---

## ✅ That's It!

Once you add `TELEGRAM_GROUP_ID=-1001846920075` to Vercel and redeploy:

- ✅ When live classes start, the bot will send ONE message to your Telegram group
- ✅ All group members will be notified
- ✅ Countdown reminders (1h, 30m, 2m before) still go to the channel

---

## 🧪 Testing

After redeploying, when a live class starts:
1. The bot will send a message to your group: **"The King Ezekiel Academy Group"**
2. All members will see the notification
3. The message will include the class details and join link

---

## 📋 Current Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `TELEGRAM_BOT_TOKEN` = `8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo`
- ✅ `TELEGRAM_CHANNEL_ID` = `@LIVECLASSREMINDER` (or your channel ID)
- ✅ `TELEGRAM_GROUP_ID` = `-1001846920075,-1003630393405,-1003586764205` ← **ADD ALL 3 HERE!**

**Your Setup:**
1. **Group:** The King Ezekiel Academy Group (`-1001846920075`)
2. **Channel:** LIVE CLASSES REMINDER - 5 Ways... (`-1003630393405`)
3. **Group:** BUILD COMMUNITY - Paid Students (`-1003586764205`)
- **Value:** `-1001846920075,-1003630393405,-1003586764205` (comma-separated, no spaces)
- When a class starts, ALL 3 (2 groups + 1 channel) will receive notifications ✅

---

## ❓ Troubleshooting

**Bot not sending to group?**
- Make sure bot is admin of the group
- Make sure `TELEGRAM_GROUP_ID` is set correctly (with the minus sign!)
- Check Vercel logs after a class starts

**Want to test it?**
- Manually trigger a class start via admin panel
- Or wait for the next scheduled class
- Check the group for the notification message
