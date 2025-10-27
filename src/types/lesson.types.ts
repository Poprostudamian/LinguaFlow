// ============================================================================
// PHASE 2: ENHANCED LESSON TYPES WITH NEW FEATURES
// ============================================================================
// This file extends the existing lesson.types.ts with:
// 1. Exercise Difficulty Levels
// 2. Estimated Duration
// 3. Tags/Categories System
// 4. Exercise Images
//
// File: src/types/lesson.types.extended.ts
// Instructions: Merge these types into your existing src/types/lesson.types.ts
// ============================================================================

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: Record<ExerciseDifficulty, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  beginner: {
    label: 'Beginner',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '🟢'
  },
  intermediate: {
    label: 'Intermediate',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: '🟡'
  },
  advanced: {
    label: 'Advanced',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🔴'
  }
};

export const MIN_DURATION = 1; // minutes
export const MAX_DURATION = 120; // minutes
export const DEFAULT_DURATION = 5; // minutes

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// ============================================================================
// LESSON TAG TYPES
// ============================================================================

export interface LessonTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string; // Hex color code
  icon?: string; // Lucide icon name
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_system_tag: boolean;
  usage_count: number;
}

export interface LessonTagRelation {
  id: string;
  lesson_id: string;
  tag_id: string;
  created_at: string;
  created_by?: string;
}

export interface CreateTagData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateTagData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ============================================================================
// EXERCISE IMAGE TYPES
// ============================================================================

export interface ExerciseImage {
  id: string;
  exercise_id: string;
  tutor_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  alt_text?: string;
  caption?: string;
  display_order: number;
  width?: number;
  height?: number;
  uploaded_at: string;
  updated_at: string;
}

export interface UploadExerciseImageData {
  exercise_id: string;
  tutor_id: string;
  file: File;
  alt_text?: string;
  caption?: string;
  display_order?: number;
}

export interface UpdateExerciseImageData {
  alt_text?: string;
  caption?: string;
  display_order?: number;
}

// For client-side preview before upload
export interface PendingExerciseImage {
  id: string; // Temporary client-side ID
  file: File;
  preview: string; // Data URL for preview
  alt_text?: string;
  caption?: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  uploadProgress?: number;
}

// ============================================================================
// ENHANCED EXERCISE TYPES
// ============================================================================

export type ExerciseType = 'multiple_choice' | 'flashcard' | 'text_answer';

// Extended ExerciseBuilder with Phase 2 features
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
  
  // ✅ NEW Phase 2 fields
  difficulty_level: ExerciseDifficulty;
  estimated_duration_minutes: number;
  images?: PendingExerciseImage[]; // Client-side pending images
  uploadedImages?: ExerciseImage[]; // Server-side confirmed images
}

// Extended LessonExercise with Phase 2 features
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
  updated_at: string;
  word_limit?: number | null;
  
  // ✅ NEW Phase 2 fields
  difficulty_level: ExerciseDifficulty;
  estimated_duration_minutes: number;
}

// Extended LessonExercise with images populated
export interface LessonExerciseWithImages extends LessonExercise {
  images: ExerciseImage[];
}

// ============================================================================
// ENHANCED LESSON TYPES
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

// Extended DatabaseLesson with tags
export interface DatabaseLessonWithTags extends DatabaseLesson {
  tags: LessonTag[];
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
  isLocked: boolean;
  lockReason?: 'all_students_completed' | 'other';
  canEdit: boolean;
  canDelete: boolean;
  
  // ✅ NEW Phase 2 fields
  tags?: LessonTag[];
  total_duration?: number; // Sum of all exercise durations
  difficulty_distribution?: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

// ============================================================================
// LESSON STATISTICS WITH PHASE 2 METRICS
// ============================================================================

export interface LessonStatistics {
  total_lessons: number;
  published_lessons: number;
  draft_lessons: number;
  total_assignments: number;
  avg_assignments_per_lesson: number;
  pending_gradings: number;
  
  // ✅ NEW Phase 2 stats
  total_exercises: number;
  avg_exercises_per_lesson: number;
  difficulty_breakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  avg_lesson_duration: number; // minutes
  most_used_tags: Array<{
    tag: LessonTag;
    count: number;
  }>;
}

// ============================================================================
// CREATE/UPDATE INTERFACES WITH PHASE 2 FIELDS
// ============================================================================

export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  status: 'draft' | 'published';
  tutor_id: string;
  
  // ✅ NEW Phase 2 fields
  tag_ids?: string[]; // IDs of tags to assign
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: 'draft' | 'published';
  
  // ✅ NEW Phase 2 fields
  tag_ids?: string[]; // Replace all tags
}

export interface CreateExerciseData {
  lesson_id: string;
  exercise_type: ExerciseType;
  title: string;
  question: string;
  correct_answer: string;
  options?: string[];
  explanation?: string;
  points: number;
  order_number: number;
  word_limit?: number;
  
  // ✅ NEW Phase 2 fields
  difficulty_level: ExerciseDifficulty;
  estimated_duration_minutes: number;
}

export interface UpdateExerciseData {
  title?: string;
  question?: string;
  correct_answer?: string;
  options?: string[];
  explanation?: string;
  points?: number;
  order_number?: number;
  word_limit?: number;
  
  // ✅ NEW Phase 2 fields
  difficulty_level?: ExerciseDifficulty;
  estimated_duration_minutes?: number;
}

// ============================================================================
// DRAG AND DROP TYPES
// ============================================================================

export interface DragEndEvent {
  active: {
    id: string;
  };
  over: {
    id: string;
  } | null;
}

export interface ReorderedExercise {
  id: string;
  order_number: number;
}

// ============================================================================
// FILTER & SEARCH TYPES WITH PHASE 2 FIELDS
// ============================================================================

export interface LessonFilters {
  status?: 'draft' | 'published';
  search?: string;
  
  // ✅ NEW Phase 2 filters
  tag_ids?: string[];
  difficulty_levels?: ExerciseDifficulty[];
  min_duration?: number;
  max_duration?: number;
}

export interface ExerciseFilters {
  exercise_type?: ExerciseType;
  
  // ✅ NEW Phase 2 filters
  difficulty_level?: ExerciseDifficulty;
  has_images?: boolean;
  min_duration?: number;
  max_duration?: number;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ExerciseValidation {
  isValid: boolean;
  errors: {
    title?: string;
    question?: string;
    correctAnswer?: string;
    options?: string;
    flashcards?: string;
    points?: string;
    // ✅ NEW Phase 2 validations
    difficulty_level?: string;
    estimated_duration_minutes?: string;
    images?: string;
  };
}

export interface LessonValidation {
  isValid: boolean;
  errors: {
    title?: string;
    description?: string;
    content?: string;
    exercises?: string;
    // ✅ NEW Phase 2 validations
    tags?: string;
    total_duration?: string;
  };
}

// ============================================================================
// UTILITY FUNCTIONS TYPE DEFINITIONS
// ============================================================================

export type GetDifficultyColor = (difficulty: ExerciseDifficulty) => {
  text: string;
  bg: string;
  icon: string;
};

export type FormatDuration = (minutes: number) => string;

export type CalculateLessonDuration = (exercises: LessonExercise[]) => number;

export type GroupExercisesByDifficulty = (exercises: LessonExercise[]) => {
  beginner: LessonExercise[];
  intermediate: LessonExercise[];
  advanced: LessonExercise[];
};

// ============================================================================
// GRADING INTERFACES (EXISTING - PRESERVED)
// ============================================================================

export interface StudentExerciseAnswer {
  id: string;
  student_id: string;
  exercise_id: string;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
  updated_at?: string;
  tutor_score?: number | null;
  tutor_feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  needs_grading: boolean;
}

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
  score: number;
  feedback?: string | null;
}

// ============================================================================
// LESSON LOCKING INTERFACES (EXISTING - PRESERVED)
// ============================================================================

export interface LessonLockStatus {
  isLocked: boolean;
  lockReason?: 'all_students_completed' | 'no_students_assigned' | 'other';
  canEdit: boolean;
  canDelete: boolean;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
}

export interface LessonEditPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAssignStudents: boolean;
  canUnassignStudents: boolean;
  reason?: string;
}

// ============================================================================
// HISTORY INTERFACES (EXISTING - PRESERVED)
// ============================================================================

export interface ExerciseWithAnswer extends LessonExercise {
  student_answer: string | null;
  is_correct: boolean;
  submitted_at: string | null;
  tutor_score?: number | null;
  tutor_feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  
  // ✅ NEW Phase 2 - include images in history
  images?: ExerciseImage[];
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
  
  // ✅ NEW Phase 2 - include tags in history
  tags?: LessonTag[];
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
// EXPORT ALL TYPES
// ============================================================================

export type {
  ExerciseType,
  ExerciseBuilder,
  LessonExercise,
  LessonExerciseWithImages,
  DatabaseLesson,
  DatabaseLessonWithTags,
  StudentLesson,
  LessonWithAssignments,
  StudentExerciseAnswer,
  ExerciseWithAnswer,
  LessonHistoryItem,
  LessonStatistics,
  StudentProgress,
  CreateLessonData,
  CreateExerciseData,
  UpdateLessonData,
  UpdateExerciseData,
  PendingGrading,
  GradingSubmission,
  LessonLockStatus,
  LessonEditPermissions,
  // Phase 2 types
  ExerciseDifficulty,
  LessonTag,
  LessonTagRelation,
  ExerciseImage,
  PendingExerciseImage,
  CreateTagData,
  UpdateTagData,
  UploadExerciseImageData,
  UpdateExerciseImageData,
  LessonFilters,
  ExerciseFilters,
  ExerciseValidation,
  LessonValidation,
  DragEndEvent,
  ReorderedExercise
};