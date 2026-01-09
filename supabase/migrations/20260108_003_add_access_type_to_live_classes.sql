-- Add access_type to live_classes table
-- FREE: All classes accessible for free, forever
-- PAID: First 2 classes free, rest require payment

-- Add the access_type column if it doesn't exist
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'paid' CHECK (access_type IN ('free', 'paid'));

-- Add comment to document the column
COMMENT ON COLUMN live_classes.access_type IS 'Access type: free (all classes free forever) or paid (first 2 classes free, rest require payment)';

-- Update existing standalone live classes to default to 'paid' (only if access_type is NULL)
DO $$ 
BEGIN
  UPDATE live_classes 
  SET access_type = 'paid' 
  WHERE course_id IS NULL AND (access_type IS NULL OR access_type = '');
  
  UPDATE live_classes 
  SET access_type = 'paid' 
  WHERE course_id IS NOT NULL AND (access_type IS NULL OR access_type = '');
  
  RAISE NOTICE 'Updated existing live classes with access_type = ''paid''';
END $$;
