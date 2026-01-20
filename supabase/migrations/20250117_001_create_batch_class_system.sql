-- =====================================================
-- BATCH CLASS SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates all tables needed for the Batch Class System
-- where 5 classes run on different days of the week, with weekly batch
-- creation and day-by-day progression.
-- =====================================================

-- 1. BATCH_CLASSES TABLE
-- Configuration for the 5 classes (one-time setup)
CREATE TABLE IF NOT EXISTS batch_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  start_day_of_week INTEGER NOT NULL CHECK (start_day_of_week >= 0 AND start_day_of_week <= 6),
  -- 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
  total_sessions INTEGER NOT NULL DEFAULT 0, -- Total number of classes in curriculum
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BATCHES TABLE
-- Tracks batches for each class (new batch created weekly)
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  batch_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  start_day_of_week INTEGER NOT NULL CHECK (start_day_of_week >= 0 AND start_day_of_week <= 6),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_name, batch_number),
  FOREIGN KEY (class_name) REFERENCES batch_classes(class_name) ON DELETE CASCADE
);

-- 3. BATCH_CLASS_SESSIONS TABLE
-- Individual scheduled class sessions (modified from class_sessions)
-- Each session has: batch_id, session_number, session_type (morning/afternoon/evening)
CREATE TABLE IF NOT EXISTS batch_class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  session_number INTEGER NOT NULL, -- Class 1, Class 2, Class 3, etc.
  session_title TEXT NOT NULL, -- Video name/title
  course_video_id UUID REFERENCES course_videos(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('morning', 'afternoon', 'evening')),
  scheduled_date DATE NOT NULL, -- The actual date (Monday, Tuesday, etc.)
  scheduled_time TIME NOT NULL, -- 06:30:00, 13:00:00, 19:30:00
  scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER_BATCH_ENROLLMENTS TABLE
-- Tracks which users are enrolled in which batches
CREATE TABLE IF NOT EXISTS user_batch_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  access_level TEXT NOT NULL DEFAULT 'limited_access' CHECK (access_level IN ('full_access', 'limited_access')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, batch_id)
);

-- 5. BATCH_CLASS_NOTIFICATIONS TABLE
-- Tracks Telegram group notifications sent for batch class sessions
-- Notifications are sent to Telegram groups, not individual users
CREATE TABLE IF NOT EXISTS batch_class_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES batch_class_sessions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('5_days', '48_hours', '24_hours', '3_hours', '30_minutes')),
  scheduled_send_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  telegram_group_ids TEXT, -- Comma-separated list of group IDs that received notification
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, notification_type)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Batch Classes indexes
CREATE INDEX IF NOT EXISTS idx_batch_classes_class_name ON batch_classes(class_name);
CREATE INDEX IF NOT EXISTS idx_batch_classes_start_day ON batch_classes(start_day_of_week);
CREATE INDEX IF NOT EXISTS idx_batch_classes_is_active ON batch_classes(is_active);

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_batches_class_name ON batches(class_name);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_start_date ON batches(start_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_class_batch ON batches(class_name, batch_number);

-- Batch Class Sessions indexes
CREATE INDEX IF NOT EXISTS idx_batch_sessions_batch_id ON batch_class_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_class_name ON batch_class_sessions(class_name);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_session_number ON batch_class_sessions(session_number);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_scheduled_date ON batch_class_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_scheduled_datetime ON batch_class_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_status ON batch_class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_session_type ON batch_class_sessions(session_type);

-- User Batch Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_user_batch_enrollments_user_id ON user_batch_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_batch_enrollments_batch_id ON user_batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_user_batch_enrollments_class_name ON user_batch_enrollments(class_name);
CREATE INDEX IF NOT EXISTS idx_user_batch_enrollments_access_level ON user_batch_enrollments(access_level);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_batch_notifications_session_id ON batch_class_notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_notifications_scheduled_time ON batch_class_notifications(scheduled_send_time);
CREATE INDEX IF NOT EXISTS idx_batch_notifications_status ON batch_class_notifications(status);
CREATE INDEX IF NOT EXISTS idx_batch_notifications_type ON batch_class_notifications(notification_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE batch_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_class_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view all batch classes" ON batch_classes;
DROP POLICY IF EXISTS "Admins can manage batch classes" ON batch_classes;
DROP POLICY IF EXISTS "Users can view all batches" ON batches;
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Users can view scheduled batch sessions" ON batch_class_sessions;
DROP POLICY IF EXISTS "Admins can manage batch sessions" ON batch_class_sessions;
DROP POLICY IF EXISTS "Users can view own enrollments" ON user_batch_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON user_batch_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON user_batch_enrollments;
DROP POLICY IF EXISTS "Admins can view notifications" ON batch_class_notifications;

-- Batch Classes Policies
CREATE POLICY "Users can view all batch classes" ON batch_classes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage batch classes" ON batch_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Batches Policies
CREATE POLICY "Users can view all batches" ON batches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage batches" ON batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Batch Class Sessions Policies
CREATE POLICY "Users can view scheduled batch sessions" ON batch_class_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage batch sessions" ON batch_class_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Batch Enrollments Policies
CREATE POLICY "Users can view own enrollments" ON user_batch_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments" ON user_batch_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments" ON user_batch_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications Policies (Admin only - these are system records)
CREATE POLICY "Admins can view notifications" ON batch_class_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- INITIAL DATA: Insert the 5 classes
-- =====================================================

-- Insert the 5 batch classes configuration
INSERT INTO batch_classes (class_name, start_day_of_week, total_sessions, is_active)
VALUES
  ('FREELANCING - THE UNTAPPED MARKET', 0, 0, true), -- Monday (0)
  ('INFORMATION MARKETING: THE INFINITE CASH LOOP', 1, 0, true), -- Tuesday (1)
  ('YOUTUBE MONETIZATION: From Setup To Monetization', 2, 0, true), -- Wednesday (2)
  ('EARN 500K SIDE INCOME SELLING EBOOKS', 3, 0, true), -- Thursday (3)
  ('CPA MARKETING BLUEPRINT: TKEA RESELLERS - TOTALLY FREE', 4, 0, true) -- Friday (4)
ON CONFLICT (class_name) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE batch_classes IS 
  'Configuration for the 5 batch classes. Each class has a designated start day of the week.';

COMMENT ON TABLE batches IS 
  'Tracks batches for each class. New batches are created weekly on each class''s designated day.';

COMMENT ON TABLE batch_class_sessions IS 
  'Individual scheduled class sessions. Each session represents one time slot (morning/afternoon/evening) for a specific class number in a batch.';

COMMENT ON TABLE user_batch_enrollments IS 
  'Tracks which users are enrolled in which batches. Includes access level (full_access or limited_access) for replay restrictions.';

COMMENT ON TABLE batch_class_notifications IS 
  'Tracks Telegram group notifications sent for batch class sessions. Notifications are broadcast to Telegram groups, not individual users.';
