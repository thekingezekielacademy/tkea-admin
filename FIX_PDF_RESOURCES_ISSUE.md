# Fix: Course Resources Table Empty After Upload

## Problem
PDF resources are being uploaded to Supabase Storage successfully, but they're not being saved to the `course_resources` database table.

## Root Cause
The RLS (Row Level Security) policies on the `course_resources` table are incorrectly configured. The policy checks `auth.role() = 'admin'`, but Supabase's `auth.role()` function returns `'authenticated'`, not `'admin'`. The admin role is stored in the `profiles` table, not in the auth system.

## Solution

### Step 1: Fix RLS Policies
Run the SQL file `fix_course_resources_rls.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open or create a new query
3. Copy and paste the contents of `fix_course_resources_rls.sql`
4. Run the query

This will:
- Drop the incorrect policies
- Create new policies that check the `profiles` table for admin role
- Allow both admins and course creators to manage their own resources

### Step 2: Verify the Fix
After running the SQL:

1. Try uploading a PDF resource again in the Edit Course page
2. Check the browser console for any errors
3. Check the `course_resources` table in Supabase Dashboard → Table Editor

### Step 3: Check Error Messages
The code has been updated to show better error messages. If you still see errors:

1. Check the browser console for detailed error messages
2. Look for RLS policy violations
3. Verify your user has `role = 'admin'` in the `profiles` table

## Code Changes Made

1. **Better Error Handling**: Updated both `EditCourse.tsx` and `AdminAddCourseWizard.tsx` to:
   - Show errors to users instead of just logging warnings
   - Log detailed information about what's being inserted
   - Return inserted data for verification

2. **RLS Policy Fix**: Created `fix_course_resources_rls.sql` with correct policies that:
   - Check `profiles.role = 'admin'` instead of `auth.role() = 'admin'`
   - Allow course creators to manage their own resources
   - Allow admins to manage all resources

## Testing Checklist

- [ ] Run `fix_course_resources_rls.sql` in Supabase SQL Editor
- [ ] Verify your user has `role = 'admin'` in the `profiles` table
- [ ] Upload a PDF resource in Edit Course page
- [ ] Check browser console for any errors
- [ ] Verify the record appears in `course_resources` table
- [ ] Test that the PDF can be downloaded from the course view page

## Additional Notes

- The storage bucket `course-resources` must exist and be public
- File size limit is 50MB per PDF
- Only PDF files are accepted
- The `course_resources` table must exist with the correct schema (see `DATABASE_SCHEMA.md`)

