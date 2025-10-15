// src/types/lesson.types.ts
// ✅ NOWY PLIK: Definicje typów TypeScript dla systemu lekcji

export type ExerciseType = 'multiple_choice' | 'flashcard' | 'text_answer';

export type LessonStatus = 'draft' | 'published';

export type StudentLessonStatus = 'assigned' | 'in_progress' | 'completed';

// ============================================================================
// LESSON INTERFACES
// ============================================================================

export interface Lesson {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  content?: string;
  status: LessonStatus;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export interface LessonWithTutor extends Lesson {
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// ============================================================================
// EXERCISE INTERFACES
// ============================================================================

export interface LessonExercise {
  id: string;
  lesson_id: string;
  exercise_type: ExerciseType;
  title: string;
  question: string;
  correct_answer?: string | null;
  options?: any; // JSON - może być string[] lub Array<{front: string, back: string}>
  explanation?: string | null;
  order_number: number;
  points: number;
  word_limit?: number | null; // ✅ ADDED - limit słów dla text_answer
  created_at: string;
  updated_at?: string;
}

// Builder interface for creating exercises (używany w TutorLessonManagementPage)
export interface ExerciseBuilder {
  type: ExerciseType;
  title?: string;
  question: string;
  correctAnswer?: string;
  options?: string[];
  flashcards?: Array<{ front: string; back: string }>;
  explanation?: string;
  points: number;
  wordLimit?: number; // ✅ ADDED - limit słów dla text_answer
}

// ============================================================================
// STUDENT LESSON INTERFACES
// ============================================================================

export interface StudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  status: StudentLessonStatus;
  score?: number | null; // 0-100
  time_spent: number; // w sekundach
  progress: number; // 0-100
  updated_at: string;
}

export interface StudentLessonWithDetails extends StudentLesson {
  lesson: LessonWithTutor;
  exercises: LessonExercise[];
}

// ============================================================================
// STUDENT EXERCISE ANSWER INTERFACES
// ============================================================================

export interface StudentExerciseAnswer {
  id: string;
  student_id: string;
  exercise_id: string;
  answer: string;
  is_correct?: boolean | null;
  submitted_at: string;
  updated_at?: string;
  
  // ✅ ADDED - Tutor grading fields
  tutor_score?: number | null; // 0-100
  tutor_feedback?: string | null;
  graded_by?: string | null; // UUID tutora
  graded_at?: string | null;
  needs_grading: boolean;
}

// Interface dla rezultatu ćwiczenia (używany w InteractiveExerciseViewer)
export interface ExerciseResult {
  exercise_id: string;
  answer: string;
  is_correct: boolean;
}

// ============================================================================
// GRADING INTERFACES
// ============================================================================

export interface PendingGrading {
  answer_id: string;
  student_id: string;
  exercise_id: string;
  answer: string;
  submitted_at: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  question: string;
  sample_answer: string | null;
  max_points: number;
  word_limit: number | null;
  lesson_id: string;
  lesson_title: string;
  tutor_id: string;
}

export interface GradingSubmission {
  answerId: string;
  tutorId: string;
  score: number; // 0-100
  feedback?: string | null;
}

// ============================================================================
// LESSON HISTORY INTERFACES
// ============================================================================

export interface ExerciseWithAnswer extends LessonExercise {
  student_answer: string | null;
  is_correct: boolean;
  submitted_at: string | null;
  tutor_score?: number | null;
  tutor_feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
}

export interface LessonHistoryItem {
  id: string;
  lesson_id: string;
  completed_at: string;
  score: number;
  time_spent: number;
  progress: number;
  lesson_title: string;
  lesson_description: string;
  tutor_name: string;
  exercises_count: number;
  exercises: ExerciseWithAnswer[];
}

// ============================================================================
// STATISTICS INTERFACES
// ============================================================================

export interface LessonStatistics {
  total_lessons: number;
  published_lessons: number;
  draft_lessons: number;
  total_assignments: number;
  avg_assignments_per_lesson: number;
  pending_gradings: number;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  assigned_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  average_score: number;
  total_time_spent: number;
}

// ============================================================================
// CREATE/UPDATE INTERFACES
// ============================================================================

export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  assignedStudentIds: string[];
  status?: LessonStatus;
  exercises?: ExerciseBuilder[];
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: LessonStatus;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterParams {
  status?: StudentLessonStatus | LessonStatus;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}