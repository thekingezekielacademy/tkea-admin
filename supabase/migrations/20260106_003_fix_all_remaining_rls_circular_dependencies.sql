-- Fix ALL remaining RLS policies with circular dependency issues
-- This migration fixes all admin policies that query profiles table directly
-- Solution: Replace all direct profiles queries with is_admin() function

BEGIN;

-- Ensure is_admin function exists and properly bypasses RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER runs with function owner privileges, bypassing RLS
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- =====================================================
-- ADMIN SETTINGS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can update admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can insert admin settings" ON admin_settings;

CREATE POLICY "Admins can view admin settings" ON admin_settings
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin settings" ON admin_settings
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin settings" ON admin_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- AFFILIATE CODES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all affiliate codes" ON affiliate_codes;
CREATE POLICY "Admins can view all affiliate codes" ON affiliate_codes
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- AFFILIATE REFERRALS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all referrals" ON affiliate_referrals;
CREATE POLICY "Admins can view all referrals" ON affiliate_referrals
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- CLASS QA
-- =====================================================
DROP POLICY IF EXISTS "Admins can answer questions" ON class_qa;
CREATE POLICY "Admins can answer questions" ON class_qa
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- CLASS REMINDERS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all reminders" ON class_reminders;
CREATE POLICY "Admins can view all reminders" ON class_reminders
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- COURSE NOTIFICATIONS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all course notifications" ON course_notifications;
DROP POLICY IF EXISTS "Admins can update all course notifications" ON course_notifications;

CREATE POLICY "Admins can view all course notifications" ON course_notifications
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all course notifications" ON course_notifications
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- LEARNING PATHS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins can insert learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins can update learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins can delete learning paths" ON learning_paths;

CREATE POLICY "Admins can view all learning paths" ON learning_paths
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert learning paths" ON learning_paths
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update learning paths" ON learning_paths
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete learning paths" ON learning_paths
  FOR DELETE USING (is_admin(auth.uid()));

-- =====================================================
-- LEARNING PATH COURSES
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all learning path courses" ON learning_path_courses;
CREATE POLICY "Admins can manage all learning path courses" ON learning_path_courses
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- LIVE CLASS ACCESS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all access" ON live_class_access;
CREATE POLICY "Admins can manage all access" ON live_class_access
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- LIVE CLASS PAY LATER REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all pay later requests" ON live_class_pay_later_requests;
CREATE POLICY "Admins can view all pay later requests" ON live_class_pay_later_requests
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- LIVE CLASS PAYMENTS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all payments" ON live_class_payments;
CREATE POLICY "Admins can view all payments" ON live_class_payments
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- LIVE CLASS QA
-- =====================================================
DROP POLICY IF EXISTS "Admins can answer questions" ON live_class_qa;
CREATE POLICY "Admins can answer questions" ON live_class_qa
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- PAY LATER REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all pay later requests" ON pay_later_requests;
DROP POLICY IF EXISTS "Admins can update all pay later requests" ON pay_later_requests;

CREATE POLICY "Admins can view all pay later requests" ON pay_later_requests
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all pay later requests" ON pay_later_requests
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- PRODUCT PURCHASES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all purchases" ON product_purchases;
CREATE POLICY "Admins can view all purchases" ON product_purchases
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- SKILL PATH RESPONSES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all skill path responses" ON skill_path_responses;
DROP POLICY IF EXISTS "Admins can manage all skill path responses" ON skill_path_responses;

CREATE POLICY "Admins can view all skill path responses" ON skill_path_responses
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all skill path responses" ON skill_path_responses
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- USER COURSES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Admins can update all course enrollments" ON user_courses;

CREATE POLICY "Admins can view all course enrollments" ON user_courses
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all course enrollments" ON user_courses
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- WALLET TRANSACTIONS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all transactions" ON wallet_transactions;
CREATE POLICY "Admins can view all transactions" ON wallet_transactions
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- WALLETS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- WITHDRAWALS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;

CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE USING (is_admin(auth.uid()));

COMMIT;

