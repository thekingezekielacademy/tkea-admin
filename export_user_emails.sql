-- Export All User Emails from Supabase
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Simple email list (for quick copy/paste)
SELECT email
FROM auth.users
ORDER BY created_at DESC;

-- Or get more details (email, name, signup date)
-- SELECT 
--   email,
--   COALESCE(
--     raw_user_meta_data->>'full_name',
--     user_metadata->>'full_name',
--     'No name'
--   ) as full_name,
--   created_at::date as signup_date
-- FROM auth.users
-- ORDER BY created_at DESC;

-- Or export as CSV format (ready for HubSpot import)
-- SELECT 
--   email as "Email",
--   SPLIT_PART(COALESCE(raw_user_meta_data->>'full_name', user_metadata->>'full_name', ''), ' ', 1) as "First Name",
--   SUBSTRING(COALESCE(raw_user_meta_data->>'full_name', user_metadata->>'full_name', '') FROM POSITION(' ' IN COALESCE(raw_user_meta_data->>'full_name', user_metadata->>'full_name', '')) + 1) as "Last Name",
--   COALESCE(raw_user_meta_data->>'phone', user_metadata->>'phone', '') as "Phone Number",
--   created_at::date as "Signup Date",
--   id as "User ID"
-- FROM auth.users
-- ORDER BY created_at DESC;

