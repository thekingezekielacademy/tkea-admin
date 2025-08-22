# 🔧 Streak Function Fix Guide

## **Step 1: Run the Diagnostic Script**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the content from `diagnose_streak_issue.sql`
3. Click **Run** to execute
4. **Save the results** - this will show us what's wrong

## **Step 2: Test Basic Function Creation**

1. In the same SQL Editor, copy and paste the content from `test_streak_function.sql`
2. Click **Run** to execute
3. **Check if you see:**
   - "Basic function works!"
   - "Today is today!"
   - "Yesterday: [date], Today: [date]"

## **Step 3: Fix the Streak Function**

1. If Step 2 works, copy and paste the content from `fix_streak_function.sql`
2. Click **Run** to execute
3. **Check for any errors**

## **What Each Step Does:**

### **Step 1 (Diagnostic):**
- Checks if the `profiles` table has the right columns
- Looks for existing broken functions
- Tests basic date arithmetic
- Shows current streak data

### **Step 2 (Test):**
- Creates simple functions to verify SQL syntax works
- Tests IF statements and date calculations
- Isolates the problem

### **Step 3 (Fix):**
- Removes the broken function
- Creates a new, corrected version
- Handles NULL values properly
- Fixes the streak logic

## **Expected Results:**

✅ **Step 1:** Should show table structure and any existing data
✅ **Step 2:** Should create and test 3 functions successfully  
✅ **Step 3:** Should create the streak function without errors

## **If You Get Errors:**

- **Copy the exact error message**
- **Tell me which step failed**
- **Share the error details**

## **Quick Test After Fix:**

```sql
-- Test if the function works
SELECT update_user_xp_and_streak(
  'your-user-id-here', 
  50, 
  'test'
);
```

---

**Ready to start? Begin with Step 1 (Diagnostic) and let me know what you see!**
