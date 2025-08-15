-- Fix missing tables for King Ezekiel Academy
-- Run this in your Supabase SQL Editor

-- 1. Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    days_remaining INTEGER DEFAULT 7,
    is_expired BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id TEXT,
    status TEXT DEFAULT 'active',
    plan_type TEXT DEFAULT 'monthly',
    amount DECIMAL(10,2) DEFAULT 2500.00,
    currency TEXT DEFAULT 'NGN',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own trial data" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial data" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial data" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription data" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription data" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription data" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Insert trial data for existing user (Ezekiel)
INSERT INTO user_trials (user_id, is_active, start_date, end_date, days_remaining, is_expired)
VALUES (
    '701ccba2-6b87-4c46-9715-f9922d2e960c',
    true,
    NOW(),
    NOW() + INTERVAL '7 days',
    7,
    false
) ON CONFLICT (user_id) DO NOTHING;
