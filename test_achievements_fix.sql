-- =====================================================
-- TEST: Verify user_achievements table works
-- Run this after running the fix
-- =====================================================

-- Test 1: Check if table exists
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_achievements';

-- Test 2: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_achievements';

-- Test 3: Check policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'user_achievements';

-- Test 4: Try to insert a test achievement (this should work for authenticated users)
-- INSERT INTO user_achievements (user_id, achievement_id, title, description, category, xp_reward)
-- VALUES (auth.uid(), 'test_achievement', 'Test Achievement', 'This is a test', 'test', 100);

-- Test 5: Check if we can query achievements
SELECT COUNT(*) as total_achievements FROM user_achievements;
