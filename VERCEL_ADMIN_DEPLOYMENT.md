# Vercel Admin Deployment Configuration

## ✅ Changes Made

### 1. Updated `vercel.json`
- Changed build command to build React admin app: `npm run build:admin`
- Set output directory to `build/` (React build output)
- Removed Next.js framework configuration
- Added SPA rewrites for React Router

### 2. Updated `package.json`
- Added `build:admin` script: `react-scripts build`

### 3. Created `.vercelignore`
- Excludes `king-ezekiel-academy-nextjs/` from deployment
- Ensures only the React admin app is deployed

### 4. Pushed to GitHub
- All changes committed and pushed to: https://github.com/thekingezekielacademy/tkea-admin.git

## 🚀 Deployment Steps

### Automatic Deployment (Recommended)
If Vercel is connected to the GitHub repository, it will automatically deploy when you push to `main` branch.

### Manual Deployment
1. Go to Vercel Dashboard: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment, or
4. Click "Deploy" button to trigger a new deployment

### Verify Deployment Settings
In Vercel Dashboard → Settings → General:
- **Build Command**: `npm run build:admin`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Framework Preset**: Other (or None)

### Verify Git Integration
In Vercel Dashboard → Settings → Git:
- Ensure connected to: `https://github.com/thekingezekielacademy/tkea-admin.git`
- Production Branch: `main`
- Auto-deploy on push: Enabled

## 🔒 Important Notes

1. **Never deploy Next.js app from this repo**: The `.vercelignore` file ensures `king-ezekiel-academy-nextjs/` is excluded
2. **Always push to GitHub**: All changes should be pushed to `https://github.com/thekingezekielacademy/tkea-admin.git`
3. **Admin app only**: This Vercel project (`tkeaadmin`) is configured to deploy ONLY the React admin app from `src/`

## 📝 Build Process

When Vercel builds:
1. Runs `npm install` (installs all dependencies including react-scripts)
2. Runs `npm run build:admin` (builds React app to `build/` directory)
3. Serves files from `build/` directory
4. Uses rewrites to handle React Router routes

## ✅ Verification Checklist

- [ ] Vercel project is linked to GitHub repo
- [ ] Build command is set to `npm run build:admin`
- [ ] Output directory is set to `build`
- [ ] `.vercelignore` is in place (excludes Next.js app)
- [ ] Latest deployment shows React admin app (not Next.js)
- [ ] Admin panel is accessible and working

## 🔧 Troubleshooting

If deployment fails:
1. Check Vercel build logs for errors
2. Verify `react-scripts` is in `package.json` dependencies
3. Ensure `public/index.html` exists
4. Check that `src/index.tsx` and `src/App.tsx` are present
5. Verify environment variables are set in Vercel dashboard

