/*
  # Restore Required Tables Migration
  
  This migration restores the tutor_students and lesson_exercises_old tables
  that were incorrectly identified as unused but are required for the application.
  
  ## Tables to restore:
  1. tutor_students - Required for tutor functionality
  2. lesson_exercises_old - Required for lesson exercises
  
  ## Security:
  - Proper RLS policies
  - Foreign key constraints
  - Performance indexes
*/

-- Restore tutor_students table
CREATE TABLE IF NOT EXISTS public.tutor_students (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL,
  student_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT tutor_students_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_students_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id),
  CONSTRAINT tutor_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id)
);

-- Restore lesson_exercises_old table
CREATE TABLE IF NOT EXISTS public.lesson_exercises_old (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  exercise_type VARCHAR NOT NULL CHECK (exercise_type::text = ANY (ARRAY['multiple_choice'::character varying, 'flashcard'::character varying, 'text_answer'::character varying]::text[])),
  title VARCHAR NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT,
  options JSONB,
  explanation TEXT,
  order_number INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT lesson_exercises_old_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_exercises_old_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_students_tutor_id ON public.tutor_students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_students_student_id ON public.tutor_students(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_students_active ON public.tutor_students(is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_students_tutor_active ON public.tutor_students(tutor_id, is_active);

CREATE INDEX IF NOT EXISTS idx_lesson_exercises_old_lesson_id ON public.lesson_exercises_old(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_old_order ON public.lesson_exercises_old(lesson_id, order_number);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_old_type ON public.lesson_exercises_old(exercise_type);

-- Enable Row Level Security
ALTER TABLE public.tutor_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exercises_old ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_students
CREATE POLICY "Tutors can manage their students"
  ON public.tutor_students
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  )
  WITH CHECK (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Students can view their tutor relationships"
  ON public.tutor_students
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

-- RLS Policies for lesson_exercises_old
CREATE POLICY "Tutors can manage exercises in their lessons"
  ON public.lesson_exercises_old
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l 
      WHERE l.id = lesson_id 
      AND l.tutor_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l 
      WHERE l.id = lesson_id 
      AND l.tutor_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
    )
  );

CREATE POLICY "Students can view exercises from assigned lessons"
  ON public.lesson_exercises_old
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_lessons sl
      JOIN lessons l ON l.id = sl.lesson_id
      WHERE l.id = lesson_id 
      AND sl.student_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
    )
  );

-- Grant permissions
GRANT ALL ON public.tutor_students TO authenticated;
GRANT ALL ON public.lesson_exercises_old TO authenticated;

-- Populate tutor_students from user_relationships if needed
-- (This will sync data between the two relationship tables)
INSERT INTO public.tutor_students (tutor_id, student_id, created_at, is_active)
SELECT 
  ur.tutor_id,
  ur.student_id,
  ur.created_at,
  ur.is_active
FROM user_relationships ur
WHERE ur.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM tutor_students ts 
    WHERE ts.tutor_id = ur.tutor_id 
    AND ts.student_id = ur.student_id
  );

-- Comments for documentation
COMMENT ON TABLE public.tutor_students IS 'Simplified tutor-student relationships for quick queries';
COMMENT ON TABLE public.lesson_exercises_old IS 'Legacy lesson exercises table - still in use by application';
COMMENT ON COLUMN public.tutor_students.is_active IS 'Whether the tutor-student relationship is currently active';
COMMENT ON COLUMN public.lesson_exercises_old.options IS 'JSON object containing exercise options (for multiple choice questions)';