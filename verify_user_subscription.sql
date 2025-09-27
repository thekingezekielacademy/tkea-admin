-- COMPREHENSIVE USER SUBSCRIPTION VERIFICATION
-- For: theisraelolayemi@gmail.com
-- This script will check all aspects of the user's subscription status

-- ===========================================
-- STEP 1: CHECK USER PROFILE
-- ===========================================
SELECT '=== USER PROFILE CHECK ===' as section;

SELECT 
    'User Profile' as check_type,
    id,
    email,
    name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'theisraelolayemi@gmail.com';

-- ===========================================
-- STEP 2: CHECK SUBSCRIPTION STATUS
-- ===========================================
SELECT '=== SUBSCRIPTION STATUS CHECK ===' as section;

SELECT 
    'Active Subscriptions' as check_type,
    us.id as subscription_id,
    us.user_id,
    us.plan_name,
    us.status,
    us.amount,
    us.currency,
    us.start_date,
    us.next_payment_date,
    us.created_at,
    p.email,
    p.name
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY us.created_at DESC;

-- ===========================================
-- STEP 3: CHECK PAYMENT HISTORY
-- ===========================================
SELECT '=== PAYMENT HISTORY CHECK ===' as section;

SELECT 
    'Payment History' as check_type,
    sp.id as payment_id,
    sp.user_id,
    sp.amount,
    sp.currency,
    sp.status as payment_status,
    sp.payment_method,
    sp.paid_at,
    sp.created_at,
    p.email,
    p.name
FROM subscription_payments sp
JOIN profiles p ON sp.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY sp.created_at DESC;

-- ===========================================
-- STEP 4: CHECK SUBSCRIPTION COUNTS
-- ===========================================
SELECT '=== SUBSCRIPTION COUNTS ===' as section;

SELECT 
    'Subscription Counts' as check_type,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_subscriptions,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com';

-- ===========================================
-- STEP 5: CHECK PAYMENT COUNTS
-- ===========================================
SELECT '=== PAYMENT COUNTS ===' as section;

SELECT 
    'Payment Counts' as check_type,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
FROM subscription_payments sp
JOIN profiles p ON sp.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com';

-- ===========================================
-- STEP 6: CHECK RECENT ACTIVITY
-- ===========================================
SELECT '=== RECENT ACTIVITY ===' as section;

-- Recent Subscriptions
SELECT 
    'Recent Subscriptions' as activity_type,
    us.id,
    us.status,
    us.plan_name,
    us.amount,
    us.created_at,
    'subscription' as record_type
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY us.created_at DESC
LIMIT 5;

-- Recent Payments
SELECT 
    'Recent Payments' as activity_type,
    sp.id,
    sp.status,
    'Payment' as plan_name,
    sp.amount,
    sp.created_at,
    'payment' as record_type
FROM subscription_payments sp
JOIN profiles p ON sp.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
ORDER BY sp.created_at DESC
LIMIT 5;

-- ===========================================
-- STEP 7: VERIFY ACTIVE SUBSCRIPTION DETAILS
-- ===========================================
SELECT '=== ACTIVE SUBSCRIPTION VERIFICATION ===' as section;

SELECT 
    'Active Subscription Details' as check_type,
    us.id as subscription_id,
    us.user_id,
    us.plan_name,
    us.status,
    us.amount,
    us.currency,
    us.start_date,
    us.next_payment_date,
    us.created_at,
    us.updated_at,
    p.email,
    p.name,
    p.role,
    -- Check if subscription is actually active based on dates
    CASE 
        WHEN us.status = 'active' AND (us.next_payment_date IS NULL OR us.next_payment_date > NOW()) 
        THEN 'ACTIVE - Valid'
        WHEN us.status = 'active' AND us.next_payment_date <= NOW()
        THEN 'ACTIVE - Expired'
        WHEN us.status = 'cancelled'
        THEN 'CANCELLED'
        WHEN us.status = 'inactive'
        THEN 'INACTIVE'
        ELSE 'UNKNOWN STATUS'
    END as subscription_validation
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
AND us.status = 'active'
ORDER BY us.created_at DESC;

-- ===========================================
-- STEP 8: CHECK FOR ANY ERRORS OR ISSUES
-- ===========================================
SELECT '=== ERROR CHECK ===' as section;

-- Check for duplicate subscriptions
SELECT 
    'Duplicate Check' as check_type,
    COUNT(*) as duplicate_count,
    'Multiple active subscriptions found' as issue
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE p.email = 'theisraelolayemi@gmail.com'
AND us.status = 'active'
HAVING COUNT(*) > 1

UNION ALL

-- Check for missing payment records
SELECT 
    'Missing Payment Check' as check_type,
    COUNT(*) as missing_payments,
    'Subscription without payment record' as issue
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
LEFT JOIN subscription_payments sp ON us.user_id = sp.user_id
WHERE p.email = 'theisraelolayemi@gmail.com'
AND us.status = 'active'
AND sp.id IS NULL;

-- ===========================================
-- STEP 9: FINAL VERIFICATION SUMMARY
-- ===========================================
SELECT '=== FINAL VERIFICATION SUMMARY ===' as section;

WITH user_summary AS (
    SELECT 
        p.id as user_id,
    p.email,
    p.name,
        COUNT(DISTINCT us.id) as subscription_count,
        COUNT(DISTINCT CASE WHEN us.status = 'active' THEN us.id END) as active_subscription_count,
        COUNT(DISTINCT sp.id) as payment_count,
        COUNT(DISTINCT CASE WHEN sp.status = 'success' THEN sp.id END) as successful_payment_count,
        MAX(us.created_at) as latest_subscription_date,
        MAX(sp.created_at) as latest_payment_date
    FROM profiles p
    LEFT JOIN user_subscriptions us ON p.id = us.user_id
    LEFT JOIN subscription_payments sp ON p.id = sp.user_id
    WHERE p.email = 'theisraelolayemi@gmail.com'
    GROUP BY p.id, p.email, p.name
)
SELECT 
    'VERIFICATION SUMMARY' as check_type,
    email,
    name,
    subscription_count,
    active_subscription_count,
    payment_count,
    successful_payment_count,
    latest_subscription_date,
    latest_payment_date,
    CASE 
        WHEN active_subscription_count > 0 AND successful_payment_count > 0 
        THEN '✅ SUBSCRIPTION ACTIVE - User has active subscription and successful payment'
        WHEN active_subscription_count > 0 AND successful_payment_count = 0
        THEN '⚠️ SUBSCRIPTION ACTIVE - But no payment record found'
        WHEN active_subscription_count = 0 AND successful_payment_count > 0
        THEN '⚠️ PAYMENT FOUND - But no active subscription'
        WHEN active_subscription_count = 0 AND successful_payment_count = 0
        THEN '❌ NO ACTIVE SUBSCRIPTION - User needs subscription activation'
        ELSE '❓ UNKNOWN STATUS - Manual verification required'
    END as final_status
FROM user_summary;
