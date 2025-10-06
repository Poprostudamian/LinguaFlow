-- supabase/migrations/20250116000000_fix_student_meetings_access.sql
/*
  # Fix Student Access to Meetings
  
  This migration adds RLS policy to allow students to view meetings they're invited to.
  
  ## Changes
  - Add SELECT policy for students on meetings table
  - Students can only read meetings where they appear in meeting_participants
*/ 

-- Add policy allowing students to read meetings they're participating in
CREATE POLICY "Students can view meetings they're invited to"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM meeting_participants mp
      WHERE mp.meeting_id = meetings.id
        AND mp.student_id = auth.uid()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
    )
  );

-- Grant SELECT permission on meetings to authenticated users (if not already granted)
GRANT SELECT ON meetings TO authenticated;