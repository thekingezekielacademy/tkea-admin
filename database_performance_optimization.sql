-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION SCRIPT
-- The King Ezekiel Academy - Supabase Database
-- =====================================================

-- 1. ANALYZE CURRENT PERFORMANCE
-- =====================================================

-- Check table sizes and row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (if pg_stat_statements is enabled)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%user_subscriptions%' 
   OR query LIKE '%subscription_payments%'
   OR query LIKE '%user_courses%'
   OR query LIKE '%profiles%'
ORDER BY mean_time DESC
LIMIT 10;

-- =====================================================
-- 2. CREATE OPTIMIZED INDEXES
-- =====================================================

-- Drop existing inefficient indexes first
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_user_subscriptions_paystack_id;
DROP INDEX IF EXISTS idx_subscription_payments_user_id;
DROP INDEX IF EXISTS idx_subscription_payments_status;
DROP INDEX IF EXISTS idx_subscription_payments_paystack_ref;
DROP INDEX IF EXISTS idx_user_courses_user_id;
DROP INDEX IF EXISTS idx_user_courses_course_id;
DROP INDEX IF EXISTS idx_user_courses_last_accessed;

-- Create composite indexes for better query performance
-- User Subscriptions - Composite index for common query patterns
CREATE INDEX CONCURRENTLY idx_user_subscriptions_user_status_date 
ON user_subscriptions(user_id, status, created_at DESC);

-- User Subscriptions - Paystack lookup index
CREATE INDEX CONCURRENTLY idx_user_subscriptions_paystack_lookup 
ON user_subscriptions(paystack_subscription_id, paystack_customer_code);

-- User Subscriptions - Status and date range queries
CREATE INDEX CONCURRENTLY idx_user_subscriptions_status_date_range 
ON user_subscriptions(status, start_date, next_payment_date);

-- Subscription Payments - Composite index for user payment history
CREATE INDEX CONCURRENTLY idx_subscription_payments_user_date_status 
ON subscription_payments(user_id, paid_at DESC, status);

-- Subscription Payments - Paystack reference lookup
CREATE INDEX CONCURRENTLY idx_subscription_payments_paystack_ref 
ON subscription_payments(paystack_reference, paystack_transaction_id);

-- User Courses - Composite index for enrollment and progress
CREATE INDEX CONCURRENTLY idx_user_courses_user_progress 
ON user_courses(user_id, progress DESC, last_accessed DESC);

-- User Courses - Course popularity and access patterns
CREATE INDEX CONCURRENTLY idx_user_courses_course_access 
ON user_courses(course_id, last_accessed DESC, enrolled_at DESC);

-- Profiles - XP and streak optimization
CREATE INDEX CONCURRENTLY idx_profiles_xp_streak 
ON profiles(xp DESC, streak_count DESC, last_activity_date DESC);

-- Profiles - Role and activity optimization
CREATE INDEX CONCURRENTLY idx_profiles_role_active 
ON profiles(role, last_activity_date DESC);

-- User Trials - Active trial lookup
CREATE INDEX CONCURRENTLY idx_user_trials_active_user 
ON user_trials(user_id, is_active, end_date DESC);

-- =====================================================
-- 3. CREATE PARTIAL INDEXES FOR COMMON FILTERS
-- =====================================================

-- Active subscriptions only (most common query)
CREATE INDEX CONCURRENTLY idx_user_subscriptions_active_only 
ON user_subscriptions(user_id, created_at DESC) 
WHERE status = 'active';

-- Successful payments only
CREATE INDEX CONCURRENTLY idx_subscription_payments_success_only 
ON subscription_payments(user_id, paid_at DESC) 
WHERE status = 'success';

-- Active trials only
CREATE INDEX CONCURRENTLY idx_user_trials_active_only 
ON user_trials(user_id, end_date DESC) 
WHERE is_active = true;

-- High XP users (for leaderboards)
CREATE INDEX CONCURRENTLY idx_profiles_high_xp 
ON profiles(xp DESC, streak_count DESC) 
WHERE xp > 100;

-- =====================================================
-- 4. CREATE FUNCTIONAL INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Index for date range queries on subscriptions
CREATE INDEX CONCURRENTLY idx_user_subscriptions_date_range 
ON user_subscriptions(user_id, 
    EXTRACT(EPOCH FROM (next_payment_date - start_date)) DESC);

-- Index for subscription duration calculations
CREATE INDEX CONCURRENTLY idx_user_subscriptions_duration 
ON user_subscriptions(user_id, 
    CASE 
      WHEN status = 'active' THEN 
        EXTRACT(EPOCH FROM (next_payment_date - CURRENT_TIMESTAMP))
      ELSE 0 
    END DESC);

-- =====================================================
-- 5. OPTIMIZE TABLE STRUCTURE
-- =====================================================

-- Add table partitioning for large tables (if needed)
-- This is for future scaling - uncomment when tables exceed 1M rows

-- ALTER TABLE user_subscriptions PARTITION BY RANGE (created_at);
-- CREATE TABLE user_subscriptions_2024 PARTITION OF user_subscriptions
--   FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
-- CREATE TABLE user_subscriptions_2025 PARTITION OF user_subscriptions
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Optimize column types for better storage and performance
ALTER TABLE user_subscriptions 
ALTER COLUMN status TYPE VARCHAR(20), -- Limit status values
ALTER COLUMN plan_name TYPE VARCHAR(100), -- Limit plan name length
ALTER COLUMN currency TYPE CHAR(3); -- Fixed 3-char currency codes

ALTER TABLE subscription_payments 
ALTER COLUMN status TYPE VARCHAR(20), -- Limit status values
ALTER COLUMN payment_method TYPE VARCHAR(50); -- Limit payment method length

-- Add constraints for data integrity
ALTER TABLE user_subscriptions 
ADD CONSTRAINT chk_subscription_status 
CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'trialing'));

ALTER TABLE subscription_payments 
ADD CONSTRAINT chk_payment_status 
CHECK (status IN ('success', 'failed', 'pending', 'refunded'));

-- =====================================================
-- 6. CREATE MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- =====================================================

-- User subscription summary view
CREATE MATERIALIZED VIEW user_subscription_summary AS
SELECT 
  user_id,
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
  MAX(created_at) as last_subscription_date,
  SUM(amount) FILTER (WHERE status = 'active') as total_active_amount,
  AVG(amount) FILTER (WHERE status = 'active') as avg_active_amount
FROM user_subscriptions 
GROUP BY user_id;

-- Create index on materialized view
CREATE INDEX idx_user_subscription_summary_user 
ON user_subscription_summary(user_id);

-- Course enrollment summary view
CREATE MATERIALIZED VIEW course_enrollment_summary AS
SELECT 
  course_id,
  COUNT(*) as total_enrollments,
  COUNT(*) FILTER (WHERE progress = 100) as completed_enrollments,
  AVG(progress) as avg_progress,
  MAX(last_accessed) as last_activity
FROM user_courses 
GROUP BY course_id;

-- Create index on materialized view
CREATE INDEX idx_course_enrollment_summary_course 
ON course_enrollment_summary(course_id);

-- =====================================================
-- 7. CREATE PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_subscription_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY course_enrollment_summary;
  
  -- Update statistics
  ANALYZE user_subscriptions;
  ANALYZE subscription_payments;
  ANALYZE user_courses;
  ANALYZE profiles;
  ANALYZE user_trials;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table performance metrics
CREATE OR REPLACE FUNCTION get_table_performance_metrics()
RETURNS TABLE (
  table_name text,
  total_rows bigint,
  table_size text,
  index_size text,
  cache_hit_ratio numeric,
  last_vacuum timestamp,
  last_analyze timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.n_live_tup,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as table_size,
    pg_size_pretty(pg_indexes_size(t.table_name::regclass)) as index_size,
    ROUND(
      (t.heap_blks_hit::numeric / (t.heap_blks_hit + t.heap_blks_read)) * 100, 2
    ) as cache_hit_ratio,
    t.last_vacuum,
    t.last_analyze
  FROM pg_stat_user_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.n_live_tup DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow query analysis
CREATE OR REPLACE FUNCTION get_slow_queries(limit_count integer DEFAULT 10)
RETURNS TABLE (
  query text,
  calls bigint,
  total_time numeric,
  mean_time numeric,
  rows bigint,
  shared_blks_hit bigint,
  shared_blks_read bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.query,
    s.calls,
    s.total_time,
    s.mean_time,
    s.rows,
    s.shared_blks_hit,
    s.shared_blks_read
  FROM pg_stat_statements s
  WHERE s.query LIKE '%user_subscriptions%' 
     OR s.query LIKE '%subscription_payments%'
     OR s.query LIKE '%user_courses%'
     OR s.query LIKE '%profiles%'
  ORDER BY s.mean_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE AUTOMATED MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old cancelled/expired subscriptions (older than 1 year)
  DELETE FROM user_subscriptions 
  WHERE status IN ('cancelled', 'expired') 
    AND created_at < CURRENT_DATE - INTERVAL '1 year';
  
  -- Clean up old failed payments (older than 6 months)
  DELETE FROM subscription_payments 
  WHERE status = 'failed' 
    AND created_at < CURRENT_DATE - INTERVAL '6 months';
  
  -- Clean up old trial records (older than 1 year)
  DELETE FROM user_trials 
  WHERE end_date < CURRENT_DATE - INTERVAL '1 year';
  
  -- Log cleanup
  RAISE NOTICE 'Cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to optimize table storage
CREATE OR REPLACE FUNCTION optimize_table_storage()
RETURNS void AS $$
BEGIN
  -- Vacuum and analyze tables
  VACUUM ANALYZE user_subscriptions;
  VACUUM ANALYZE subscription_payments;
  VACUUM ANALYZE user_courses;
  VACUUM ANALYZE profiles;
  VACUUM ANALYZE user_trials;
  
  -- Refresh materialized views
  PERFORM refresh_performance_views();
  
  -- Log optimization
  RAISE NOTICE 'Table optimization completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE SCHEDULED MAINTENANCE (via pg_cron if available)
-- =====================================================

-- Note: These require pg_cron extension to be enabled
-- Uncomment if pg_cron is available in your Supabase instance

-- SELECT cron.schedule('refresh-performance-views', '0 2 * * *', 'SELECT refresh_performance_views();');
-- SELECT cron.schedule('cleanup-old-data', '0 3 * * 0', 'SELECT cleanup_old_data();');
-- SELECT cron.schedule('optimize-tables', '0 4 * * 0', 'SELECT optimize_table_storage();');

-- =====================================================
-- 10. CREATE QUERY OPTIMIZATION HINTS
-- =====================================================

-- Example optimized queries for common operations:

-- 1. Get user's active subscription (optimized)
-- Use: SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1;
-- Index: idx_user_subscriptions_user_status_date

-- 2. Get user's payment history (optimized)
-- Use: SELECT * FROM subscription_payments WHERE user_id = $1 ORDER BY paid_at DESC;
-- Index: idx_subscription_payments_user_date_status

-- 3. Get course enrollment with progress (optimized)
-- Use: SELECT * FROM user_courses WHERE user_id = $1 ORDER BY progress DESC, last_accessed DESC;
-- Index: idx_user_courses_user_progress

-- 4. Get subscription summary (use materialized view)
-- Use: SELECT * FROM user_subscription_summary WHERE user_id = $1;

-- 5. Get course popularity (use materialized view)
-- Use: SELECT * FROM course_enrollment_summary ORDER BY total_enrollments DESC;

-- =====================================================
-- 11. PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Check index usage after optimization
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table performance metrics
SELECT * FROM get_table_performance_metrics();

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND idx_scan = 0
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Check for table bloat
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as bloat_percentage
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
  AND n_dead_tup > 0
ORDER BY bloat_percentage DESC;

-- =====================================================
-- 12. EXECUTION INSTRUCTIONS
-- =====================================================

-- Run this script in sections:

-- 1. First, run the analysis queries (sections 1) to understand current performance
-- 2. Run the index creation (sections 2-4) during low-traffic periods
-- 3. Run the table optimization (section 5) 
-- 4. Create materialized views (section 6)
-- 5. Create monitoring functions (sections 7-8)
-- 6. Run final performance checks (sections 11)

-- Monitor the results and adjust indexes based on actual query patterns
-- Consider dropping unused indexes to improve write performance

-- =====================================================
-- END OF OPTIMIZATION SCRIPT
-- =====================================================
