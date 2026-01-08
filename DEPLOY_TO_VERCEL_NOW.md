# Deploy to Vercel - Step by Step Guide

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin
2. Make sure you're logged in

### Step 2: Manual Deployment
1. Click on **"Deployments"** tab (top navigation)
2. Click the **"Deploy"** button (usually top right, or click three dots on latest deployment)
3. Select **"Redeploy"** or **"Deploy"**

### Step 3: Select Latest Commit
1. If prompted, select **"Import from Git"** or **"Deploy from GitHub"**
2. Choose the latest commit: `f1632c74` (Trigger Vercel deployment) or `8fca13c8` (Add Vercel admin deployment documentation)
3. Click **"Deploy"**

### Step 4: Verify Build Settings (Before Deploying)
Before deploying, verify these settings:

**Go to Settings → General:**
- **Build Command**: `npm run build:admin`
- **Output Directory**: `build`
- **Install Command**: `npm install` (or leave empty)
- **Framework Preset**: `Other` or `None`
- **Root Directory**: `.` (root)

**If settings are wrong:**
1. Update them to match above
2. Click **"Save"**
3. Then proceed with deployment

### Step 5: Monitor Deployment
1. Watch the build logs in real-time
2. Look for:
   - ✅ `npm run build:admin`
   - ✅ `react-scripts build`
   - ✅ `Creating an optimized production build...`
3. If you see `cd king-ezekiel-academy-nextjs` or `next build`, the settings are wrong!

### Step 6: Verify Deployment
Once deployment completes:
1. Check the deployment shows commit `f1632c74` or `8fca13c8` (not `21699c7`)
2. Status should be **"Ready"** (green)
3. Click on the deployment URL to test the admin app

---

## Method 2: Connect Git and Auto-Deploy

If you want automatic deployments on every push:

### Step 1: Connect GitHub
1. Go to **Settings → Git**
2. If not connected, click **"Connect Git Repository"**
3. Select: `thekingezekielacademy/tkea-admin`
4. Choose **Production Branch**: `main`
5. Enable **"Auto-deploy on push"**
6. Click **"Save"**

### Step 2: Verify Webhook
1. Go to GitHub: https://github.com/thekingezekielacademy/tkea-admin/settings/hooks
2. Find the Vercel webhook
3. Verify it's **Active** and shows recent deliveries

### Step 3: Test Auto-Deploy
1. Make a small change
2. Commit and push
3. Check Vercel dashboard - new deployment should appear within 1-2 minutes

---

## Method 3: Using Vercel CLI (If Authenticated)

If you have Vercel CLI access:

```bash
# Login first
vercel login

# Link to project
vercel link --project=tkeaadmin

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Issue: Deployment still shows old commit
**Solution:**
- Make sure you're selecting the latest commit when deploying
- Check that build settings are correct
- Try disconnecting and reconnecting Git

### Issue: Build fails
**Check build logs for:**
- Missing dependencies → Add to package.json
- Wrong build command → Update in Settings
- Environment variables missing → Add in Settings → Environment Variables

### Issue: Wrong app deployed (Next.js instead of React)
**Solution:**
- Verify `.vercelignore` excludes `king-ezekiel-academy-nextjs/`
- Verify build command is `npm run build:admin`
- Verify output directory is `build`

### Issue: "Deployed on Git" but old version
**Solution:**
- Clear browser cache (Cmd+Shift+R)
- Wait 5-10 minutes for CDN cache
- Check which deployment is actually live (green checkmark)
- Force redeploy the correct deployment

---

## Quick Checklist

Before deploying, verify:
- [ ] `vercel.json` has correct build command
- [ ] `package.json` has `build:admin` script
- [ ] `.vercelignore` excludes Next.js app
- [ ] Latest code is pushed to GitHub
- [ ] Build settings in Vercel match configuration
- [ ] You're deploying from the correct commit

---

## Current Status

**Latest Commit:** `f1632c74` - "Trigger Vercel deployment - Update admin app configuration"

**Previous Commits:**
- `8fca13c8` - Add Vercel admin deployment documentation
- `45f1dac7` - Configure Vercel to deploy React admin app instead of Next.js app
- `e4c0b23e` - Fix access_type constraint violation and purchase_price handling

**Expected Build Output:**
- Build command: `npm run build:admin`
- Output: `build/` directory with React app
- Should NOT see Next.js build output

