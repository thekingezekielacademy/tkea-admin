# 🚀 Vercel CLI Deployment Guide - Quick Deploy

**Last Updated:** January 14, 2026  
**Status:** ✅ **WORKING** - Direct deployment via CLI

---

## 📋 **QUICK DEPLOYMENT COMMAND**

```bash
cd /Users/macbook/tkea-admin
vercel --prod --yes
```

**That's it!** This command will:
- ✅ Build the admin app
- ✅ Deploy to production
- ✅ Skip the queue (if you have concurrent builds enabled)
- ✅ Deploy immediately without manual intervention

---

## 🎯 **WHAT THIS GUIDE COVERS**

1. **Direct CLI Deployment** - Deploy without Vercel dashboard
2. **API Route Management** - Stay under Vercel Hobby plan limits
3. **Build Configuration** - Optimized settings
4. **Troubleshooting** - Common issues and fixes

---

## 🔧 **PREREQUISITES**

### **1. Vercel CLI Installed**

Check if installed:
```bash
which vercel
```

If not installed:
```bash
npm install -g vercel
```

### **2. Logged In to Vercel**

Login (if not already):
```bash
vercel login
```

### **3. Project Linked**

The project should already be linked. If not:
```bash
cd /Users/macbook/tkea-admin
vercel link
```

---

## 🚀 **DEPLOYMENT PROCESS**

### **Step 1: Ensure Code is Committed**

```bash
cd /Users/macbook/tkea-admin
git status
```

If there are uncommitted changes:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### **Step 2: Deploy**

```bash
vercel --prod --yes
```

**Flags Explained:**
- `--prod` - Deploy to production (not preview)
- `--yes` - Skip confirmation prompts

### **Step 3: Verify Deployment**

The command will output:
```
Production: https://tkeaadmin-xxxxx-king-ezekiel-academys-projects.vercel.app
Inspect: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin/xxxxx
```

Check the deployment:
```bash
vercel inspect <deployment-url> --logs
```

---

## 📁 **API ROUTE MANAGEMENT**

### **Why API Routes Matter**

Vercel Hobby plan limits:
- **12 Serverless Functions** maximum
- Exceeding this causes deployment failure

### **Current API Routes (3 Essential)**

Only these are deployed (via `.vercelignore`):

1. ✅ `api/send-purchase-access-email.js` - Manual add to library emails
2. ✅ `api/send-email.js` - General email sending
3. ✅ `api/send-build-access-emails.js` - BUILD COMMUNITY access emails

### **Excluded API Routes**

These are excluded in `.vercelignore`:
- `api/admin/` - Admin-specific APIs
- `api/cron/` - Cron job APIs
- `api/flutterwave/` - Payment APIs (deployed separately)
- `api/test-verification.js` - Test endpoints
- `api/health.js` - Health check
- `api/index.js` - Index route

### **If You Need More API Routes**

**Option 1: Upgrade to Pro Plan**
- Allows unlimited serverless functions
- Go to Vercel Dashboard → Settings → Billing

**Option 2: Deploy APIs Separately**
- Create a separate Vercel project for APIs
- Update API URLs in admin app

**Option 3: Remove Unused Routes**
- Check which APIs are actually used
- Remove unused ones from `.vercelignore`

---

## ⚙️ **BUILD CONFIGURATION**

### **Current Settings (`vercel.json`)**

```json
{
  "buildCommand": "CI=false npm run build:admin",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Key Settings Explained**

- **`buildCommand`**: `CI=false npm run build:admin`
  - `CI=false` prevents warnings from failing the build
  - `npm run build:admin` builds the React admin app

- **`outputDirectory`**: `build`
  - React build output directory

- **`framework`**: `null`
  - Not using a framework preset (custom React app)

- **Rewrites**:
  - `/api/*` routes to serverless functions
  - All other routes to `index.html` (SPA routing)

---

## 🔍 **TROUBLESHOOTING**

### **Issue 1: "No more than 12 Serverless Functions"**

**Error:**
```
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

**Solution:**
1. Check `.vercelignore` includes unnecessary API folders
2. Verify only essential APIs are deployed:
   ```bash
   find api -name "*.js" -type f | grep -v "admin\|cron\|flutterwave\|test-verification\|health\|index"
   ```
3. Should show only 3 files:
   - `api/send-email.js`
   - `api/send-purchase-access-email.js`
   - `api/send-build-access-emails.js`

### **Issue 2: Build Fails with Warnings**

**Error:**
```
Treating warnings as errors because process.env.CI = true
```

**Solution:**
- Already fixed! `CI=false` in build command prevents this
- If still happening, verify `vercel.json` has `CI=false` in buildCommand

### **Issue 3: Deployment Queued**

**Symptom:**
- Deployment shows "Queued" status
- Takes too long to start

**Solutions:**
1. **Use CLI** (recommended):
   ```bash
   vercel --prod --yes
   ```
   - CLI deployments often skip the queue

2. **Enable Concurrent Builds** (if available):
   - Go to Vercel Dashboard → Settings → On-Demand Concurrent Builds
   - Choose "Run all builds immediately" (costs apply)

3. **Wait for Queue**:
   - Free option, but slower
   - One build at a time

### **Issue 4: Not Logged In**

**Error:**
```
Error: Not authenticated. Please run `vercel login`
```

**Solution:**
```bash
vercel login
```

### **Issue 5: Project Not Linked**

**Error:**
```
Error: No project found. Run `vercel link` to connect to an existing project.
```

**Solution:**
```bash
cd /Users/macbook/tkea-admin
vercel link
```

Select:
- Project: `tkeaadmin`
- Scope: `king-ezekiel-academys-projects`

---

## 📝 **DEPLOYMENT CHECKLIST**

Before deploying, verify:

- [ ] Code committed and pushed to GitHub
- [ ] `.vercelignore` excludes unnecessary API routes
- [ ] Only 3 API files will be deployed (check with `find` command)
- [ ] `vercel.json` has correct build command (`CI=false npm run build:admin`)
- [ ] Vercel CLI installed (`which vercel`)
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Project linked (`vercel link`)

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Deploy to Production**
```bash
cd /Users/macbook/tkea-admin
vercel --prod --yes
```

### **Check Deployment Status**
```bash
vercel inspect <deployment-url> --logs
```

### **List Recent Deployments**
```bash
vercel ls
```

### **View Project Info**
```bash
vercel inspect
```

### **Redeploy Latest**
```bash
vercel --prod --yes
```

### **Check API Routes Count**
```bash
find api -name "*.js" -type f | grep -v "admin\|cron\|flutterwave\|test-verification\|health\|index" | wc -l
```
Should output: `3`

---

## 🔐 **ENVIRONMENT VARIABLES**

If deployment needs environment variables:

1. **Set in Vercel Dashboard:**
   - Go to: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin/settings/environment-variables
   - Add required variables

2. **Or via CLI:**
   ```bash
   vercel env add VARIABLE_NAME production
   ```

Common variables needed:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_API_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

---

## 📊 **DEPLOYMENT WORKFLOW**

### **Standard Workflow**

1. **Make Changes**
   ```bash
   # Edit files
   # Test locally
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

3. **Deploy**
   ```bash
   vercel --prod --yes
   ```

4. **Verify**
   - Check deployment URL
   - Test functionality
   - Check logs if issues

### **Emergency Deployment**

If you need to deploy immediately:

```bash
cd /Users/macbook/tkea-admin
git add .
git commit -m "Emergency fix"
git push origin main
vercel --prod --yes
```

---

## 🎉 **SUCCESS INDICATORS**

Deployment is successful when you see:

```
✅ Build Completed in /vercel/output [XXs]
✅ Deployment completed
✅ status: ● Ready
```

And you get:
- Production URL
- Inspect URL
- No errors in logs

---

## 📞 **SUPPORT**

If deployment fails:

1. **Check Logs:**
   ```bash
   vercel inspect <deployment-url> --logs
   ```

2. **Common Issues:**
   - Too many API routes → Check `.vercelignore`
   - Build errors → Check `vercel.json` build command
   - Missing env vars → Set in Vercel dashboard

3. **Verify Configuration:**
   - `vercel.json` exists and is correct
   - `.vercelignore` excludes unnecessary files
   - `package.json` has `build:admin` script

---

## 📚 **RELATED FILES**

- `vercel.json` - Build configuration
- `.vercelignore` - Files to exclude from deployment
- `package.json` - Build scripts
- `src/` - React admin app source code
- `api/` - Serverless functions (only 3 deployed)

---

## ✅ **QUICK START FOR NEW AGENTS**

**To deploy immediately:**

```bash
# 1. Navigate to project
cd /Users/macbook/tkea-admin

# 2. Check if logged in
vercel whoami

# 3. If not logged in, login
vercel login

# 4. Deploy
vercel --prod --yes

# 5. Done! Deployment URL will be shown
```

**That's it!** The deployment will complete automatically.

---

**Document Maintained By:** Development Team  
**Last Updated:** January 14, 2026  
**Status:** ✅ Production Ready
