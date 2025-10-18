# HubSpot Integration Checklist

## ✅ Already Completed

- ✅ **HubSpot tracking code** added to your site
- ✅ **Portal ID configured** in Vercel (147094057)
- ✅ **Automatic page view tracking** enabled
- ✅ **User identification** on login
- ✅ **Signup tracking** - new users auto-create HubSpot contacts
- ✅ **Sync script created** for existing users
- ✅ **HubSpot API client** installed
- ✅ **Documentation** complete
- ✅ **Code deployed** to production

## 🔄 Next: Import Existing Users (Do Once)

### 1. Create HubSpot Private App Token (2 minutes)
- [ ] Go to: https://app.hubspot.com/settings/147094057/integrations/private-apps
- [ ] Click "Create a private app"
- [ ] Name: `King Ezekiel Academy Sync`
- [ ] Enable scopes: `crm.objects.contacts.read` & `crm.objects.contacts.write`
- [ ] Create and copy the access token

### 2. Add Token to Local Environment (30 seconds)
```bash
# Edit this file:
nano /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs/.env.local

# Add this line:
HUBSPOT_PRIVATE_APP_TOKEN=paste_your_token_here
```

### 3. Run the Sync (1 command)
```bash
cd /Users/macbook/thekingezekielacademy/king-ezekiel-academy-nextjs
npm run sync-hubspot
```

### 4. Verify in HubSpot (1 minute)
- [ ] Go to: https://app.hubspot.com/contacts/147094057
- [ ] Check that all users are listed
- [ ] Verify user details are correct

## 🎉 After Import - You're Done!

From that point forward:
- ✅ All new signups automatically added to HubSpot
- ✅ No manual work needed
- ✅ Ready for marketing automation

## 📊 Optional: Set Up Marketing Automation

### Create Smart Lists
- [ ] All App Users (User ID is known)
- [ ] New Signups (Last 30 days)
- [ ] Premium Subscribers (Has subscription)
- [ ] Inactive Users (No activity 30+ days)

### Create Workflows
- [ ] Welcome email series for new signups
- [ ] Re-engagement for inactive users
- [ ] Upsell campaigns for free users
- [ ] Course completion celebrations

### Add More Event Tracking
- [ ] Course enrollments
- [ ] Lesson completions
- [ ] Payment events
- [ ] Custom user actions

## 📖 Documentation Reference

| Document | Purpose |
|----------|---------|
| `QUICK_START_HUBSPOT_SYNC.md` | Quick steps to sync users |
| `HUBSPOT_USER_SYNC_GUIDE.md` | Complete sync documentation |
| `HUBSPOT_INTEGRATION_GUIDE.md` | Full integration guide & examples |

## ⏱️ Time Investment

- **Initial Setup (Already Done):** ✅ Complete
- **Import Existing Users:** 5 minutes (one-time)
- **Create Lists/Workflows:** 30 minutes (optional)
- **Ongoing Maintenance:** 0 minutes (fully automated)

## 🆘 Need Help?

### Quick Fixes

**Can't find Private Apps in HubSpot?**
→ Direct link: https://app.hubspot.com/settings/147094057/integrations/private-apps

**Sync script errors?**
→ Check that all environment variables are set in `.env.local`

**No users showing in HubSpot?**
→ Wait 5-10 minutes after running sync, then refresh

### Full Documentation

Read the complete guides for:
- Detailed troubleshooting
- Advanced features
- Workflow examples
- API usage

---

**Current Status:** 🟢 Ready for User Import  
**Next Step:** Create HubSpot Private App token and run sync

