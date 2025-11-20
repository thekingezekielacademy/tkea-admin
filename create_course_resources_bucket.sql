-- Create storage bucket for course PDF resources
-- Run this in Supabase SQL Editor or as a migration

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-resources',
  'course-resources',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload course resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view course resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow course creators to update course resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow course creators to delete course resources" ON storage.objects;

-- Create storage policy: Allow authenticated users to upload course resources
CREATE POLICY "Allow authenticated users to upload course resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-resources' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policy: Allow public to view course resources
CREATE POLICY "Allow public to view course resources" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-resources');

-- Create storage policy: Allow course creators to update their own course resources
-- File path structure: {course_id}/{filename}.pdf
CREATE POLICY "Allow course creators to update course resources" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-resources' 
    AND auth.uid() IN (
      SELECT created_by FROM courses 
      WHERE id::text = split_part(name, '/', 1)
    )
  );

-- Create storage policy: Allow course creators and admins to delete course resources
-- File path structure: {course_id}/{filename}.pdf
CREATE POLICY "Allow course creators to delete course resources" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-resources' 
    AND (
      auth.uid() IN (
        SELECT created_by FROM courses 
        WHERE id::text = split_part(name, '/', 1)
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

