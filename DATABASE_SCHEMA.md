# Database Schema Documentation

## Course Resources Table

The `course_resources` table stores downloadable PDF resources associated with courses.

### Table Structure

```sql
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT DEFAULT 'application/pdf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_course_resources_course_id ON course_resources(course_id);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read course resources
CREATE POLICY "Allow authenticated users to read course resources"
  ON course_resources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow admins to manage course resources
CREATE POLICY "Allow admins to manage course resources"
  ON course_resources FOR ALL
  USING (auth.role() = 'admin');
```

### Fields Description

- **id**: Unique identifier for the resource (UUID)
- **course_id**: Foreign key reference to the courses table
- **name**: Display name for the PDF resource
- **file_url**: Public URL to access the PDF file (stored in Supabase Storage)
- **file_path**: Path to the file in Supabase Storage bucket
- **file_size**: Size of the file in bytes
- **file_type**: MIME type of the file (default: 'application/pdf')
- **created_at**: Timestamp when the resource was created
- **updated_at**: Timestamp when the resource was last updated

### Supabase Storage Bucket

The PDF files are stored in a Supabase Storage bucket named `course-resources`.

**Bucket Configuration:**
- Bucket name: `course-resources`
- Public access: Yes (for downloading)
- File path structure: `course-resources/{course_id}/{filename}.pdf`

### Storage Setup

To set up the storage bucket in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `course-resources`
3. Set the bucket to **Public** (so files can be downloaded)
4. Configure CORS if needed for cross-origin access

### Usage

- **Admin**: Can upload, view, and delete PDF resources when creating or editing courses
- **Students**: Can view and download PDF resources from the course view page
- **File Size Limit**: Maximum 50MB per PDF file
- **File Type**: Only PDF files are accepted

