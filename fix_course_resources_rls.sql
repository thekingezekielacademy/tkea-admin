-- Fix RLS policies for course_resources table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow public to read course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow admins to manage course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow admins to insert course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow admins to update course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow admins to delete course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow course creators to insert their own course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow course creators to update their own course resources" ON course_resources;
DROP POLICY IF EXISTS "Allow course creators to delete their own course resources" ON course_resources;

-- Policy: Allow authenticated users to read course resources
-- Also allow public read access so students can download PDFs
CREATE POLICY "Allow authenticated users to read course resources"
  ON course_resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Allow public to read course resources (for downloading PDFs)
CREATE POLICY "Allow public to read course resources"
  ON course_resources FOR SELECT
  USING (true);

-- Policy: Allow admins to insert course resources
-- Check if user is admin via profiles table
CREATE POLICY "Allow admins to insert course resources"
  ON course_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow admins to update course resources
CREATE POLICY "Allow admins to update course resources"
  ON course_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow admins to delete course resources
CREATE POLICY "Allow admins to delete course resources"
  ON course_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Also allow course creators to manage their own course resources
-- Policy: Allow course creators to insert their own course resources
-- Note: In WITH CHECK for INSERT, reference columns directly without table prefix
CREATE POLICY "Allow course creators to insert their own course resources"
  ON course_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND created_by = auth.uid()
    )
  );

-- Policy: Allow course creators to update their own course resources
-- USING checks existing row (old course_id), WITH CHECK ensures they own the new course_id after update
CREATE POLICY "Allow course creators to update their own course resources"
  ON course_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_resources.course_id 
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND created_by = auth.uid()
    )
  );

-- Policy: Allow course creators to delete their own course resources
CREATE POLICY "Allow course creators to delete their own course resources"
  ON course_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_resources.course_id 
      AND created_by = auth.uid()
    )
  );

