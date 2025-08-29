-- Create subscription_payments table for tracking Paystack payments
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT, -- Reference to Paystack subscription ID
  paystack_transaction_id TEXT NOT NULL UNIQUE,
  paystack_reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'abandoned')),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_subscription_id ON subscription_payments(paystack_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_transaction_id ON subscription_payments(paystack_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_reference ON subscription_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paid_at ON subscription_payments(paid_at);

-- Enable Row Level Security (RLS)
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON subscription_payments;
CREATE POLICY "Users can view their own payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON subscription_payments;
CREATE POLICY "Users can insert their own payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON subscription_payments;
CREATE POLICY "Users can update their own payments" ON subscription_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON subscription_payments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER update_subscription_payments_updated_at 
  BEFORE UPDATE ON subscription_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table is properly set up
SELECT 'subscription_payments' as table_name, count(*) as row_count FROM subscription_payments;
