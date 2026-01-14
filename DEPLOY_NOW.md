# 🚀 DEPLOY NOW - Quick Reference

**One Command Deployment:**

```bash
cd /Users/macbook/tkea-admin && vercel --prod --yes
```

**That's it!** Deployment will complete automatically.

---

## 📋 **Pre-Deployment Checklist**

- [ ] Code committed: `git status` shows clean
- [ ] Changes pushed: `git push origin main`
- [ ] Vercel CLI installed: `which vercel`
- [ ] Logged in: `vercel login` (if needed)

---

## 🔧 **If Deployment Fails**

### **Error: Too Many Functions (>12)**
```bash
# Check API count (should be 3)
find api -name "*.js" -type f | grep -v "admin\|cron\|flutterwave\|test-verification\|health\|index" | wc -l

# Verify .vercelignore excludes unnecessary APIs
cat .vercelignore
```

### **Error: Build Failed**
```bash
# Check build command in vercel.json
cat vercel.json | grep buildCommand
# Should show: "CI=false npm run build:admin"
```

### **Error: Not Authenticated**
```bash
vercel login
```

---

## 📖 **Full Guide**

See `DEPLOYMENT_GUIDE_VERCEL_CLI.md` for complete documentation.

---

**Quick Deploy:** `vercel --prod --yes`  
**Status Check:** `vercel inspect <url> --logs`  
**Project:** `tkeaadmin`  
**Location:** `/Users/macbook/tkea-admin`
