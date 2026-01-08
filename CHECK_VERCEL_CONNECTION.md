# How to Check Vercel-GitHub Connection

## Step-by-Step Guide

### 1. Check Vercel Dashboard - Git Integration

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin
   - Or go to: https://vercel.com/dashboard → Select "tkeaadmin" project

2. **Check Git Integration:**
   - Click on **Settings** (gear icon in the top right)
   - Click on **Git** in the left sidebar
   - Verify:
     - ✅ **Connected Git Repository**: Should show `thekingezekielacademy/tkea-admin`
     - ✅ **Production Branch**: Should be `main`
     - ✅ **Auto-deploy on push**: Should be **Enabled**

### 2. Check Recent Deployments

1. **Go to Deployments Tab:**
   - Click **Deployments** in the top navigation
   - Look for the latest deployment
   - Check:
     - **Status**: Should be "Ready" (green) or "Building"
     - **Source**: Should show "GitHub" with commit hash
     - **Commit Message**: Should match your latest commits

2. **If deployment failed:**
   - Click on the failed deployment
   - Check **Build Logs** for errors
   - Common issues:
     - Build command incorrect
     - Missing dependencies
     - Environment variables missing

### 3. Verify Build Settings

1. **Go to Settings → General:**
   - **Build Command**: Should be `npm run build:admin`
   - **Output Directory**: Should be `build`
   - **Install Command**: Should be `npm install` (or leave empty)
   - **Framework Preset**: Should be **Other** or **None**

2. **If settings are wrong:**
   - Update them to match the above
   - Click **Save**
   - Trigger a new deployment

### 4. Check if Auto-Deploy is Working

**Test Auto-Deploy:**
1. Make a small change (like adding a comment)
2. Commit and push to GitHub:
   ```bash
   git commit --allow-empty -m "Test deployment"
   git push origin main
   ```
3. Go to Vercel dashboard
4. Within 1-2 minutes, you should see a new deployment appear

### 5. Manual Deployment (If Auto-Deploy Not Working)

1. **In Vercel Dashboard:**
   - Go to **Deployments** tab
   - Click **Deploy** button (or three dots on latest deployment)
   - Select **Redeploy**
   - Choose the latest commit from GitHub
   - Click **Redeploy**

### 6. Check Deployment Logs

If deployment is failing:
1. Click on the deployment
2. Check **Build Logs** tab
3. Look for errors like:
   - `Command not found: react-scripts`
   - `Cannot find module`
   - `Build failed`

## Common Issues & Solutions

### Issue 1: "Deployed on Git" but old version shows
**Possible causes:**
- Browser cache (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
- CDN cache (wait 5-10 minutes)
- Wrong deployment is live (check which deployment has the green checkmark)

**Solution:**
- Clear browser cache
- Wait a few minutes
- Check which commit is actually deployed

### Issue 2: Auto-deploy not working
**Check:**
- Is GitHub integration connected?
- Is the correct branch set as production?
- Are there any webhook errors in GitHub Settings → Webhooks?

**Solution:**
- Reconnect GitHub integration
- Verify webhook is active in GitHub

### Issue 3: Build fails
**Common errors:**
- `react-scripts: command not found` → Need to install dependencies
- `Cannot find module` → Missing dependency
- `Build directory not found` → Wrong output directory

**Solution:**
- Check build logs
- Verify `package.json` has `react-scripts`
- Verify build command is correct

### Issue 4: Wrong app deployed
**If Next.js app is still deploying:**
- Check `.vercelignore` exists and excludes `king-ezekiel-academy-nextjs/`
- Verify build command is `npm run build:admin`
- Check output directory is `build` not `.next`

## Quick Verification Commands

Run these locally to verify configuration:

```bash
# Check vercel.json
cat vercel.json

# Check package.json has build:admin script
grep "build:admin" package.json

# Check .vercelignore exists
cat .vercelignore

# Test build locally
npm run build:admin
```

## Still Not Working?

1. **Check Vercel Project Settings:**
   - Ensure project name is `tkeaadmin`
   - Ensure it's in the correct team/account

2. **Check GitHub Repository:**
   - Verify repo is: `thekingezekielacademy/tkea-admin`
   - Check if webhook is active: GitHub → Settings → Webhooks

3. **Force Redeploy:**
   - In Vercel, go to latest deployment
   - Click three dots → Redeploy
   - This forces a fresh build

4. **Check Environment Variables:**
   - Settings → Environment Variables
   - Ensure all required vars are set

