# 🔗 Vercel Deploy Hooks Guide

## What are Deploy Hooks?

Deploy hooks are unique URLs that allow you to trigger a deployment of a specific branch from external services, APIs, or manual triggers. They're useful for:

- **External CI/CD systems** (Jenkins, CircleCI, etc.)
- **Webhook triggers** from other services
- **Manual deployments** via API calls
- **Scheduled deployments** via cron jobs
- **Integration with third-party tools**

## ⚠️ Do You Need a Deploy Hook?

**If you already have Git integration working:**
- ✅ **You DON'T need a deploy hook** - Git integration automatically deploys on push to `main`
- Deploy hooks are only needed if you want to trigger deployments **separately** from Git pushes

## 📋 Setting Up a Deploy Hook (Optional)

If you still want to set up a deploy hook (for manual triggers, external services, etc.):

### Configuration:

**Name**: `Production Deploy` or `Main Branch Deploy` or `Manual Deploy Hook`

**Branch**: `main`

**Description** (optional): "Trigger production deployment manually or from external services"

### How It Works:

1. **Vercel generates a unique URL** like:
   ```
   https://api.vercel.com/v1/integrations/deploy/QmXxxx...
   ```

2. **You can trigger deployment** by making a POST request:
   ```bash
   curl -X POST "YOUR_DEPLOY_HOOK_URL"
   ```

3. **Deployment is triggered** without needing to push to Git

## 🔧 Usage Examples

### Manual Deployment via cURL:
```bash
curl -X POST "YOUR_DEPLOY_HOOK_URL"
```

### From GitHub Actions (if you want custom trigger logic):
```yaml
- name: Trigger Vercel Deployment
  run: |
    curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

### From External Webhook:
- Connect external services (Zapier, Make, etc.)
- Set up automated triggers based on events
- Trigger deployments without Git push

## 🎯 Recommended Setup

For your project, here's what I recommend:

### Option 1: Git Integration Only (Recommended) ✅
- **Use**: Git integration (already configured)
- **Benefit**: Automatic deployments on every push
- **No deploy hook needed**

### Option 2: Git + Deploy Hook
- **Use**: Git integration for automatic deploys
- **Plus**: Deploy hook for manual/emergency deployments
- **Hook Name**: `Manual Deploy - Main`
- **Branch**: `main`

## 📝 Suggested Hook Names

Choose one that fits your use case:

1. **`Manual Deploy - Production`** - For manual triggers
2. **`Production Deploy Hook`** - Simple and clear
3. **`Main Branch Deploy`** - Describes the branch
4. **`Emergency Deploy`** - For urgent deployments
5. **`External Trigger`** - For third-party integrations

## ⚠️ Security Notes

1. **Keep deploy hook URLs secret** - Add to environment variables/secrets
2. **Don't commit** deploy hook URLs to Git
3. **Use environment variables** in CI/CD:
   ```bash
   VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
   ```

## 🔍 Current Status

For your project (`tkea-admin`):

- ✅ **Git Integration**: Configured (auto-deploys on push to `main`)
- ⚠️ **Deploy Hook**: Optional (not required if Git integration works)
- 🎯 **Recommendation**: Only create a deploy hook if you need:
  - Manual deployment triggers
  - External service integration
  - Scheduled deployments
  - Custom deployment logic

## 🚀 Quick Setup (If Needed)

If you decide to create a deploy hook:

1. **Go to Vercel Dashboard** → Your Project → Settings → Deploy Hooks
2. **Click "Create Hook"**
3. **Name**: `Production Deploy` (or your preferred name)
4. **Branch**: `main`
5. **Save** - Copy the generated URL
6. **Store securely** - Add to environment variables if using in CI/CD

---

**Conclusion**: Since you have Git integration set up, you probably **don't need** a deploy hook. However, if you want one for manual triggers or external integrations, use the name `Production Deploy` with branch `main`.

