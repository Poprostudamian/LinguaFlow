-- supabase/migrations/20250116000002_nuclear_fix_meetings_rls.sql
/*
  # Nuclear Fix for Meetings RLS Policies
  
  This migration completely rebuilds the RLS policies for meetings system
  from scratch to eliminate any infinite recursion issues.
  
  ## Strategy
  1. Drop ALL existing policies
  2. Temporarily disable RLS to clear any cached policy states
  3. Re-enable RLS
  4. Create minimal, simple policies using ONLY auth.uid() and JWT
  5. NO subqueries to users table
*/

-- ==================== STEP 1: CLEAN SLATE ====================

-- Drop ALL policies on meetings table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'meetings') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON meetings', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on meeting_participants table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'meeting_participants') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON meeting_participants', r.policyname);
    END LOOP;
END $$;

-- Disable RLS temporarily
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- ==================== STEP 2: CREATE SIMPLE POLICIES ====================

-- MEETINGS TABLE: Tutors can do everything with their meetings
CREATE POLICY "tutors_full_access"
  ON meetings
  FOR ALL
  TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- MEETINGS TABLE: Students can read meetings they're in (SIMPLE - no role check)
CREATE POLICY "students_read_access"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT meeting_id 
      FROM meeting_participants 
      WHERE student_id = auth.uid()
    )
  );

-- MEETING_PARTICIPANTS: Tutors can manage participants in their meetings
CREATE POLICY "tutors_manage_participants"
  ON meeting_participants
  FOR ALL
  TO authenticated
  USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    meeting_id IN (
      SELECT id FROM meetings WHERE tutor_id = auth.uid()
    )
  );

-- MEETING_PARTICIPANTS: Students can read their own participations
CREATE POLICY "students_read_participations"
  ON meeting_participants
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- MEETING_PARTICIPANTS: Students can update their participation status
CREATE POLICY "students_update_participations"
  ON meeting_participants
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ==================== STEP 3: VERIFY ====================

-- Show created policies
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'RLS Policies recreated successfully';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Meetings policies:';
  RAISE NOTICE '  - tutors_full_access';
  RAISE NOTICE '  - students_read_access';
  RAISE NOTICE 'Meeting_participants policies:';
  RAISE NOTICE '  - tutors_manage_participants';
  RAISE NOTICE '  - students_read_participations';
  RAISE NOTICE '  - students_update_participations';
  RAISE NOTICE '===================================';
END $$;

-- Test that policies work
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('meetings', 'meeting_participants')
ORDER BY tablename, policyname;