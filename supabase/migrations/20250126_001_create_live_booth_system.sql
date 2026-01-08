-- =====================================================
-- LIVE BOOTH SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates all tables needed for the Live Booth
-- scheduled live-class experience system. Live Booth delivers
-- the feel of a live class using pre-recorded videos with
-- automated scheduling, reminders, and Q&A management.
-- =====================================================

-- 1. LIVE_CLASSES TABLE
-- Maps courses to Live Booth experiences
CREATE TABLE IF NOT EXISTS live_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  cycle_day INTEGER DEFAULT 1 CHECK (cycle_day >= 1 AND cycle_day <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id)
);

-- 2. CLASS_SESSIONS TABLE
-- Individual scheduled class sessions
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  course_video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('morning', 'afternoon', 'evening')),
  scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_free BOOLEAN DEFAULT false,
  current_slots INTEGER DEFAULT 25 CHECK (current_slots >= 0),
  max_slots INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LIVE_CLASS_PAYMENTS TABLE
-- Payment records for Live Booth classes
CREATE TABLE IF NOT EXISTS live_class_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  live_class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full_course', 'single_class')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  payment_provider TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LIVE_CLASS_ACCESS TABLE
-- Access grants for users to attend classes
CREATE TABLE IF NOT EXISTS live_class_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  live_class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('full_course', 'single_class', 'free')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- 5. LIVE_CLASS_QA TABLE
-- Questions and answers during class sessions
CREATE TABLE IF NOT EXISTS live_class_qa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answered_at TIMESTAMP WITH TIME ZONE,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASS_REMINDERS TABLE
-- Tracks sent reminders to prevent duplicates
CREATE TABLE IF NOT EXISTS class_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('telegram', 'email', 'sms')),
  reminder_timing TEXT NOT NULL CHECK (reminder_timing IN ('24h_before', '2h_before', '1h_before', '30m_before', '2m_before', 'start')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, reminder_type, reminder_timing)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Live Classes indexes
CREATE INDEX IF NOT EXISTS idx_live_classes_course_id ON live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_is_active ON live_classes(is_active);

-- Class Sessions indexes
CREATE INDEX IF NOT EXISTS idx_class_sessions_live_class_id ON class_sessions(live_class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_video_id ON class_sessions(course_video_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_scheduled_datetime ON class_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_session_type ON class_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_class_sessions_is_free ON class_sessions(is_free);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_live_class_payments_user_id ON live_class_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_payments_live_class_id ON live_class_payments(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_payments_session_id ON live_class_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_live_class_payments_status ON live_class_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_live_class_payments_payment_type ON live_class_payments(payment_type);

-- Access indexes
CREATE INDEX IF NOT EXISTS idx_live_class_access_user_id ON live_class_access(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_access_live_class_id ON live_class_access(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_access_session_id ON live_class_access(session_id);
CREATE INDEX IF NOT EXISTS idx_live_class_access_access_type ON live_class_access(access_type);

-- Q&A indexes
CREATE INDEX IF NOT EXISTS idx_live_class_qa_session_id ON live_class_qa(session_id);
CREATE INDEX IF NOT EXISTS idx_live_class_qa_user_id ON live_class_qa(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_qa_is_answered ON live_class_qa(is_answered);
CREATE INDEX IF NOT EXISTS idx_live_class_qa_created_at ON live_class_qa(created_at);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_class_reminders_session_id ON class_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_class_reminders_user_id ON class_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_class_reminders_sent_at ON class_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_class_reminders_status ON class_reminders(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view all live classes" ON live_classes;
DROP POLICY IF EXISTS "Admins can manage live classes" ON live_classes;
DROP POLICY IF EXISTS "Users can view scheduled sessions" ON class_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON class_sessions;
DROP POLICY IF EXISTS "Users can view own payments" ON live_class_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON live_class_payments;
DROP POLICY IF EXISTS "Users can view own access" ON live_class_access;
DROP POLICY IF EXISTS "Users can view session Q&A" ON live_class_qa;
DROP POLICY IF EXISTS "Users can create questions" ON live_class_qa;
DROP POLICY IF EXISTS "Admins can answer questions" ON live_class_qa;
DROP POLICY IF EXISTS "Users can view own reminders" ON class_reminders;
DROP POLICY IF EXISTS "Admins can view all reminders" ON class_reminders;

-- Live Classes Policies
CREATE POLICY "Users can view all live classes" ON live_classes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage live classes" ON live_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Class Sessions Policies
CREATE POLICY "Users can view scheduled sessions" ON class_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sessions" ON class_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payments Policies
CREATE POLICY "Users can view own payments" ON live_class_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON live_class_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Access Policies
CREATE POLICY "Users can view own access" ON live_class_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage access" ON live_class_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Q&A Policies
CREATE POLICY "Users can view session Q&A" ON live_class_qa
  FOR SELECT USING (true);

CREATE POLICY "Users can create questions" ON live_class_qa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON live_class_qa
  FOR UPDATE USING (auth.uid() = user_id AND is_answered = false);

CREATE POLICY "Admins can answer questions" ON live_class_qa
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reminders Policies
CREATE POLICY "Users can view own reminders" ON class_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reminders" ON class_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE live_classes IS 
  'Maps courses to Live Booth experiences. Each course can have one Live Booth configuration.';

COMMENT ON TABLE class_sessions IS 
  'Individual scheduled class sessions. Each session represents one scheduled time slot for a lesson.';

COMMENT ON TABLE live_class_payments IS 
  'Payment records for Live Booth classes. Tracks both full course and single class purchases.';

COMMENT ON TABLE live_class_access IS 
  'Access grants for users to attend classes. Determines who can join which sessions.';

COMMENT ON TABLE live_class_qa IS 
  'Questions and answers during class sessions. Students ask questions, admins respond.';

COMMENT ON TABLE class_reminders IS 
  'Tracks sent reminders to prevent duplicate notifications. Records all reminder attempts.';

