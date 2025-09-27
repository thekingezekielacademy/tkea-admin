-- SAFE SCRIPT: Add email column to user_subscriptions table
-- This script will add email column and populate it for ALL users
-- SAFE: Uses IF NOT EXISTS and proper error handling

-- ===========================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURE
-- ===========================================
SELECT '=== CURRENT TABLE STRUCTURE ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
ORDER BY ordinal_position;

-- ===========================================
-- STEP 2: ADD EMAIL COLUMN (SAFE)
-- ===========================================
SELECT '=== ADDING EMAIL COLUMN ===' as step;

-- Add email column if it doesn't exist
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS email TEXT;

-- ===========================================
-- STEP 3: POPULATE EMAIL FOR ALL USERS (SAFE)
-- ===========================================
SELECT '=== POPULATING EMAIL FOR ALL USERS ===' as step;

-- Update ALL existing subscriptions with email from profiles table
-- This is safe because it only updates NULL emails
UPDATE user_subscriptions 
SET email = p.email
FROM profiles p 
WHERE user_subscriptions.user_id = p.id 
AND user_subscriptions.email IS NULL;

-- ===========================================
-- STEP 4: ADD PERFORMANCE INDEX (SAFE)
-- ===========================================
SELECT '=== ADDING PERFORMANCE INDEX ===' as step;

-- Add index for faster email queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email ON user_subscriptions(email);

-- ===========================================
-- STEP 5: VERIFY THE CHANGES (SAFE)
-- ===========================================
SELECT '=== VERIFICATION: EMAIL COLUMN ADDED ===' as step;

-- Check if email column was added successfully
SELECT 
    'Email Column Status' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
AND column_name = 'email';

-- ===========================================
-- STEP 6: SHOW UPDATED SUBSCRIPTIONS (SAFE)
-- ===========================================
SELECT '=== UPDATED SUBSCRIPTIONS WITH EMAIL ===' as step;

-- Show all subscriptions now with email
SELECT 
    'All Subscriptions with Email' as check_type,
    us.id,
    us.user_id,
    us.email,
    us.plan_name,
    us.status,
    us.amount,
    us.created_at,
    p.email as profile_email,
    p.name
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
ORDER BY us.created_at DESC;

-- ===========================================
-- STEP 7: COUNT VERIFICATION (SAFE)
-- ===========================================
SELECT '=== COUNT VERIFICATION ===' as step;

-- Count how many subscriptions now have email
SELECT 
    'Email Population Status' as check_type,
    COUNT(*) as total_subscriptions,
    COUNT(email) as subscriptions_with_email,
    COUNT(*) - COUNT(email) as subscriptions_without_email
FROM user_subscriptions;

-- ===========================================
-- STEP 8: FINAL SUCCESS MESSAGE (SAFE)
-- ===========================================
SELECT '=== SCRIPT COMPLETED SUCCESSFULLY ===' as step;

SELECT 
    'SUCCESS: Email column added to user_subscriptions table' as message,
    'All existing subscriptions now have email addresses' as result,
    'You can now query subscriptions directly by email' as benefit;
