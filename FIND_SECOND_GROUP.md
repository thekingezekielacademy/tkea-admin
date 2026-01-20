# 🔍 How to Find Your Second Telegram Group ID

## The Group You're Looking For:
**"LIVE CLASSES REMINDER - 5 Ways Nigerians Monetize Skills to Earn ₦1M–₦3M"**

---

## 📝 Step-by-Step Instructions:

### Step 1: Send a Message in That Group
1. Open Telegram
2. Go to the group: **"LIVE CLASSES REMINDER - 5 Ways Nigerians Monetize Skills to Earn ₦1M–₦3M"**
3. Send ANY message (can be just "test" or an emoji)
4. Make sure the bot is an admin of this group

### Step 2: Run the Finder Script
```bash
cd /Users/macbook/tkea-admin
node find-specific-group.js "5 Ways Nigerians"
```

Or to see ALL groups:
```bash
node find-all-telegram-groups.js
```

### Step 3: Copy the Group ID
Once you find it, you'll see something like:
```
GROUP: LIVE CLASSES REMINDER - 5 Ways Nigerians...
   🔑 ID: -1001234567890
```

---

## ✅ Once You Have Both Group IDs:

### Add to Vercel Environment Variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `TELEGRAM_GROUP_ID`
3. Set value to: `-1001846920075,-1001234567890` (comma-separated, no spaces)
4. Save and redeploy

### Example:
```
TELEGRAM_GROUP_ID=-1001846920075,-1001234567890
```

---

## 🧪 Test It:
After adding both IDs, test with:
```bash
export TELEGRAM_GROUP_ID="-1001846920075,-1001234567890"
node test-multiple-groups.js
```

---

## 💡 Alternative: If It's Actually a Channel

If the second one is a **channel** (not a group), you can still add it to `TELEGRAM_GROUP_ID` and the bot will send to it when classes start. The code supports both groups and channels.

---

## ❓ Still Can't Find It?

1. Make sure bot is admin of the group
2. Send a message in the group
3. Wait a few seconds
4. Run: `node find-all-telegram-groups.js`
5. Look through the output for the group name
