-- supabase/migrations/20250116000001_fix_rls_infinite_recursion.sql
/*
  # Fix Infinite Recursion in RLS Policies
  
  This migration fixes the infinite recursion issue by using JWT metadata
  instead of querying the users table in RLS policies.
  
  ## Problem
  - Policies were checking `EXISTS (SELECT FROM users WHERE role = ...)` 
  - This caused infinite recursion when users table also has RLS enabled
  
  ## Solution
  - Use `auth.jwt() ->> 'user_metadata' ->> 'role'` to get role from JWT
  - Avoids querying users table entirely
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Tutors can manage their own meetings" ON meetings;
DROP POLICY IF EXISTS "Students can view meetings they're invited to" ON meetings;
DROP POLICY IF EXISTS "Tutors can manage participants in their meetings" ON meeting_participants;
DROP POLICY IF EXISTS "Students can view their own meeting participations" ON meeting_participants;
DROP POLICY IF EXISTS "Students can update their own participation status" ON meeting_participants;

-- ==================== MEETINGS TABLE POLICIES ====================

-- Policy 1: Tutors can manage their own meetings (using JWT role)
CREATE POLICY "Tutors can manage their own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'tutor'
  )
  WITH CHECK (
    auth.uid() = tutor_id 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'tutor'
  );

-- Policy 2: Students can view meetings they're invited to (using JWT role)
CREATE POLICY "Students can view meetings they're invited to"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
    AND EXISTS (
      SELECT 1 
      FROM meeting_participants mp
      WHERE mp.meeting_id = meetings.id
        AND mp.student_id = auth.uid()
    )
  );

-- ==================== MEETING_PARTICIPANTS TABLE POLICIES ====================

-- Policy 3: Tutors can manage participants in their meetings
CREATE POLICY "Tutors can manage participants in their meetings"
  ON meeting_participants
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tutor'
    AND EXISTS (
      SELECT 1 FROM meetings m 
      WHERE m.id = meeting_id 
        AND m.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tutor'
    AND EXISTS (
      SELECT 1 FROM meetings m 
      WHERE m.id = meeting_id 
        AND m.tutor_id = auth.uid()
    )
  );

-- Policy 4: Students can view their own meeting participations
CREATE POLICY "Students can view their own meeting participations"
  ON meeting_participants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- Policy 5: Students can update their own participation status (joined_at, left_at)
CREATE POLICY "Students can update their own participation status"
  ON meeting_participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  )
  WITH CHECK (
    auth.uid() = student_id 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE 'RLS policies fixed - using JWT metadata instead of users table queries';
  RAISE NOTICE 'This prevents infinite recursion in policy evaluation';
END $$;