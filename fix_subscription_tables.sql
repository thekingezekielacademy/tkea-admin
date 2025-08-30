-- Fix user_subscriptions and user_trials tables with proper RLS policies
-- This script will ensure unsubscribed users can't see subscription data

-- 1. Drop existing tables if they have issues
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_trials CASCADE;

-- 2. Create user_subscriptions table with proper structure
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trialing')),
    plan_name TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in kobo (250000 = ₦2,500)
    currency TEXT NOT NULL DEFAULT 'NGN',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Paystack integration fields
    paystack_subscription_id TEXT,
    paystack_customer_code TEXT
);

-- 3. Create user_trials table with proper structure
CREATE TABLE user_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_created_at ON user_subscriptions(created_at);
CREATE INDEX idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX idx_user_trials_is_active ON user_trials(is_active);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_subscriptions
-- Users can only view their own subscription data
CREATE POLICY "Users can view own subscription data" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscription data
CREATE POLICY "Users can insert own subscription data" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription data
CREATE POLICY "Users can update own subscription data" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own subscription data
CREATE POLICY "Users can delete own subscription data" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for user_trials
-- Users can only view their own trial data
CREATE POLICY "Users can view own trial data" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own trial data
CREATE POLICY "Users can insert own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trial data
CREATE POLICY "Users can update own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trial data
CREATE POLICY "Users can delete own trial data" ON user_trials
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trials_updated_at 
    BEFORE UPDATE ON user_trials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify the tables are properly set up
SELECT 
    table_name, 
    row_security 
FROM information_schema.tables 
WHERE table_name IN ('user_subscriptions', 'user_trials');

-- 11. Verify RLS policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'user_trials');

-- 12. Test RLS by checking if tables are accessible
-- This should return 0 rows for an unauthenticated user
SELECT COUNT(*) FROM user_subscriptions;
SELECT COUNT(*) FROM user_trials;
