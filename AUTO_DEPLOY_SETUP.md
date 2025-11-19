# 🚀 Automatic Deployment Setup Guide

This guide explains how to set up automatic deployment to Vercel on every push to the `main` branch.

## ✅ Current Setup Status

### What's Already Configured:
- ✅ `vercel.json` - Build configuration exists
- ✅ GitHub Actions workflow - Created for build verification
- ✅ Build commands - Configured in package.json
- ⚠️ **Vercel GitHub Integration** - Needs to be verified/connected

## 🔧 Setting Up Automatic Deployment

### Option 1: Vercel GitHub Integration (Recommended)

Vercel has built-in GitHub integration that automatically deploys when you push to `main`. Here's how to ensure it's set up:

#### Step 1: Connect Vercel to GitHub (if not already done)

1. **Go to [vercel.com](https://vercel.com)**
2. **Login** with your GitHub account
3. **Navigate to your project**: `tkeaadmin-1p5x5sejf-king-ezekiel-academys-projects`
4. **Go to Settings → Git**

#### Step 2: Verify Git Integration

- **Production Branch**: Should be set to `main`
- **Auto-Deploy**: Should be **enabled**
- **Deploy Hooks**: Can be configured for additional triggers

#### Step 3: Configure Build Settings

In Vercel Dashboard → Settings → General:

- **Framework Preset**: `Next.js`
- **Root Directory**: Leave empty (or set to `king-ezekiel-academy-nextjs` if needed)
- **Build Command**: `cd king-ezekiel-academy-nextjs && npm run build`
- **Output Directory**: `king-ezekiel-academy-nextjs/.next`
- **Install Command**: `cd king-ezekiel-academy-nextjs && npm install`

These are already configured in your `vercel.json`, but verify in the dashboard.

#### Step 4: Environment Variables

Make sure all required environment variables are set in Vercel:

1. **Go to Settings → Environment Variables**
2. Add/verify these variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NODE_ENV=production
   ```

### Option 2: GitHub Actions + Vercel CLI (Alternative)

If you want more control, you can use GitHub Actions with Vercel CLI:

1. **Add Vercel tokens to GitHub Secrets**:
   - Go to Repository → Settings → Secrets → Actions
   - Add `VERCEL_TOKEN` (from Vercel Dashboard → Settings → Tokens)
   - Add `VERCEL_ORG_ID` (from Vercel Dashboard → Settings → General)
   - Add `VERCEL_PROJECT_ID` (from Vercel Dashboard → Settings → General)

2. **Update the workflow** to include Vercel deployment step

## 📋 Deployment Flow

Once set up correctly:

1. **Developer pushes to `main` branch**
   ```
   git push origin main
   ```

2. **Vercel automatically detects the push**
   - Monitors GitHub repository for changes
   - Triggers deployment on push to `main`

3. **Vercel builds the application**
   - Runs install command
   - Runs build command
   - Creates production build

4. **Vercel deploys to production**
   - URL: `https://tkeaadmin-1p5x5sejf-king-ezekiel-academys-projects.vercel.app`
   - Or your custom domain if configured

## 🔍 Verifying Auto-Deployment

### Check Vercel Dashboard:
1. Go to your Vercel project dashboard
2. Check the **Deployments** tab
3. You should see a new deployment appear automatically when you push to `main`

### Check Deployment Status:
```bash
# Check if deployment is live
curl -I https://tkeaadmin-1p5x5sejf-king-ezekiel-academys-projects.vercel.app

# View deployment logs in Vercel dashboard
# Settings → Deployments → Click on deployment → View logs
```

## 🛠️ Troubleshooting

### Deployment Not Triggering?

1. **Verify Git Integration**:
   - Vercel Dashboard → Settings → Git
   - Ensure repository is connected
   - Check that `main` branch is set as production branch

2. **Check Build Settings**:
   - Verify `vercel.json` is correct
   - Ensure build commands match your project structure

3. **Check GitHub Permissions**:
   - Vercel needs access to your GitHub repository
   - Go to GitHub Settings → Applications → Authorized OAuth Apps
   - Verify Vercel has necessary permissions

4. **Manual Deploy Test**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy manually to test
   vercel --prod
   ```

### Build Failing?

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Test build locally**:
   ```bash
   cd king-ezekiel-academy-nextjs
   npm run build
   ```

## 📊 Monitoring Deployments

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Deployment URL**: https://tkeaadmin-1p5x5sejf-king-ezekiel-academys-projects.vercel.app
- **GitHub Actions**: https://github.com/thekingezekielacademy/tkea-admin/actions

## ✅ Verification Checklist

- [ ] Vercel connected to GitHub repository
- [ ] `main` branch set as production branch
- [ ] Auto-deploy enabled in Vercel settings
- [ ] Build settings configured correctly
- [ ] Environment variables set in Vercel
- [ ] `vercel.json` exists and is correct
- [ ] Test deployment by pushing to `main`

## 🎯 Quick Start

To test automatic deployment right now:

```bash
# Make a small change
echo "<!-- Auto-deploy test -->" >> king-ezekiel-academy-nextjs/public/index.html

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push origin main

# Check Vercel dashboard in 1-2 minutes for new deployment
```

---

**Status**: ✅ Auto-deployment workflow created. Verify Vercel Git integration in dashboard.

