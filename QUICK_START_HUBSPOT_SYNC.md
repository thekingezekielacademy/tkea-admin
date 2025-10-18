# Quick Start: Sync Users to HubSpot

## ✅ What's Already Working

**New signups are automatically added to HubSpot!** Every time someone signs up on your site, they're automatically created as a contact in HubSpot with:
- Email
- First & Last Name
- Signup Date
- User ID
- Custom event tracking

## 📥 Import Existing Users (3 Steps)

### Step 1: Create HubSpot Private App (2 minutes)

1. Go to HubSpot → **Settings** (⚙️) → **Integrations** → **Private Apps**
2. Click **Create a private app**
3. Name it: `King Ezekiel Academy Sync`
4. Go to **Scopes** tab and enable:
   - ✅ `crm.objects.contacts.read`
   - ✅ `crm.objects.contacts.write`
5. Click **Create app** → Copy the access token
6. **Get token here:** https://app.hubspot.com/settings/integrations/private-apps

### Step 2: Add Token to Environment

Create or edit `.env.local` in the Next.js folder:

```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
echo "HUBSPOT_PRIVATE_APP_TOKEN=your_token_here" >> .env.local
```

Replace `your_token_here` with the token you copied.

### Step 3: Run the Sync

```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
npm run sync-hubspot
```

That's it! ✅

## 🎉 What Happens

The script will:
1. Fetch all users from your Supabase database
2. Create/update them as contacts in HubSpot
3. Show progress in real-time
4. Handle duplicates automatically
5. Report success/failures

## ✅ Expected Output

```
🚀 Starting user sync to HubSpot...

📥 Fetching users from Supabase...
✅ Found 1,234 users in Supabase

📤 Syncing users to HubSpot...

Processing batch 1 (1-10 of 1234)...
  ✅ Batch created successfully (10 contacts)

✅ Sync Complete!
   Total users: 1,234
   ✅ Successfully synced: 1,220
   ❌ Failed: 14

🎉 Check your HubSpot contacts: https://app.hubspot.com/contacts/
```

## 🔍 Verify in HubSpot

1. Go to: https://app.hubspot.com/contacts/147094057
2. You should see all your users listed
3. Click any contact to see their details

## ⚠️ Troubleshooting

**Error: "Missing HubSpot access token"**
→ Make sure you added `HUBSPOT_PRIVATE_APP_TOKEN` to `.env.local`

**Error: "Missing Supabase credentials"**
→ Make sure your `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**Error: "Property does not exist"**
→ Create custom properties in HubSpot (see full guide in `HUBSPOT_USER_SYNC_GUIDE.md`)

## 📖 Full Documentation

For more details, workflows, and advanced features:
- **User Sync Guide:** `HUBSPOT_USER_SYNC_GUIDE.md`
- **Integration Guide:** `HUBSPOT_INTEGRATION_GUIDE.md`

## 🔄 Re-running the Sync

You can run the sync anytime:
```bash
npm run sync-hubspot
```

It will:
- Skip existing contacts (no duplicates)
- Update contacts with new information
- Add any new users since last sync

## 🎯 What's Next?

Now that all users are in HubSpot, you can:

1. **Create Lists**
   - Segment users by signup date, activity, etc.
   - Target specific groups for campaigns

2. **Set Up Workflows**
   - Welcome email series
   - Re-engagement campaigns
   - Upsell automation

3. **Track More Events**
   - Course enrollments
   - Lesson completions
   - Payment events
   - Custom behaviors

All the code is ready - just follow the examples in the integration guide!

---

**Need Help?**
Read the full guides or reach out to the development team.

