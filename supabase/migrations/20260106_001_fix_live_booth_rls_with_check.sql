-- Fix Live Booth RLS policies to allow admin inserts/updates.
-- Problem: policies created with ONLY "USING" do not allow INSERT unless "WITH CHECK" is also present.
-- This blocks admin API calls that insert into `live_classes` / `class_sessions`.

BEGIN;

-- live_classes: allow admins to INSERT/UPDATE/DELETE when role=admin
DROP POLICY IF EXISTS "Admins can manage live classes" ON live_classes;
CREATE POLICY "Admins can manage live classes"
ON live_classes
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- class_sessions: allow admins to INSERT/UPDATE/DELETE when role=admin
DROP POLICY IF EXISTS "Admins can manage class sessions" ON class_sessions;
CREATE POLICY "Admins can manage class sessions"
ON class_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

COMMIT;


