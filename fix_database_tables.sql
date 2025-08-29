-- Fix database tables causing 406 (Not Acceptable) errors
-- This script addresses issues with user_subscriptions and user_trials tables

-- 1. Fix user_subscriptions table
-- Drop and recreate the table to ensure proper structure
DROP TABLE IF EXISTS user_subscriptions CASCADE;

CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Monthly Membership',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fix user_trials table
-- Drop and recreate the table to ensure proper structure
DROP TABLE IF EXISTS user_trials CASCADE;

CREATE TABLE user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paystack_id ON user_subscriptions(paystack_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_is_active ON user_trials(is_active);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create RLS policies for user_trials
DROP POLICY IF EXISTS "Users can view own trial data" ON user_trials;
CREATE POLICY "Users can view own trial data" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trial data" ON user_trials;
CREATE POLICY "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trial data" ON user_trials;
CREATE POLICY "Users can update own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Grant necessary permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON user_trials TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_trials_updated_at ON user_trials;
CREATE TRIGGER update_user_trials_updated_at 
  BEFORE UPDATE ON user_trials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify the tables are properly set up
SELECT 'user_subscriptions' as table_name, count(*) as row_count FROM user_subscriptions
UNION ALL
SELECT 'user_trials' as table_name, count(*) as row_count FROM user_trials;

-- 11. Test RLS policies
-- This should work for authenticated users
-- SELECT * FROM user_subscriptions LIMIT 1;
-- SELECT * FROM user_trials LIMIT 1;
