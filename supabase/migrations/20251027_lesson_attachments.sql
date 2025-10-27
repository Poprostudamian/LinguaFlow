-- Migration: Add lesson attachments support
-- File: supabase/migrations/YYYYMMDD_lesson_attachments.sql

-- ============================================================================
-- STORAGE BUCKET FOR LESSON ATTACHMENTS
-- ============================================================================

-- Create storage bucket for lesson attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Tutors can upload files to their own lessons
CREATE POLICY "Tutors can upload lesson attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Tutors can update their own lesson attachments
CREATE POLICY "Tutors can update their lesson attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'lesson-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Tutors can delete their own lesson attachments
CREATE POLICY "Tutors can delete their lesson attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view public lesson attachments
CREATE POLICY "Anyone can view lesson attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-attachments');

-- ============================================================================
-- LESSON ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'pdf'
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL, -- e.g., 'image/jpeg', 'application/pdf'
  storage_path TEXT NOT NULL, -- Full path in storage bucket
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  description TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'pdf')),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB max
  CONSTRAINT valid_mime_type CHECK (
    mime_type IN (
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_lesson_attachments_lesson_id ON lesson_attachments(lesson_id);
CREATE INDEX idx_lesson_attachments_tutor_id ON lesson_attachments(tutor_id);
CREATE INDEX idx_lesson_attachments_file_type ON lesson_attachments(file_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Tutors can view their own lesson attachments
CREATE POLICY "Tutors can view their lesson attachments"
ON lesson_attachments
FOR SELECT
TO authenticated
USING (tutor_id = auth.uid());

-- Policy: Students can view attachments of assigned lessons
CREATE POLICY "Students can view assigned lesson attachments"
ON lesson_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM student_lessons sl
    WHERE sl.lesson_id = lesson_attachments.lesson_id
    AND sl.student_id = auth.uid()
  )
);

-- Policy: Tutors can insert attachments for their lessons
CREATE POLICY "Tutors can insert lesson attachments"
ON lesson_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  tutor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM lessons
    WHERE id = lesson_id AND tutor_id = auth.uid()
  )
);

-- Policy: Tutors can update their lesson attachments
CREATE POLICY "Tutors can update their lesson attachments"
ON lesson_attachments
FOR UPDATE
TO authenticated
USING (tutor_id = auth.uid())
WITH CHECK (tutor_id = auth.uid());

-- Policy: Tutors can delete their lesson attachments
CREATE POLICY "Tutors can delete their lesson attachments"
ON lesson_attachments
FOR DELETE
TO authenticated
USING (tutor_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get public URL for an attachment
CREATE OR REPLACE FUNCTION get_attachment_url(storage_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'https://your-project.supabase.co/storage/v1/object/public/lesson-attachments/' || storage_path;
END;
$$;

-- Function to count attachments for a lesson
CREATE OR REPLACE FUNCTION count_lesson_attachments(p_lesson_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attachment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attachment_count
  FROM lesson_attachments
  WHERE lesson_id = p_lesson_id;
  
  RETURN attachment_count;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_attachments_updated_at
BEFORE UPDATE ON lesson_attachments
FOR EACH ROW
EXECUTE FUNCTION update_lesson_attachments_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE lesson_attachments IS 'Stores metadata for lesson attachments (images and PDFs)';
COMMENT ON COLUMN lesson_attachments.file_type IS 'Type of file: image or pdf';
COMMENT ON COLUMN lesson_attachments.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN lesson_attachments.storage_path IS 'Full path to file in storage bucket';
COMMENT ON COLUMN lesson_attachments.display_order IS 'Order in which to display attachments';