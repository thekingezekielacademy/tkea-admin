-- Fix Flutterwave Database Schema Issues
-- This script adds missing Flutterwave columns and fixes access control issues

-- 1. Add missing Flutterwave columns to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS flutterwave_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_customer_code TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_tx_id TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_tx_ref TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'monthly';

-- 2. Add missing Flutterwave columns to subscription_payments table
ALTER TABLE subscription_payments 
ADD COLUMN IF NOT EXISTS flutterwave_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_reference TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_tx_id TEXT,
ADD COLUMN IF NOT EXISTS flutterwave_tx_ref TEXT;

-- 3. Create indexes for Flutterwave columns
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_flutterwave_id ON user_subscriptions(flutterwave_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_flutterwave_customer ON user_subscriptions(flutterwave_customer_code);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_flutterwave_tx ON subscription_payments(flutterwave_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_flutterwave_ref ON subscription_payments(flutterwave_reference);

-- 4. Update existing records to have is_active = true where status = 'active'
UPDATE user_subscriptions 
SET is_active = TRUE 
WHERE status = 'active' AND is_active IS NULL;

-- 5. Set end_date for existing active subscriptions (30 days from start_date)
UPDATE user_subscriptions 
SET end_date = start_date + INTERVAL '30 days'
WHERE status = 'active' AND end_date IS NULL;

-- 6. Verify the schema changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscription_payments' 
ORDER BY ordinal_position;

-- 7. Test that the tables are accessible
SELECT COUNT(*) as user_subscriptions_count FROM user_subscriptions;
SELECT COUNT(*) as subscription_payments_count FROM subscription_payments;
