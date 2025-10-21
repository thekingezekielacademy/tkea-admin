-- =====================================================
-- FIX CONSOLE ERRORS - DATABASE MIGRATIONS
-- =====================================================
-- Date: October 18, 2025
-- Purpose: Fix missing database columns and views causing console errors

-- =====================================================
-- MIGRATION 1: Add is_active column to user_subscriptions
-- =====================================================
-- This fixes the error: column user_subscriptions.is_active does not exist

-- Add is_active column if it doesn't exist
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records based on status
-- Only mark as active if status is 'active' and not expired
UPDATE user_subscriptions 
SET is_active = (
  status = 'active' AND 
  (end_date IS NULL OR end_date > NOW()) AND
  (next_billing_date IS NULL OR next_billing_date > NOW())
)
WHERE is_active IS NULL OR is_active != (
  status = 'active' AND 
  (end_date IS NULL OR end_date > NOW()) AND
  (next_billing_date IS NULL OR next_billing_date > NOW())
);

-- Create index for performance (filtered index for active subscriptions)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active 
ON user_subscriptions(user_id, is_active, status, created_at DESC) 
WHERE is_active = true;

-- Create function to automatically update is_active based on dates
CREATE OR REPLACE FUNCTION update_subscription_is_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_active based on status and dates
  NEW.is_active = (
    NEW.status = 'active' AND 
    (NEW.end_date IS NULL OR NEW.end_date > NOW()) AND
    (NEW.next_billing_date IS NULL OR NEW.next_billing_date > NOW())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update is_active
DROP TRIGGER IF EXISTS trigger_update_subscription_is_active ON user_subscriptions;
CREATE TRIGGER trigger_update_subscription_is_active
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_is_active();

-- =====================================================
-- MIGRATION 2: Create user_progress_summary view
-- =====================================================
-- This fixes the error: relation "user_progress_summary" does not exist

-- Drop the view if it exists (to recreate)
DROP VIEW IF EXISTS user_progress_summary;

-- Create the view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  ulp.user_id,
  ulp.course_id,
  c.title as course_title,
  COUNT(DISTINCT ulp.lesson_id) as total_lessons,
  COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END) as completed_lessons,
  ROUND(
    (COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lesson_id END)::numeric / 
     NULLIF(COUNT(DISTINCT ulp.lesson_id), 0)) * 100, 0
  )::integer as progress_percentage,
  MAX(ulp.started_at) as last_accessed,
  MAX(ulp.completed_at) as last_lesson_completed
FROM user_lesson_progress ulp
JOIN courses c ON c.id = ulp.course_id
GROUP BY ulp.user_id, ulp.course_id, c.title;

-- Grant access to the view
GRANT SELECT ON user_progress_summary TO authenticated;
GRANT SELECT ON user_progress_summary TO anon;

-- Create index on underlying table for better performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course 
ON user_lesson_progress(user_id, course_id, status);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed 
ON user_lesson_progress(user_id, status, completed_at DESC) 
WHERE status = 'completed';

-- =====================================================
-- MIGRATION 3: Create helper function to get user progress
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_course_progress(p_user_id UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  total_lessons INTEGER,
  completed_lessons INTEGER,
  progress_percentage INTEGER,
  last_accessed TIMESTAMPTZ,
  last_lesson_completed TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ups.course_id,
    ups.course_title,
    ups.total_lessons::INTEGER,
    ups.completed_lessons::INTEGER,
    ups.progress_percentage,
    ups.last_accessed,
    ups.last_lesson_completed
  FROM user_progress_summary ups
  WHERE ups.user_id = p_user_id
  ORDER BY ups.last_accessed DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_course_progress(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify is_active column was added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND column_name = 'is_active';

-- Verify user_progress_summary view was created
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'user_progress_summary';

-- Test the view with sample data (will return empty if no data)
SELECT * FROM user_progress_summary LIMIT 5;

-- Verify indexes were created
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('user_subscriptions', 'user_lesson_progress')
  AND indexname LIKE '%is_active%' OR indexname LIKE '%user_course%';

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================

-- To rollback these changes, run:
-- DROP VIEW IF EXISTS user_progress_summary;
-- DROP FUNCTION IF EXISTS get_user_course_progress(UUID);
-- DROP FUNCTION IF EXISTS update_subscription_is_active() CASCADE;
-- ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS is_active;
-- DROP INDEX IF EXISTS idx_user_subscriptions_is_active;
-- DROP INDEX IF EXISTS idx_user_lesson_progress_user_course;
-- DROP INDEX IF EXISTS idx_user_lesson_progress_completed;

