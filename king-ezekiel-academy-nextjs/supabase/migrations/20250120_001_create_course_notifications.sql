-- Create course_notifications table for tracking user notifications
CREATE TABLE IF NOT EXISTS course_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_notifications_user_id ON course_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_course_notifications_course_id ON course_notifications(course_id);
CREATE INDEX IF NOT EXISTS idx_course_notifications_email_sent ON course_notifications(email_sent);

-- Enable Row Level Security
ALTER TABLE course_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
-- Note: These policies are ESSENTIAL for your PWA app to work correctly
-- They control who can view, create, update, and delete notifications

DO $$
BEGIN
  -- Users can view their own course notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_notifications' 
    AND policyname = 'Users can view their own course notifications'
  ) THEN
    CREATE POLICY "Users can view their own course notifications" ON course_notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own course notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_notifications' 
    AND policyname = 'Users can insert their own course notifications'
  ) THEN
    CREATE POLICY "Users can insert their own course notifications" ON course_notifications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can delete their own course notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_notifications' 
    AND policyname = 'Users can delete their own course notifications'
  ) THEN
    CREATE POLICY "Users can delete their own course notifications" ON course_notifications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Admin can view all notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_notifications' 
    AND policyname = 'Admins can view all course notifications'
  ) THEN
    CREATE POLICY "Admins can view all course notifications" ON course_notifications
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;

  -- Admin can update all notifications (for marking emails as sent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_notifications' 
    AND policyname = 'Admins can update all course notifications'
  ) THEN
    CREATE POLICY "Admins can update all course notifications" ON course_notifications
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_course_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency - safe to run multiple times)
DROP TRIGGER IF EXISTS update_course_notifications_timestamp ON course_notifications;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_course_notifications_timestamp
  BEFORE UPDATE ON course_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_course_notifications_updated_at();

