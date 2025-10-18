# HubSpot User Sync Guide

This guide explains how to sync all existing users to HubSpot and ensure new signups are automatically added.

## 🎯 Overview

**Already Automated:**
- ✅ New user signups automatically create HubSpot contacts
- ✅ User identification on login
- ✅ Custom events tracked (signup, enrollments, etc.)

**What This Guide Covers:**
- Importing ALL existing users to HubSpot
- Setting up HubSpot Private App for API access
- Running the sync script
- Verifying the import

---

## Part 1: Create HubSpot Private App (Required for Bulk Import)

### Step 1: Create Private App in HubSpot

1. **Go to HubSpot Settings**
   - Log in to [app.hubspot.com](https://app.hubspot.com/)
   - Click Settings (⚙️) in the top right

2. **Navigate to Integrations**
   - In the left sidebar: **Integrations** → **Private Apps**
   - Click **Create a private app**

3. **Configure Your App**
   - **Name:** King Ezekiel Academy User Sync
   - **Description:** Sync users from Supabase to HubSpot contacts
   - Click **Next**

4. **Set Permissions (Scopes)**
   
   In the **Scopes** tab, enable these permissions:
   
   **CRM (Required):**
   - ✅ `crm.objects.contacts.read` - Read contacts
   - ✅ `crm.objects.contacts.write` - Create/update contacts
   
   **Optional (for advanced features):**
   - `crm.lists.read` - Read contact lists
   - `crm.lists.write` - Add contacts to lists

5. **Create the App**
   - Review permissions
   - Click **Create app**
   - Click **Continue creating**

6. **Copy Your Access Token**
   - ⚠️ **IMPORTANT:** Copy the access token immediately
   - It looks like: `pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Store it securely - you won't see it again!

### Step 2: Add Token to Environment Variables

**For Local Use:**

Add to `/Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs/.env.local`:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your_access_token_here
```

**Security Note:** Never commit this token to git. It's already in `.gitignore`.

---

## Part 2: Install Dependencies

```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
npm install @hubspot/api-client
```

---

## Part 3: Run the User Sync Script

### Option A: Using ts-node (Recommended)

```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
npx ts-node scripts/sync-users-to-hubspot.ts
```

### Option B: Compile and Run

```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
npx tsc scripts/sync-users-to-hubspot.ts
node scripts/sync-users-to-hubspot.js
```

### Expected Output

```
🚀 Starting user sync to HubSpot...

📥 Fetching users from Supabase...
✅ Found 1,234 users in Supabase

📤 Syncing users to HubSpot...

Processing batch 1 (1-10 of 1234)...
  ✅ Batch created successfully (10 contacts)

Processing batch 2 (11-20 of 1234)...
  ✅ Created: user1@example.com
  ✅ Created: user2@example.com
  ⚠️  Already exists: user3@example.com - attempting update...
  ✅ Updated: user3@example.com
  ...

✅ Sync Complete!
   Total users: 1,234
   ✅ Successfully synced: 1,220
   ❌ Failed: 14

🎉 Check your HubSpot contacts: https://app.hubspot.com/contacts/
```

---

## Part 4: Verify in HubSpot

### Check Your Contacts

1. Go to [HubSpot Contacts](https://app.hubspot.com/contacts/)
2. You should see all your users as contacts
3. Click on any contact to see their properties:
   - Email
   - First Name
   - Last Name
   - Phone
   - User ID
   - Signup Date
   - Lead Status

### Filter Synced Users

Create a filter to see only synced users:
1. In Contacts, click **Add filter**
2. Select **User ID** (custom property)
3. Set to **is known**
4. Click **Apply filter**

---

## Part 5: Create Custom Contact Properties (Optional)

If the script fails due to missing properties, create them:

1. **Settings** → **Data Management** → **Properties**
2. Select **Contact properties**
3. Click **Create property**

Create these properties:

### Property 1: User ID
- **Label:** User ID
- **Field type:** Single-line text
- **Internal name:** `user_id`
- **Description:** Supabase user ID

### Property 2: Signup Date
- **Label:** Signup Date
- **Field type:** Date picker
- **Internal name:** `signup_date`
- **Description:** Date user signed up

### Property 3: Subscription Plan (for future use)
- **Label:** Subscription Plan
- **Field type:** Single-line text
- **Internal name:** `subscription_plan`
- **Description:** Current subscription plan

### Property 4: Last Course Enrolled
- **Label:** Last Course Enrolled
- **Field type:** Single-line text
- **Internal name:** `enrolled_course`
- **Description:** Most recently enrolled course

---

## Part 6: Automate Future Signups (Already Done! ✅)

Good news - this is already working! When users sign up:

1. **Signup Page** (`/signup`) automatically:
   - ✅ Creates contact in HubSpot with email, name, signup date
   - ✅ Tracks "user_signup" event
   - ✅ Sets user properties

2. **Auth Provider** automatically:
   - ✅ Identifies user on login
   - ✅ Updates user properties when they change

### Verify Automatic Sync

Test it:
1. Create a new test account on your site
2. Wait 1-2 minutes
3. Go to HubSpot Contacts
4. Search for the test email
5. You should see the contact created automatically!

---

## Part 7: Set Up HubSpot Lists (Recommended)

Create smart lists to segment your users:

### List 1: All App Users

1. **Contacts** → **Lists** → **Create list**
2. **List name:** All App Users
3. **List type:** Active list (auto-updates)
4. **Filter:** User ID is known
5. **Save**

### List 2: New Signups (Last 30 Days)

1. **Create active list:** New Signups
2. **Filters:**
   - User ID is known
   - Signup Date is in last 30 days
3. **Save**

### List 3: Free Users (No Subscription)

1. **Create active list:** Free Users
2. **Filters:**
   - User ID is known
   - Subscription Plan is unknown
3. **Save**

### List 4: Premium Subscribers

1. **Create active list:** Premium Subscribers
2. **Filters:**
   - User ID is known
   - Subscription Plan contains "Premium"
3. **Save**

---

## Part 8: Create Automated Workflows

Now that users are syncing, create workflows:

### Workflow 1: Welcome Email Series

1. **Automation** → **Workflows** → **Create workflow**
2. **Type:** Contact-based
3. **Enrollment trigger:** 
   - User ID is known
   - Signup Date is known (to catch new signups)
4. **Actions:**
   - Wait 1 hour
   - Send email: "Welcome to King Ezekiel Academy"
   - Wait 2 days
   - Send email: "Getting Started Tips"
   - Wait 5 days
   - Send email: "Explore Our Courses"

### Workflow 2: Inactive User Re-engagement

1. **Create workflow:** Re-engage Inactive Users
2. **Enrollment trigger:**
   - User ID is known
   - Last activity date is more than 30 days ago
3. **Actions:**
   - Send email: "We miss you!"
   - Wait 3 days
   - If email opened: Send course recommendations
   - If email not opened: Add to "Inactive users" list

---

## Troubleshooting

### Error: "Missing HubSpot access token"

**Solution:** Make sure you created the Private App and added the token to `.env.local`

### Error: "Property 'user_id' does not exist"

**Solution:** Create the custom properties in HubSpot (see Part 5)

### Error: "401 Unauthorized"

**Solution:** 
- Check your access token is correct
- Verify the Private App has the required scopes
- Make sure the app is not deactivated

### Error: "429 Rate limit exceeded"

**Solution:** The script has built-in rate limiting, but if you hit limits:
- Wait 10 minutes
- Run the script again (it will skip existing contacts)

### Some Users Not Syncing

**Possible causes:**
- Invalid email format in Supabase
- Missing email (required field)
- HubSpot duplicate detection rules

**Check logs:** The script will show which users failed and why

### Want to Re-sync Specific Users?

The script automatically updates existing contacts, so just run it again:
```bash
npx ts-node scripts/sync-users-to-hubspot.ts
```

---

## Best Practices

1. **Run Initial Sync Once**
   - Only run the bulk sync script for existing users
   - New signups are automatic

2. **Schedule Periodic Syncs (Optional)**
   - Set up a cron job to run weekly
   - Updates any changed user data
   - Catches any missed signups

3. **Monitor HubSpot Data Quality**
   - Check for duplicate contacts
   - Validate email addresses
   - Keep custom properties updated

4. **Respect Privacy**
   - Only sync necessary user data
   - Comply with GDPR/data protection laws
   - Provide opt-out mechanisms

---

## Alternative: CSV Import (Simple Method)

If you prefer not to use the API:

### 1. Export Users from Supabase

```sql
SELECT 
  email,
  (user_metadata->>'full_name') as name,
  created_at as signup_date,
  id as user_id
FROM auth.users
ORDER BY created_at DESC;
```

Export as CSV.

### 2. Import to HubSpot

1. **Contacts** → **Import**
2. **Upload CSV file**
3. **Map columns:**
   - Email → Email
   - Name → First Name (split if needed)
   - Signup Date → Create Date
   - User ID → User ID (custom property)
4. **Import**

**Limitation:** This is one-time only and doesn't update existing contacts.

---

## Summary

✅ **Automatic Sync (Already Working):**
- New signups → Instant HubSpot contact creation
- User logins → Contact identification
- Events → Custom behavioral tracking

✅ **Bulk Import (Follow this guide):**
- Create HubSpot Private App
- Run sync script
- Import all existing users

✅ **Result:**
- All users in HubSpot CRM
- Automatic contact creation for new signups
- Ready for marketing automation!

---

**Need Help?**
- HubSpot Private Apps: https://developers.hubspot.com/docs/api/private-apps
- HubSpot API Docs: https://developers.hubspot.com/docs/api/crm/contacts
- Contact support if you encounter issues

**Last Updated:** October 2025  
**Version:** 1.0.0

