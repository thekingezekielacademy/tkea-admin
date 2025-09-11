-- Add missing subscription columns to user_subscriptions table
-- Run this in your Supabase SQL Editor

-- Add the missing columns
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_start_date ON user_subscriptions(start_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_payment_date ON user_subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_cycle ON user_subscriptions(billing_cycle);

-- Update existing records with default values
UPDATE user_subscriptions 
SET 
  start_date = COALESCE(start_date, created_at),
  billing_cycle = COALESCE(billing_cycle, 'monthly'),
  next_payment_date = COALESCE(next_payment_date, created_at + INTERVAL '1 month')
WHERE start_date IS NULL OR billing_cycle IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
ORDER BY ordinal_position;
