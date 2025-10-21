# 🤖 AI EXECUTION PLAN - TRIAL REMOVAL

## 📋 WHAT I (THE AI) WILL DO

**When you say:** "Go ahead" or "Start" or "Do it"  
**I will execute:** All steps below in exact order  
**You will:** Approve terminal commands & monitor progress  
**Estimated time:** 2-3 hours of work

---

## 🎯 MY STEP-BY-STEP EXECUTION PLAN

### **STEP 1: DELETE FILES** (2 files)
**Time:** 30 seconds  
**What I'll do:**

```
1.1 Delete TrialBanner.tsx
    → Tool: delete_file
    → Path: king-ezekiel-academy-nextjs/src/components/TrialBanner.tsx
    → Why: Entire component is trial-specific

1.2 Delete TrialManager.ts
    → Tool: delete_file
    → Path: king-ezekiel-academy-nextjs/src/utils/trialManager.ts
    → Why: Entire utility is trial-specific
```

**You'll see:** 2 files deleted notification

---

### **STEP 2: BACKEND API CHANGES** (5 files)
**Time:** 10 minutes  
**What I'll do:**

```
2.1 UPDATE: register/route.ts
    → Tool: search_replace
    → Remove: Lines 82-99 (trial initialization block)
    → File: king-ezekiel-academy-nextjs/src/app/api/auth/register/route.ts
    → Changes:
      • Delete try-catch block for trial creation
      • Remove adminClient.from('user_trials').insert()
      • Keep all other registration logic

2.2 UPDATE: subscriptions/status/route.ts
    → Tool: search_replace (2 edits)
    → File: king-ezekiel-academy-nextjs/src/app/api/subscriptions/status/route.ts
    → Changes:
      • Remove trial data fetch (lines 20-26)
      • Remove 'trial: trialData' from response object
      • Update has_access to only check subscription

2.3 UPDATE: flutterwave/webhook/route.ts
    → Tool: search_replace
    → File: king-ezekiel-academy-nextjs/src/app/api/payments/flutterwave/webhook/route.ts
    → Changes:
      • Remove trial deactivation code (lines 71-75)
      • Keep all payment processing logic

2.4 UPDATE: flutterwave/verify/route.ts
    → Tool: search_replace
    → File: king-ezekiel-academy-nextjs/src/app/api/payments/flutterwave/verify/route.ts
    → Changes:
      • Remove trial deactivation code (lines 85-89)
      • Keep all payment verification logic

2.5 SKIP: Database function update
    → Why: Requires manual SQL execution in Supabase
    → I'll provide you the SQL to run manually
    → File: check_course_access() function
```

**You'll see:** 4 files modified, 1 SQL script provided

---

### **STEP 3: FRONTEND COMPONENTS** (6 files)
**Time:** 20 minutes  
**What I'll do:**

```
3.1 UPDATE: AccessControl.tsx
    → Tool: search_replace (multiple edits)
    → File: king-ezekiel-academy-nextjs/src/components/AccessControl.tsx
    → Changes:
      • Remove: import TrialManager
      • Remove: import TrialBanner
      • Remove: trialStatus state variable
      • Remove: Trial checking logic (lines 87-160)
      • Keep: Free course check
      • Keep: Subscription checks (database + localStorage)
      • Update: hasAccess logic to remove trial condition

3.2 UPDATE: LessonPlayer.tsx
    → Tool: search_replace (multiple edits)
    → File: king-ezekiel-academy-nextjs/src/components/LessonPlayer.tsx
    → Changes:
      • Remove: isTrialActive state
      • Remove: Trial data fetch (lines 77-89)
      • Keep: Free course check (access_type === 'free')
      • Keep: Subscription check
      • Update: Access logic to remove trial

3.3 UPDATE: courses/page.tsx
    → Tool: search_replace (multiple edits)
    → File: king-ezekiel-academy-nextjs/src/app/courses/page.tsx
    → Changes:
      • Remove: import TrialManager
      • Remove: hasTrialAccess state
      • Remove: checkTrialAccessWithStatus() function
      • Remove: localStorage.getItem('user_trial_status')
      • Update: Button logic (remove trial checks)
      • Update: getAccessStatusText() (remove trial text)
      • Keep: Free course logic
      • Keep: Subscription logic

3.4 UPDATE: course/[courseId]/overview/page.tsx
    → Tool: search_replace (multiple edits)
    → File: king-ezekiel-academy-nextjs/src/app/course/[courseId]/overview/page.tsx
    → Changes:
      • Remove: import TrialBanner
      • Remove: import TrialManager
      • Remove: trialStatus state
      • Remove: Trial fetching logic
      • Remove: <TrialBanner> component
      • Update: hasAccess calculation
      • Keep: Free course check
      • Keep: Subscription check

3.5 UPDATE: dashboard/page.tsx
    → Tool: search_replace (multiple edits)
    → File: king-ezekiel-academy-nextjs/src/app/dashboard/page.tsx
    → Changes:
      • Remove: import TrialBanner (if present)
      • Remove: trialStatus state
      • Remove: fetchTrialStatus() function (lines 213-295)
      • Remove: Trial banner display
      • Remove: localStorage trial references
      • Keep: All other dashboard functionality

3.6 UPDATE: AuthContextOptimized.tsx
    → Tool: search_replace
    → File: king-ezekiel-academy-nextjs/src/contexts/AuthContextOptimized.tsx
    → Changes:
      • Remove: localStorage.removeItem('user_trial_status') in signOut
      • Keep: All other cleanup logic
```

**You'll see:** 6 files modified with detailed change logs

---

### **STEP 4: MARKETING CONTENT** (3 files)
**Time:** 5 minutes  
**What I'll do:**

```
4.1 UPDATE: layout.tsx (App Metadata)
    → Tool: search_replace (3 edits)
    → File: king-ezekiel-academy-nextjs/src/app/layout.tsx
    → Changes:
      Line 9 - keywords:
        OLD: 'free trial, subscription'
        NEW: 'free courses, subscription'
      
      Line 30 - og:description:
        OLD: 'Start your 7-day FREE trial today!'
        NEW: 'Access FREE courses forever! Upgrade for premium content.'
      
      Line 45 - twitter:description:
        OLD: 'Start your 7-day FREE trial today!'
        NEW: 'Access FREE courses forever! Upgrade for premium content.'

4.2 UPDATE: page.tsx (Landing Page)
    → Tool: search_replace (2 edits)
    → File: king-ezekiel-academy-nextjs/src/app/page.tsx
    → Changes:
      Line 17-18 - SEO description:
        OLD: 'Start your 7-day FREE trial today!'
        NEW: 'Start Learning for FREE Today!'
      
      Line 90 - Hero heading:
        OLD: 'Start your 7-day FREE trial today!'
        NEW: 'Start Learning for FREE Today!'

4.3 UPDATE: terms/page.tsx
    → Tool: search_replace
    → File: king-ezekiel-academy-nextjs/src/app/terms/page.tsx
    → Changes:
      Line 110:
        OLD: '7-day free trial available for new subscribers'
        NEW: 'Free courses available to all registered users'
```

**You'll see:** 3 files modified with marketing copy updates

---

### **STEP 5: CHECK & CLEAN ADDITIONAL FILES** (3 files)
**Time:** 5 minutes  
**What I'll do:**

```
5.1 CHECK: subscription/page.tsx
    → Tool: read_file
    → File: king-ezekiel-academy-nextjs/src/app/subscription/page.tsx
    → Action: 
      • Read file to check "trialing" status usage
      • Decide: This is Stripe's trialing status, not our trial
      • Decision: KEEP AS IS (different system)

5.2 CHECK: notificationService.ts
    → Tool: grep
    → File: king-ezekiel-academy-nextjs/src/utils/notificationService.ts
    → Action:
      • Search for trial-related code
      • If found: Remove trial notification logic
      • If not found: Skip

5.3 CHECK: courses-optimized/page.tsx
    → Tool: grep
    → File: king-ezekiel-academy-nextjs/src/app/courses-optimized/page.tsx
    → Action:
      • Search for trial references
      • If found: Remove trial logic
      • If not found: Skip
```

**You'll see:** Additional files checked and cleaned if needed

---

### **STEP 6: RUN LINTER & FIX ERRORS**
**Time:** 5 minutes  
**What I'll do:**

```
6.1 Check for linter errors
    → Tool: read_lints
    → Files: All modified files
    → Action: Read any TypeScript/ESLint errors

6.2 Fix import errors
    → Tool: search_replace
    → Action: Remove unused imports that reference deleted files
    → Examples:
      • TrialManager imports
      • TrialBanner imports
      • TrialStatus type imports

6.3 Fix type errors
    → Tool: search_replace
    → Action: Fix any TypeScript type errors
    → Examples:
      • Remove TrialStatus type usage
      • Update function signatures

6.4 Re-check lints
    → Tool: read_lints
    → Verify: All errors fixed
```

**You'll see:** Clean linter output (no errors)

---

### **STEP 7: CREATE DATABASE UPDATE SCRIPT**
**Time:** 2 minutes  
**What I'll do:**

```
7.1 Create SQL migration file
    → Tool: write
    → File: remove_trial_from_access_check.sql
    → Content: Updated check_course_access() function
    → Changes:
      • Remove has_trial variable
      • Remove trial check logic
      • Keep only free course + subscription checks

7.2 Provide instructions
    → Tell you: How to run this in Supabase SQL Editor
    → Tell you: Expected output
```

**You'll see:** SQL file created with instructions

---

### **STEP 8: CREATE CLEANUP SCRIPT** (Optional)
**Time:** 2 minutes  
**What I'll do:**

```
8.1 Create localStorage cleanup
    → Tool: write or search_replace
    → File: Add to AuthContextOptimized.tsx or app initialization
    → Code:
      // On app load or login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_trial_status');
      }

8.2 Create database cleanup SQL (optional)
    → Tool: write
    → File: cleanup_trial_data.sql
    → Content: SQL to archive/drop user_trials table
    → Note: You decide if you want to run this
```

**You'll see:** Cleanup scripts ready for your decision

---

### **STEP 9: SUMMARY & VERIFICATION**
**Time:** 2 minutes  
**What I'll do:**

```
9.1 Create change summary
    → Tool: write
    → File: TRIAL_REMOVAL_CHANGES.md
    → Content:
      • List of all files changed
      • Summary of changes made
      • Files deleted
      • Next steps for you

9.2 Provide testing checklist
    → Give you: Specific things to test
    → Give you: Expected outcomes
    → Give you: How to verify it worked

9.3 Provide deployment instructions
    → Command: git commands to commit
    → Command: build command
    → Steps: How to deploy
```

**You'll see:** Complete summary document

---

## 📊 EXECUTION SUMMARY

### **What I'll Modify:**
```
DELETE (2 files):
  ✗ src/components/TrialBanner.tsx
  ✗ src/utils/trialManager.ts

UPDATE - Backend (4 files):
  ✓ src/app/api/auth/register/route.ts
  ✓ src/app/api/subscriptions/status/route.ts
  ✓ src/app/api/payments/flutterwave/webhook/route.ts
  ✓ src/app/api/payments/flutterwave/verify/route.ts

UPDATE - Frontend (6 files):
  ✓ src/components/AccessControl.tsx
  ✓ src/components/LessonPlayer.tsx
  ✓ src/app/courses/page.tsx
  ✓ src/app/course/[courseId]/overview/page.tsx
  ✓ src/app/dashboard/page.tsx
  ✓ src/contexts/AuthContextOptimized.tsx

UPDATE - Marketing (3 files):
  ✓ src/app/layout.tsx
  ✓ src/app/page.tsx
  ✓ src/app/terms/page.tsx

CREATE (2-3 files):
  ✓ remove_trial_from_access_check.sql
  ✓ cleanup_trial_data.sql (optional)
  ✓ TRIAL_REMOVAL_CHANGES.md

TOTAL: 15 files modified, 2 deleted, 2-3 created
```

---

## ⏱️ TIME BREAKDOWN

| Step | Action | Time | Tool Calls |
|------|--------|------|------------|
| Step 1 | Delete files | 30 sec | 2 |
| Step 2 | Backend changes | 10 min | 8-10 |
| Step 3 | Frontend changes | 20 min | 15-20 |
| Step 4 | Marketing updates | 5 min | 6-8 |
| Step 5 | Additional checks | 5 min | 3-5 |
| Step 6 | Linter fixes | 5 min | 4-6 |
| Step 7 | Database script | 2 min | 1 |
| Step 8 | Cleanup scripts | 2 min | 1-2 |
| Step 9 | Summary | 2 min | 1 |
| **TOTAL** | **~50 minutes** | **41-55 calls** |

---

## 🛠️ TOOLS I'LL USE

1. **delete_file** - Remove TrialBanner.tsx, TrialManager.ts
2. **search_replace** - Modify all code files (30-40 uses)
3. **read_file** - Read files to understand context (as needed)
4. **grep** - Search for trial references (3-5 uses)
5. **read_lints** - Check for errors (2-3 uses)
6. **write** - Create SQL scripts and summary (2-3 uses)

**NO terminal commands** - All file operations done directly

---

## ⚠️ WHAT I **WON'T** DO (You'll need to)

```
❌ Run database migrations
   → You'll run the SQL in Supabase SQL Editor
   → I'll give you the exact SQL

❌ Deploy to production
   → You'll run: git add, commit, push
   → I'll give you the exact commands

❌ Test the application
   → You'll test locally first
   → I'll give you test checklist

❌ Send user emails
   → You'll communicate with users
   → I'll give you templates (already in docs)

❌ Update external marketing
   → You'll update Google Ads, Facebook, etc.
   → I'll remind you what needs updating
```

---

## ✅ WHAT YOU'LL APPROVE

During execution, you'll approve:

1. **Each file deletion** (2 approvals)
   - I'll ask before deleting files
   
2. **Major code changes** (batched by component)
   - I'll show you what's being changed
   
3. **Any terminal commands** (if needed)
   - Though most work is file operations

You can **interrupt at any time** and I'll stop immediately.

---

## 🎯 EXPECTED OUTCOME

When I'm done:

### **Your Codebase Will:**
✅ Have NO trial-related code in frontend  
✅ Have NO trial creation in registration  
✅ Have NO trial checks in access control  
✅ Have updated marketing copy (no trial mentions)  
✅ Still work perfectly for:
  - Free courses (authenticated users)
  - Paid courses (subscribed users)
  - New user registration
  - Subscription purchases

### **You'll Have:**
✅ SQL script to update database function  
✅ Summary document of all changes  
✅ Testing checklist  
✅ Deployment instructions  
✅ Cleanup scripts (optional use)  

### **Your App Will:**
✅ Work exactly the same for existing subscribers  
✅ Work for free course access  
✅ Show "Subscribe" for membership courses (no trial)  
✅ Process payments normally  
✅ Register new users without trial  

---

## 🚦 EXECUTION MODES

You can choose:

### **Mode 1: Full Auto** (Fastest)
- I do all steps 1-9 without pausing
- You review at the end
- ~50 minutes total

### **Mode 2: Step-by-Step** (Safest)
- I complete one step at a time
- You review after each step
- You say "continue" for next step
- ~1-2 hours total

### **Mode 3: File-by-File** (Most Control)
- I modify one file at a time
- You review each change
- You approve each modification
- ~2-3 hours total

**Recommended:** Mode 2 (Step-by-Step)

---

## 🆘 IF SOMETHING GOES WRONG

### **During Execution:**
- You say "STOP" → I stop immediately
- You say "UNDO last change" → I revert last file
- You say "Show me X file" → I show you current state

### **After Execution:**
- You can revert individual files
- You can rollback entire change
- I'll help you debug any issues

### **Rollback:**
```bash
# I'll give you these commands if needed
git status
git diff
git checkout -- <file>  # Revert one file
git reset --hard HEAD   # Revert everything
```

---

## 📋 PRE-EXECUTION CHECKLIST

Before I start, you should:

- [ ] Commit current changes (clean working directory)
- [ ] Confirm you want trial removed
- [ ] Choose execution mode (1, 2, or 3)
- [ ] Have Supabase access ready (for SQL later)
- [ ] Have 1-2 hours available (depending on mode)
- [ ] Backup is current (Supabase auto-backup or manual)

---

## 🎬 HOW TO START

When ready, just say one of:

- **"Start Mode 1"** - Full auto execution
- **"Start Mode 2"** - Step-by-step (recommended)
- **"Start Mode 3"** - File-by-file
- **"Go ahead"** - I'll ask which mode you want

---

## 📞 DURING EXECUTION

I'll keep you updated:
- ✅ "Step 1 complete - Deleted 2 files"
- ✅ "Step 2 complete - Updated 4 API files"
- ✅ "Step 3 in progress - Updating AccessControl.tsx..."
- ⚠️ "Found linter error - Fixing now..."
- ✅ "All steps complete! See summary below."

---

## 🎯 FINAL DELIVERABLES

When I say "Done", you'll have:

1. ✅ Clean codebase (no trial code)
2. ✅ All files modified and working
3. ✅ SQL script for database update
4. ✅ Summary document (TRIAL_REMOVAL_CHANGES.md)
5. ✅ Testing checklist
6. ✅ Deployment guide
7. ✅ No linter errors
8. ✅ Ready to test locally

**Then you:**
1. Test locally
2. Run SQL in Supabase
3. Test again
4. Commit & deploy
5. Monitor

---

**I'm ready when you are!** 🚀

**Just say:** "Start Mode 2" (or 1 or 3)

**NO ACTIONS TAKEN YET** - Waiting for your command.

