# 🗄️ How to Run Batch Class System Migrations

## ⚠️ **You're seeing this error because the database tables don't exist yet.**

The Batch Class System needs these tables to be created in your Supabase database.

---

## 📋 **Step-by-Step Instructions:**

### **Step 1: Open Supabase SQL Editor**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `evqerkqiquwxqlizdqmg`
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### **Step 2: Run First Migration**

1. Open the file: `supabase/migrations/20250117_001_create_batch_class_system.sql`
2. **Copy ALL the contents** of that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for it to complete (should take a few seconds)

**What this creates:**
- `batch_classes` table - Configuration for the 5 classes
- `batches` table - Weekly batches for each class
- `batch_class_sessions` table - Individual sessions
- `user_batch_enrollments` table - User enrollment tracking
- `batch_class_notifications` table - Notification tracking

### **Step 3: Run Second Migration**

1. Open the file: `supabase/migrations/20250117_002_setup_batch_class_live_classes.sql`
2. **Copy ALL the contents** of that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"**
5. Wait for it to complete

**What this creates:**
- Links batch classes to `live_classes` table
- Sets up the 5 batch classes with their configurations
- Creates `live_classes` entries for each batch class

### **Step 4: Verify It Worked**

1. Go back to: `https://tkeaadmin.vercel.app/admin/batch-classes-status`
2. Refresh the page
3. You should see:
   - ✅ 5 Batch Classes Configured
   - ✅ No errors
   - ✅ Status page loads properly

---

## 🔍 **Quick Check:**

Run this SQL in Supabase to verify tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'batch_classes',
  'batches', 
  'batch_class_sessions',
  'user_batch_enrollments',
  'batch_class_notifications'
);

-- Should return 5 rows
```

---

## 🆘 **If Something Goes Wrong:**

### **Error: "relation already exists"**
- Tables already exist - you can skip that migration
- Or drop tables first if you want to recreate them

### **Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check that you have the correct Supabase project selected

### **Error: "syntax error"**
- Make sure you copied the ENTIRE file contents
- Don't copy just part of the file
- Check for any extra characters at the beginning/end

---

## 📝 **Alternative: Run via Supabase CLI**

If you have Supabase CLI installed:

```bash
cd /Users/macbook/tkea-admin
supabase db push
```

This will run all pending migrations automatically.

---

## ✅ **After Running Migrations:**

Once migrations are complete:
1. Go to `/admin/batch-classes-status`
2. Click **"🚀 Kickstart System"**
3. System will create batches and sessions automatically!

---

**Need help?** Check the migration files:
- `supabase/migrations/20250117_001_create_batch_class_system.sql`
- `supabase/migrations/20250117_002_setup_batch_class_live_classes.sql`
