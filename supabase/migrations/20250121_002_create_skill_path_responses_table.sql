-- =====================================================
-- SKILL PATH DISCOVERY RESPONSES TABLE
-- =====================================================
-- This migration creates a table to store Skill Path Discovery
-- diagnostic responses from users. Skill Path is a diagnostic
-- decision engine that maps users to skills they are naturally
-- aligned with based on their thinking style, behavior, and
-- work preferences.
-- =====================================================

-- Create skill_path_responses table
CREATE TABLE IF NOT EXISTS skill_path_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email as primary identifier (works before full signup)
  name TEXT, -- User's name (collected during Skill Path)
  
  -- Skill Path Results
  primary_skill_path TEXT NOT NULL, -- e.g., 'CRM & Automation', 'Data Analysis', 'Advertising'
  secondary_skill_paths TEXT[], -- Array of secondary skills
  skills_to_avoid TEXT[], -- Array of skills to avoid for now
  skill_identity TEXT, -- e.g., 'Systems Optimizer', 'Creative Strategist'
  
  -- Diagnostic Scores (stored as JSONB for flexibility)
  diagnostic_scores JSONB, -- Raw scores for each diagnostic group
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Response Data
  responses JSONB NOT NULL, -- Store all 20 question responses
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Retake tracking
  is_retake BOOLEAN DEFAULT false,
  previous_response_id UUID REFERENCES skill_path_responses(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_path_responses_user_id ON skill_path_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_path_responses_email ON skill_path_responses(email);
CREATE INDEX IF NOT EXISTS idx_skill_path_responses_primary_skill ON skill_path_responses(primary_skill_path);
CREATE INDEX IF NOT EXISTS idx_skill_path_responses_completed_at ON skill_path_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_skill_path_responses_created_at ON skill_path_responses(created_at);

-- Enable Row Level Security
ALTER TABLE skill_path_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own Skill Path responses
CREATE POLICY "Users can view own skill path responses" ON skill_path_responses
  FOR SELECT USING (
    auth.uid() = user_id OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Users can insert their own Skill Path responses
CREATE POLICY "Users can insert own skill path responses" ON skill_path_responses
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own Skill Path responses
CREATE POLICY "Users can update own skill path responses" ON skill_path_responses
  FOR UPDATE USING (
    auth.uid() = user_id OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Admins can view all Skill Path responses
CREATE POLICY "Admins can view all skill path responses" ON skill_path_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all Skill Path responses
CREATE POLICY "Admins can manage all skill path responses" ON skill_path_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE skill_path_responses IS 
  'Stores Skill Path Discovery diagnostic responses. Skill Path is a diagnostic decision engine that maps users to skills they are naturally aligned with.';

-- Add comments to key columns
COMMENT ON COLUMN skill_path_responses.email IS 
  'Email as primary identifier - works before full user signup. Used to link responses to user accounts.';
COMMENT ON COLUMN skill_path_responses.primary_skill_path IS 
  'The primary skill path the user is aligned with (e.g., CRM & Automation, Data Analysis, Advertising)';
COMMENT ON COLUMN skill_path_responses.secondary_skill_paths IS 
  'Array of secondary skill paths that are adjacent/natural progressions';
COMMENT ON COLUMN skill_path_responses.skills_to_avoid IS 
  'Array of skills the user should avoid for now (distractions)';
COMMENT ON COLUMN skill_path_responses.responses IS 
  'JSONB object storing all 20 question responses from the diagnostic';
COMMENT ON COLUMN skill_path_responses.diagnostic_scores IS 
  'JSONB object storing raw diagnostic scores for each of the 13 diagnostic groups';

