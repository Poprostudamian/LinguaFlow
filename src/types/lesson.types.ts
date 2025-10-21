// src/types/lesson.types.ts

// ============================================================================
// ENHANCED LESSON TYPES WITH LOCKING FUNCTIONALITY
// ============================================================================

export interface DatabaseLesson {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export interface StudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at?: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
  score?: number | null;
  time_spent?: number;
  updated_at: string;
}

export interface LessonWithAssignments extends DatabaseLesson {
  assignedCount: number;
  completedCount: number;
  assignedStudents: string[];
  student_lessons: StudentLesson[];
  // ✅ NEW: Lesson locking properties
  isLocked: boolean;
  lockReason?: 'all_students_completed' | 'other';
  canEdit: boolean;
  canDelete: boolean;
}

// ============================================================================
// LESSON LOCKING INTERFACES
// ============================================================================

export interface LessonLockStatus {
  isLocked: boolean;
  lockReason?: 'all_students_completed' | 'no_students_assigned' | 'other';
  canEdit: boolean;
  canDelete: boolean;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number; // 0-100 percentage
}

export interface LessonEditPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAssignStudents: boolean;
  canUnassignStudents: boolean;
  reason?: string;
}

// ============================================================================
// EXERCISE TYPES
// ============================================================================

export type ExerciseType = 'multiple_choice' | 'flashcard' | 'text_answer';

export interface ExerciseBuilder {
  id: string;
  type: ExerciseType;
  title: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  flashcards?: Array<{ front: string; back: string }>;
  maxLength?: number;
}

export interface LessonExercise {
  id: string;
  lesson_id: string;
  exercise_type: ExerciseType;
  title: string;
  question: string;
  correct_answer: string;
  options: string[] | null;
  explanation: string | null;
  points: number;
  order_number: number;
  created_at: string;
  word_limit?: number | null;
}

export interface StudentExerciseAnswer {
  id: string;
  student_id: string;
  exercise_id: string;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
  updated_at?: string;
  
  // ✅ Tutor grading fields
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
  status?: 'draft' | 'published';
  exercises?: ExerciseBuilder[];
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: 'draft' | 'published';
  exercises?: ExerciseBuilder[];
}

// ============================================================================
// LESSON STATUS ENUMS
// ============================================================================

export type LessonStatus = 'draft' | 'published';

// Legacy Lesson interface - keep for compatibility with existing components
export interface Lesson {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedStudentIds?: string[];
}