// src/pages/TutorLessonManagementPage.tsx

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  PlusCircle,
  BookOpen,
  Users,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  CheckSquare,
  Square,
  FileText,
  Target,
  Layers,
  CreditCard,
  List,
  Type,
  Plus,
  Trash,
  ChevronDown,
  ChevronUp,
  Save,
  Lock,
  Copy,
  Clock,
  TrendingUp,
  Award,
  Activity,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { 
  supabase, 
  getLessonsWithLockStatus,
  getLessonEditPermissions,
  validateLessonOperation,
  assignStudentsToLesson,       
  unassignStudentsFromLesson
} from '../lib/supabase';
import { TutorLessonCard } from '../components/TutorLessonCard';
import { RichTextEditor } from '../components/RichTextEditor';
import { LessonPreviewTab } from '../components/LessonPreviewTab';
import { LessonFileUploader, AttachmentFile } from '../components/LessonFileUploader';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

// ============================================================================
// TYPES
// ============================================================================
interface LessonWithAssignments {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  assignedCount?: number;
  completedCount?: number;
  isLocked?: boolean;
  lockReason?: 'all_students_completed' | 'other';
  canEdit?: boolean;
  canDelete?: boolean;
}

type TabType = 'all' | 'published' | 'draft';
type ModalTab = 'info' | 'exercises' | 'preview';
type ModalMode = 'create' | 'view' | 'edit';
type ExerciseType = 'multiple_choice' | 'flashcard' | 'text_answer';

interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  flashcards?: Array<{ front: string; back: string }>;
  maxLength?: number;
  wordLimit?: number;
  explanation?: string;
}


// ============================================================================
// PHASE 3 ENHANCED: DATABASE AUTOSAVE (Saves to Draft tab automatically)
// ============================================================================

const AUTOSAVE_KEY = 'tutor_lesson_draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const AUTOSAVE_DEBOUNCE = 3000; // 3 seconds - wait for user to stop typing

interface LessonDraft {
  lessonForm: {
    title: string;
    description: string;
    content: string;
    assignedStudentIds: string[];
    status: 'draft' | 'published';
    attachments: AttachmentFile[];
  };
  exercises: Exercise[];
  timestamp: number;
  lessonId?: string;
}

// Keep localStorage functions as backup/fallback
const saveDraftToLocalStorage = (draft: LessonDraft) => {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
    return false;
  }
};

const loadDraftFromLocalStorage = (): LessonDraft | null => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return null;
    const draft = JSON.parse(saved) as LessonDraft;
    const age = Date.now() - draft.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return null;
    }
    return draft;
  } catch (error) {
    console.error('Failed to load draft from localStorage:', error);
    return null;
  }
};

const clearDraftFromLocalStorage = () => {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error);
  }
};

// PHASE 3 ENHANCED: Save draft to database
const saveDraftToDatabase = async () => {
  if (!session?.user?.id) return;
  if (!lessonForm.title.trim()) return; // Need at least a title
  if (modalMode === 'view') return; // Don't autosave in view mode
  
  setIsSavingDraft(true);
  
  try {
    console.log('💾 Auto-saving draft to database...');
    
    const draftData = {
      tutor_id: session.user.id,
      title: lessonForm.title.trim() || 'Untitled Draft',
      description: lessonForm.description.trim() || null,
      content: lessonForm.content.trim() || null,
      status: 'draft' as const,
      is_published: false
    };

    let draftId = autosaveDraftId || currentLesson?.id;

    if (modalMode === 'create' && !draftId) {
      // Create new draft lesson
      const { data: newDraft, error: createError } = await supabase
        .from('lessons')
        .insert(draftData)
        .select()
        .single();

      if (createError) throw createError;
      
      draftId = newDraft.id;
      setAutosaveDraftId(draftId);
      console.log('✅ Created new draft:', draftId);
      
    } else if (draftId) {
      // Update existing draft
      const { error: updateError } = await supabase
        .from('lessons')
        .update(draftData)
        .eq('id', draftId)
        .eq('tutor_id', session.user.id);

      if (updateError) throw updateError;
      console.log('✅ Updated existing draft:', draftId);
    }

    // Save exercises if draft exists
    if (draftId && exercises.length > 0) {
      // Delete old exercises
      await supabase
        .from('lesson_exercises')
        .delete()
        .eq('lesson_id', draftId);

      // Insert new exercises
      const exercisesData = exercises.map((exercise, index) => {
        const baseExercise = {
          lesson_id: draftId,
          exercise_type: exercise.type,
          title: exercise.title || exercise.question,
          question: exercise.question,
          order_number: index + 1,
          points: exercise.points || 1,
          explanation: exercise.explanation || null,
        };

        if (exercise.type === 'multiple_choice') {
          return {
            ...baseExercise,
            correct_answer: exercise.correctAnswer || 'A',
            options: JSON.stringify(exercise.options || ['', '', '', ''])
          };
        } else if (exercise.type === 'flashcard') {
          return {
            ...baseExercise,
            correct_answer: exercise.flashcards?.[0]?.back || '',
            options: JSON.stringify(exercise.flashcards || [])
          };
        } else {
          return {
            ...baseExercise,
            correct_answer: exercise.correctAnswer || '',
            word_limit: exercise.wordLimit || 2000,
            options: JSON.stringify({ maxLength: exercise.wordLimit || 2000 })
          };
        }
      });

      await supabase
        .from('lesson_exercises')
        .insert(exercisesData);
      
      console.log(`✅ Saved ${exercises.length} exercises to draft`);
    }

    setLastSaved(new Date());
    
    // Also save to localStorage as backup
    saveDraftToLocalStorage({
      lessonForm,
      exercises,
      timestamp: Date.now(),
      lessonId: draftId
    });

    // Reload lessons to show the draft in the list
    await loadLessons();
    
    setToast({ 
      type: 'success', 
      message: '💾 Draft auto-saved to Drafts tab' 
    });

  } catch (error: any) {
    console.error('❌ Error saving draft:', error);
    // Fallback to localStorage only
    saveDraftToLocalStorage({
      lessonForm,
      exercises,
      timestamp: Date.now(),
      lessonId: autosaveDraftId || currentLesson?.id
    });
  } finally {
    setIsSavingDraft(false);
  }
};

// ============================================================================
// LESSON STATISTICS COMPONENT
// ============================================================================

interface LessonStatistics {
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  averageScore: number;
  averageTimeSpent: number;
  lastActivity: string | null;
}

interface LessonStatisticsPanelProps {
  lessonId: string;
  t: any;
}

function LessonStatisticsPanel({ lessonId, t }: LessonStatisticsPanelProps) {
  const [stats, setStats] = useState<LessonStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [lessonId]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_lessons')
        .select('status, score, time_spent, updated_at')
        .eq('lesson_id', lessonId);

      if (error) throw error;

      const assignedCount = data?.length || 0;
      const completedCount = data?.filter(sl => sl.status === 'completed').length || 0;
      const inProgressCount = data?.filter(sl => sl.status === 'in_progress').length || 0;

      const scoresWithValues = data?.filter(sl => sl.score !== null && sl.score !== undefined) || [];
      const averageScore = scoresWithValues.length > 0
        ? Math.round(scoresWithValues.reduce((sum, sl) => sum + (sl.score || 0), 0) / scoresWithValues.length)
        : 0;

      const timesWithValues = data?.filter(sl => sl.time_spent !== null && sl.time_spent !== undefined) || [];
      const averageTimeSpent = timesWithValues.length > 0
        ? Math.round(timesWithValues.reduce((sum, sl) => sum + (sl.time_spent || 0), 0) / timesWithValues.length)
        : 0;

      const lastActivity = data && data.length > 0
        ? data.reduce((latest, sl) => {
            const slDate = new Date(sl.updated_at);
            return slDate > new Date(latest) ? sl.updated_at : latest;
          }, data[0].updated_at)
        : null;

      setStats({
        assignedCount,
        completedCount,
        inProgressCount,
        averageScore,
        averageTimeSpent,
        lastActivity
      });
    } catch (error) {
      console.error('Error loading lesson statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Activity className="h-5 w-5 text-purple-600" />
          <span>Lesson Statistics</span>
        </h3>
        <button
          onClick={loadStatistics}
          className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center space-x-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assignedCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgressCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.averageTimeSpent > 0 ? `${Math.round(stats.averageTimeSpent / 60)}m` : 'N/A'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Activity</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {stats.lastActivity 
              ? new Date(stats.lastActivity).toLocaleDateString()
              : 'No activity'}
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateABCDOptions = (options: string[]): { isValid: boolean; message?: string } => {
  if (!options || options.length !== 4) {
    return { isValid: false, message: 'Must have exactly 4 options (A, B, C, D)' };
  }

  const emptyOptions = options.filter(opt => !opt || opt.trim() === '');
  if (emptyOptions.length > 0) {
    const emptyIndices = options
      .map((opt, idx) => (!opt || opt.trim() === '') ? String.fromCharCode(65 + idx) : null)
      .filter(Boolean);
    return { 
      isValid: false, 
      message: `Options ${emptyIndices.join(', ')} cannot be empty` 
    };
  }

  return { isValid: true };
};

const validateExercises = (exercises: Exercise[]): { isValid: boolean; message?: string } => {
  if (exercises.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const exerciseNum = i + 1;

    if (!exercise.title?.trim()) {
      return { isValid: false, message: `Exercise #${exerciseNum}: Title is required` };
    }
    if (!exercise.question?.trim()) {
      return { isValid: false, message: `Exercise #${exerciseNum}: Question is required` };
    }

    if (exercise.type === 'multiple_choice') {
      const validation = validateABCDOptions(exercise.options || []);
      if (!validation.isValid) {
        return { isValid: false, message: `Exercise #${exerciseNum}: ${validation.message}` };
      }
      if (!exercise.correctAnswer) {
        return { isValid: false, message: `Exercise #${exerciseNum}: Correct answer must be selected` };
      }
    } else if (exercise.type === 'flashcard') {
      if (!exercise.flashcards || exercise.flashcards.length === 0) {
        return { isValid: false, message: `Exercise #${exerciseNum}: At least one flashcard is required` };
      }
      const emptyCards = exercise.flashcards.filter(card => !card.front?.trim() || !card.back?.trim());
      if (emptyCards.length > 0) {
        return { isValid: false, message: `Exercise #${exerciseNum}: All flashcards must have both front and back` };
      }
    } else if (exercise.type === 'text_answer') {
      const maxLength = exercise.maxLength || exercise.wordLimit || 2000;
      if (maxLength < 50 || maxLength > 5000) {
        return { isValid: false, message: `Exercise #${exerciseNum}: Character limit must be between 50 and 5000` };
      }
    }
  }

  return { isValid: true };
};

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// ============================================================================
// EXERCISE TYPE SELECTOR
// ============================================================================
interface ExerciseTypeSelectorProps {
  onSelect: (type: ExerciseType) => void;
  t: any;
}

function ExerciseTypeSelector({ onSelect, t }: ExerciseTypeSelectorProps) {
  const types: Array<{ type: ExerciseType; label: string; icon: React.ElementType; color: string }> = [
    { type: 'multiple_choice', label: t.abcdQuestion, icon: List, color: 'blue' },
    { type: 'flashcard', label: t.flashcards, icon: CreditCard, color: 'purple' },
    { type: 'text_answer', label: t.textAnswer, icon: Type, color: 'green' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {types.map(({ type, label, icon: Icon, color }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          type="button"
          className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 rounded-lg transition-all duration-200 hover:shadow-md group"
        >
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// EXERCISE EDITOR COMPONENT
// ============================================================================
interface ExerciseEditorProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  t: any;
}

function ExerciseEditor({ exercise, onChange, onSave, onCancel, readOnly = false, t }: ExerciseEditorProps) {
  const [validationError, setValidationError] = useState<string>('');

  const handleSave = () => {
    if (exercise.type === 'multiple_choice') {
      const validation = validateABCDOptions(exercise.options || []);
      if (!validation.isValid) {
        setValidationError(validation.message || 'Invalid options');
        return;
      }
    }

    setValidationError('');
    onSave();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.titleRequired}
          </label>
          <input
            type="text"
            value={exercise.title}
            onChange={(e) => onChange({ ...exercise, title: e.target.value })}
            disabled={readOnly}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
            placeholder={t.titlePlaceholder}
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.questionRequired}
          </label>
          <textarea
            value={exercise.question}
            onChange={(e) => onChange({ ...exercise, question: e.target.value })}
            disabled={readOnly}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 resize-none"
            placeholder={t.questionPlaceholder}
          />
        </div>

        {/* Multiple Choice Options */}
        {exercise.type === 'multiple_choice' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.options}
              </label>
              <div className="space-y-2">
                {(exercise.options || ['', '', '', '']).map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(exercise.options || ['', '', '', ''])];
                        newOptions[idx] = e.target.value;
                        onChange({ ...exercise, options: newOptions });
                        setValidationError('');
                      }}
                      disabled={readOnly}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                      placeholder={`${t.option} ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.correctAnswerRequired}
              </label>
              <div className="flex space-x-2">
                {['A', 'B', 'C', 'D'].map(letter => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onChange({ ...exercise, correctAnswer: letter })}
                    disabled={readOnly}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                      exercise.correctAnswer === letter
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-300'
                    } disabled:opacity-50`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Flashcards */}
        {exercise.type === 'flashcard' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.flashcards}
            </label>
            <div className="space-y-3">
              {(exercise.flashcards || []).map((card, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.card} #{idx + 1}
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCards = exercise.flashcards?.filter((_, i) => i !== idx) || [];
                          onChange({ ...exercise, flashcards: newCards });
                        }}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={card.front}
                    onChange={(e) => {
                      const newCards = [...(exercise.flashcards || [])];
                      newCards[idx] = { ...card, front: e.target.value };
                      onChange({ ...exercise, flashcards: newCards });
                    }}
                    disabled={readOnly}
                    placeholder={t.frontPlaceholder}
                    className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={card.back}
                    onChange={(e) => {
                      const newCards = [...(exercise.flashcards || [])];
                      newCards[idx] = { ...card, back: e.target.value };
                      onChange({ ...exercise, flashcards: newCards });
                    }}
                    disabled={readOnly}
                    placeholder={t.backPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                  />
                </div>
              ))}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const newCards = [...(exercise.flashcards || []), { front: '', back: '' }];
                    onChange({ ...exercise, flashcards: newCards });
                  }}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addCard}</span>
                </button>
              )}

              {(!exercise.flashcards || exercise.flashcards.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t.noFlashcardsYet}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Text Answer */}
        {exercise.type === 'text_answer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.maxLength}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={exercise.maxLength || exercise.wordLimit || 2000}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 2000;
                  onChange({ ...exercise, maxLength: value, wordLimit: value });
                }}
                disabled={readOnly}
                min={50}
                max={5000}
                step={50}
                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                characters (50-5000)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ✅ Default increased from 500 to 2000 characters
            </p>
          </div>
        )}

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.points}
          </label>
          <input
            type="number"
            value={exercise.points}
            onChange={(e) => onChange({ ...exercise, points: parseInt(e.target.value) || 1 })}
            disabled={readOnly}
            min={1}
            max={100}
            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          />
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.explanation}
          </label>
          <textarea
            value={exercise.explanation || ''}
            onChange={(e) => onChange({ ...exercise, explanation: e.target.value })}
            disabled={readOnly}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 resize-none"
            placeholder={t.explanationPlaceholder}
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
          </div>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="flex space-x-3 pt-4 border-t border-gray-300 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{t.saveExercise || 'Save Exercise'}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t.cancel || 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXERCISE PREVIEW CARD
// ============================================================================
interface ExercisePreviewCardProps {
  exercise: Exercise;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly: boolean;
  t: any;
}

function ExercisePreviewCard({ exercise, index, onEdit, onDelete, readOnly, t }: ExercisePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case 'multiple_choice': return t.abcdQuestion;
      case 'flashcard': return t.flashcards;
      case 'text_answer': return t.textAnswer;
      default: return type;
    }
  };

  const getTypeColor = (type: ExerciseType) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'flashcard': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'text_answer': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exercise.type)}`}>
              {getTypeLabel(exercise.type)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {exercise.points} pts
            </span>
          </div>
          
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {exercise.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {exercise.question}
          </p>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {exercise.type === 'multiple_choice' && exercise.options && (
                <div className="space-y-1">
                  {exercise.options.map((opt, idx) => (
                    <p key={idx} className={`text-sm ${idx === 'ABCD'.indexOf(exercise.correctAnswer || 'A') ? 'text-green-600 font-medium' : ''}`}>
                      {String.fromCharCode(65 + idx)}. {opt} {idx === 'ABCD'.indexOf(exercise.correctAnswer || 'A') && '✓'}
                    </p>
                  ))}
                </div>
              )}
              {exercise.type === 'flashcard' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {exercise.flashcards?.length || 0} {t.flashcards.toLowerCase()}
                </p>
              )}
              {exercise.type === 'text_answer' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.maxLength}: {exercise.maxLength || exercise.wordLimit || 2000}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start space-x-2 ml-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {!readOnly && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {!readOnly && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TutorLessonManagementPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

const [autosaveDraftId, setAutosaveDraftId] = useState<string | null>(null);
const [isSavingDraft, setIsSavingDraft] = useState(false);
const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = exercises.findIndex((ex) => ex.id === active.id);
    const newIndex = exercises.findIndex((ex) => ex.id === over.id);

    const reordered = arrayMove(exercises, oldIndex, newIndex);
    setExercises(reordered);
  }
};
  
  // Load students function
 const loadStudents = async () => {
    if (!session?.user?.id) return;
    
    setLoadingStudents(true);
    try {
      console.log('📚 Loading students for tutor:', session.user.id);
      
      // Pobierz studentów z user_relationships
      const { data, error } = await supabase
        .from('user_relationships')
        .select(`
          id,
          student_id,
          is_active,
          created_at,
          students:users!student_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('tutor_id', session.user.id)
        .eq('is_active', true);

      if (error) throw error;

      console.log('✅ Loaded students:', data);

      // Transform data
      const transformedStudents = (data || []).map(rel => ({
        id: rel.students.id,
        first_name: rel.students.first_name,
        last_name: rel.students.last_name,
        email: rel.students.email,
        avatar_url: rel.students.avatar_url
      }));

      setStudents(transformedStudents);
      console.log('✅ Transformed students:', transformedStudents);
    } catch (err) {
      console.error('❌ Error loading students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // State
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [modalTab, setModalTab] = useState<ModalTab>('info');
  const [currentLesson, setCurrentLesson] = useState<LessonWithAssignments | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Form state
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: [] as string[],
    status: 'published' as 'draft' | 'published',
    attachments: [] as AttachmentFile[]
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PHASE 3: Autosave state
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load lessons on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadStudents();
      loadLessons();
    }
  }, [session?.user?.id]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    } 
  }, [toast]);

  // PHASE 3: Autosave effect
  useEffect(() => {
  if (!showModal || modalMode === 'view') return;
  if (!lessonForm.title.trim()) return; // Need at least a title

  // Clear existing timeout
  if (autosaveTimeoutRef.current) {
    clearTimeout(autosaveTimeoutRef.current);
  }

  // Set new timeout (debounce)
  autosaveTimeoutRef.current = setTimeout(() => {
    saveDraftToDatabase();
  }, AUTOSAVE_DEBOUNCE);

  // Cleanup
  return () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
  };
}, [showModal, modalMode, lessonForm.title, lessonForm.description, lessonForm.content, exercises]);

// Additional interval-based autosave (every 30 seconds)
useEffect(() => {
  if (!showModal || modalMode === 'view') return;
  
  const interval = setInterval(() => {
    if (lessonForm.title.trim()) {
      saveDraftToDatabase();
    }
  }, AUTOSAVE_INTERVAL);

  return () => clearInterval(interval);
}, [showModal, modalMode, lessonForm, exercises]);

  // PHASE 3: Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraftFromLocalStorage();
    if (draft) {
      setHasDraft(true);
    }
  }, []);


  // Load lessons with lock status
  const loadLessons = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📚 Loading lessons with lock status...');
      const data = await getLessonsWithLockStatus(session.user.id);
      
      const lockedCount = data.filter(l => l.isLocked).length;
      if (lockedCount > 0) {
        console.log(`🔒 Found ${lockedCount} locked lessons`);
      }
      
      setLessons(data);
    } catch (err: any) {
      console.error('❌ Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Load exercises for a lesson
  const loadExercises = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number', { ascending: true });

      if (error && error.code !== '42P01') throw error;

      const loadedExercises: Exercise[] = (data || []).map(ex => {
        const baseExercise = {
          id: ex.id,
          type: ex.exercise_type as ExerciseType,
          title: ex.title,
          question: ex.question,
          points: ex.points || 1,
          explanation: ex.explanation || undefined
        };

        if (ex.exercise_type === 'multiple_choice') {
          return {
            ...baseExercise,
            options: typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options,
            correctAnswer: ex.correct_answer || 'A'
          };
        } else if (ex.exercise_type === 'flashcard') {
          return {
            ...baseExercise,
            flashcards: typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options
          };
        } else {
          const optionsData = typeof ex.options === 'string' ? JSON.parse(ex.options || '{}') : ex.options || {};
          return {
            ...baseExercise,
            maxLength: ex.word_limit || optionsData.maxLength || 2000,
            wordLimit: ex.word_limit || optionsData.maxLength || 2000,
            correctAnswer: ex.correct_answer || ''
          };
        }
      });

      setExercises(loadedExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setLessonForm({
      title: '',
      description: '',
      content: '',
      assignedStudentIds: [],
      status: 'published',
      attachments: []
    });
    setExercises([]);
    setAttachments([]);
    setEditingExercise(null);
    setModalTab('info');
    setShowModal(true);
  };

  const openViewModal = async (lesson: LessonWithAssignments) => {
    setModalMode('view');
    setCurrentLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      assignedStudentIds: [],
      status: lesson.status
    });
    await loadExercises(lesson.id);
    setEditingExercise(null);
    setModalTab('info');
    setShowModal(true);
  };

  const openEditModal = async (lesson: LessonWithAssignments) => {
    setModalMode('edit');
    setCurrentLesson(lesson);
    
    const { data: assignedData } = await supabase
      .from('student_lessons')
      .select('student_id')
      .eq('lesson_id', lesson.id);
    
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      assignedStudentIds: assignedData?.map(a => a.student_id) || [],
      status: lesson.status
    });
    
    await loadExercises(lesson.id);
    setEditingExercise(null);
    setModalTab('info');
    setShowModal(true);
  };

  const closeModal = () => {
    setAutosaveDraftId(null);
    setShowModal(false);
    setCurrentLesson(null);
    setEditingExercise(null);
    setModalTab('info');
    clearDraftFromLocalStorage();
  };

  // Exercise handlers
  const handleAddExercise = (type: ExerciseType) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      type,
      title: '',
      question: '',
      points: 1,
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'multiple_choice' ? 'A' : '',
      flashcards: type === 'flashcard' ? [] : undefined,
      maxLength: type === 'text_answer' ? 2000 : undefined,
      wordLimit: type === 'text_answer' ? 2000 : undefined
    };
    setEditingExercise(newExercise);
  };

  const handleSaveExercise = () => {
    if (!editingExercise) return;

    const existingIndex = exercises.findIndex(ex => ex.id === editingExercise.id);
    if (existingIndex >= 0) {
      const updated = [...exercises];
      updated[existingIndex] = editingExercise;
      setExercises(updated);
    } else {
      setExercises([...exercises, editingExercise]);
    }
    setEditingExercise(null);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

// Create/Update lesson - FIXED VERSION
const handleSubmitLesson = async () => {
  console.log('🚀 [CREATE LESSON] Starting handleSubmitLesson...');
  console.log('📝 [CREATE LESSON] Modal mode:', modalMode);
  console.log('👤 [CREATE LESSON] User ID:', session?.user?.id);
  console.log('📋 [CREATE LESSON] Form data:', {
    title: lessonForm.title,
    description: lessonForm.description,
    status: lessonForm.status,
    assignedStudents: lessonForm.assignedStudentIds.length,
    exercises: exercises.length
  });

  // Validation: Check user session
  if (!session?.user?.id) {
    console.error('❌ [CREATE LESSON] No user session found');
    setToast({ type: 'error', message: 'You must be logged in to create lessons' });
    return;
  }

  // Validation: Check title
  if (!lessonForm.title.trim()) {
    console.error('❌ [CREATE LESSON] Title is empty');
    setToast({ type: 'error', message: t.tutorLessonManagementPage.enterTitle });
    return;
  }

  // Validation: Check exercises
  const validation = validateExercises(exercises);
  if (!validation.isValid) {
    console.error('❌ [CREATE LESSON] Exercise validation failed:', validation.message);
    setToast({ type: 'error', message: validation.message || 'Invalid exercises' });
    setModalTab('exercises');
    return;
  }

  console.log('✅ [CREATE LESSON] All validations passed');

  // Edit mode - check permissions
  if (modalMode === 'edit' && currentLesson?.id) {
    console.log('🔍 [EDIT MODE] Checking edit permissions...');
    
    const permissions = await getLessonEditPermissions(currentLesson.id, session.user.id);
    if (!permissions.canEdit) {
      console.error('❌ [EDIT MODE] No edit permissions:', permissions.reason);
      setToast({ 
        type: 'error', 
        message: permissions.reason || 'Cannot edit locked lesson'
      });
      return;
    }
    
    const validationCheck = await validateLessonOperation(currentLesson.id, session.user.id, 'edit');
    if (!validationCheck.allowed) {
      console.error('❌ [EDIT MODE] Validation check failed:', validationCheck.reason);
      setToast({ 
        type: 'error', 
        message: validationCheck.reason || 'Cannot save changes'
      });
      return;
    }

    console.log('✅ [EDIT MODE] Permissions validated');
  }
    
  setIsSubmitting(true);
  console.log('⏳ [CREATE LESSON] Setting isSubmitting = true');

  try {
    if (modalMode === 'create') {
      // Use the autosaved draft if it exists
      let lessonId = autosaveDraftId;
      
      if (lessonId) {
        // Update the existing draft to published
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || null,
            content: lessonForm.content.trim() || `<h2>${lessonForm.title}</h2>`,
            status: lessonForm.status,
            is_published: lessonForm.status === 'published'
          })
          .eq('id', lessonId)
          .eq('tutor_id', session.user.id);

        if (updateError) throw updateError;
        
        console.log('✅ Converted draft to lesson:', lessonId);
      } else {
        // Create new lesson (old flow)
        const lessonPayload = {
          tutor_id: session.user.id,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || null,
          content: lessonForm.content.trim() || `<h2>${lessonForm.title}</h2>`,
          status: lessonForm.status,
          is_published: lessonForm.status === 'published'
        };

        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonPayload)
          .select()
          .single();

        if (lessonError) throw lessonError;
        lessonId = lesson.id;
      }

      if (!lesson || !lesson.id) {
        console.error('❌ [CREATE MODE] No lesson returned from database');
        throw new Error('Failed to create lesson - no data returned');
      }

      console.log('✅ [CREATE MODE] Lesson created successfully! ID:', lesson.id);

      // Step 2: Upload attachments if any
      if (attachments.length > 0) {
        console.log(`📎 [CREATE MODE] Uploading ${attachments.length} attachments...`);
        try {
          const fileUploader = new LessonFileUploader({
            lessonId: lesson.id,
            tutorId: session.user.id,
            existingAttachments: attachments,
            onFilesChange: setAttachments
          });
          await fileUploader.uploadAllFiles();
          console.log('✅ [CREATE MODE] Attachments uploaded successfully');
        } catch (attachmentError) {
          console.error('⚠️ [CREATE MODE] Attachment upload failed:', attachmentError);
          // Continue anyway - lesson is created
        }
      }

      // Step 3: Assign students if any selected
      if (lessonForm.assignedStudentIds.length > 0) {
        console.log(`👥 [CREATE MODE] Assigning ${lessonForm.assignedStudentIds.length} students...`);
        
        const assignments = lessonForm.assignedStudentIds.map(studentId => ({
          lesson_id: lesson.id,
          student_id: studentId,
          status: 'assigned' as const,
          progress: 0,
          score: null,
          time_spent: 0,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: assignError } = await supabase
          .from('student_lessons')
          .insert(assignments);

        if (assignError) {
          console.error('⚠️ [CREATE MODE] Student assignment failed:', assignError);
          // Continue anyway - lesson is created
          setToast({ 
            type: 'warning', 
            message: `Lesson created, but failed to assign students: ${assignError.message}` 
          });
        } else {
          console.log('✅ [CREATE MODE] Students assigned successfully');
        }
      }

      // Step 4: Create exercises
      if (exercises.length > 0) {
        console.log(`🎯 [CREATE MODE] Creating ${exercises.length} exercises...`);
        
        const exercisesData = exercises.map((exercise, index) => {
          const baseExercise = {
            lesson_id: lesson.id,
            exercise_type: exercise.type,
            title: exercise.title || exercise.question,
            question: exercise.question,
            order_number: index + 1,
            points: exercise.points || 1,
            explanation: exercise.explanation || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (exercise.type === 'multiple_choice') {
            return {
              ...baseExercise,
              correct_answer: exercise.correctAnswer || 'A',
              options: JSON.stringify(exercise.options || ['', '', '', ''])
            };
          } else if (exercise.type === 'flashcard') {
            return {
              ...baseExercise,
              correct_answer: exercise.flashcards?.[0]?.back || '',
              options: JSON.stringify(exercise.flashcards || [])
            };
          } else if (exercise.type === 'text_answer') {
            return {
              ...baseExercise,
              correct_answer: exercise.correctAnswer || '',
              word_limit: exercise.wordLimit || exercise.maxLength || 2000,
              options: JSON.stringify({ 
                maxLength: exercise.wordLimit || exercise.maxLength || 2000 
              })
            };
          }

          return baseExercise;
        });

        const { error: exercisesError } = await supabase
          .from('lesson_exercises')
          .insert(exercisesData);

        if (exercisesError && exercisesError.code !== '42P01') {
          console.error('⚠️ [CREATE MODE] Exercises creation failed:', exercisesError);
          // Continue anyway - lesson is created
        } else {
          console.log('✅ [CREATE MODE] Exercises created successfully');
        }
      }

      console.log('🎉 [CREATE MODE] Lesson creation complete!');
      setToast({ 
        type: 'success', 
        message: `✅ Lesson "${lessonForm.title}" created with ${exercises.length} exercises!`
      });

    } else if (modalMode === 'edit' && currentLesson) {
      console.log('✏️ [EDIT MODE] Updating existing lesson...');
      
      // Step 1: Update lesson
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || null,
          content: lessonForm.content.trim() || null,
          status: lessonForm.status,
          is_published: lessonForm.status === 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentLesson.id)
        .eq('tutor_id', session.user.id);

      if (updateError) {
        console.error('❌ [EDIT MODE] Lesson update failed:', updateError);
        throw updateError;
      }

      console.log('✅ [EDIT MODE] Lesson updated successfully');

      // Step 2: Update student assignments
      await supabase
        .from('student_lessons')
        .delete()
        .eq('lesson_id', currentLesson.id);

      if (lessonForm.assignedStudentIds.length > 0) {
        const assignments = lessonForm.assignedStudentIds.map(studentId => ({
          lesson_id: currentLesson.id,
          student_id: studentId,
          status: 'assigned' as const,
          progress: 0,
          score: null,
          time_spent: 0
        }));

        await supabase
          .from('student_lessons')
          .insert(assignments);
      }

      // Step 3: Update exercises
      await supabase
        .from('lesson_exercises')
        .delete()
        .eq('lesson_id', currentLesson.id);

      const exercisesData = exercises.map((exercise, index) => {
        const baseExercise = {
          lesson_id: currentLesson.id,
          exercise_type: exercise.type,
          title: exercise.title || exercise.question,
          question: exercise.question,
          order_number: index + 1,
          points: exercise.points || 1,
          explanation: exercise.explanation || null
        };

        if (exercise.type === 'multiple_choice') {
          return {
            ...baseExercise,
            correct_answer: exercise.correctAnswer || 'A',
            options: JSON.stringify(exercise.options || [])
          };
        } else if (exercise.type === 'flashcard') {
          return {
            ...baseExercise,
            correct_answer: exercise.flashcards?.[0]?.back || '',
            options: JSON.stringify(exercise.flashcards || [])
          };
        } else if (exercise.type === 'text_answer') {
          return {
            ...baseExercise,
            correct_answer: exercise.correctAnswer || '',
            word_limit: exercise.wordLimit || exercise.maxLength || 2000,
            options: JSON.stringify({ maxLength: exercise.wordLimit || exercise.maxLength || 2000 })
          };
        }

        return baseExercise;
      });

      await supabase
        .from('lesson_exercises')
        .insert(exercisesData);

      console.log('✅ [EDIT MODE] Lesson update complete!');
      setToast({ 
        type: 'success', 
        message: `✅ Lesson "${lessonForm.title}" updated successfully!`
      });

      setAutosaveDraftId(null);
      clearDraftFromLocalStorage();
    }

    console.log('✅ [SUCCESS] Closing modal and reloading lessons...');
    closeModal();
    await loadLessons();

  } catch (err: any) {
    console.error('❌ [ERROR] handleSubmitLesson failed:', err);
    console.error('❌ [ERROR] Error details:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint
    });
    
    setToast({ 
      type: 'error', 
      message: err.message || 'Failed to save lesson. Check console for details.' 
    });
  } finally {
    console.log('🏁 [FINALLY] Setting isSubmitting = false');
    setIsSubmitting(false);
  }
};

  // Delete lesson handler
  const handleDeleteLesson = async (lessonId: string) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('tutor_id', session.user.id);

      if (error) throw error;

      setToast({ type: 'success', message: 'Lesson deleted successfully' });
      loadLessons();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      setToast({ type: 'error', message: error.message || 'Failed to delete lesson' });
    }
  };

  // View lesson handler
  const handleViewLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      openViewModal(lesson);
    }
  };

  // Edit lesson handler
  const handleEditLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      openEditModal(lesson);
    }
  };

  // Assign students handler
  const handleAssignStudents = async (lessonId: string, studentIds: string[]) => {
    if (!session?.user?.id || studentIds.length === 0) return;

    setIsLoading(true);
    try {
      await assignStudentsToLesson(lessonId, session.user.id, studentIds);
      setToast({ 
        type: 'success', 
        message: `Successfully assigned ${studentIds.length} student(s)` 
      });
      await loadLessons();
    } catch (error: any) {
      console.error('Error assigning students:', error);
      setToast({ 
        type: 'error', 
        message: error.message || 'Failed to assign students' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unassign students handler
  const handleUnassignStudents = async (lessonId: string, studentIds: string[]) => {
    if (!session?.user?.id || studentIds.length === 0) return;

    setIsLoading(true);
    try {
      await unassignStudentsFromLesson(lessonId, session.user.id, studentIds);
      setToast({ 
        type: 'success', 
        message: `Successfully unassigned ${studentIds.length} student(s)` 
      });
      await loadLessons();
    } catch (error: any) {
      console.error('Error unassigning students:', error);
      setToast({ 
        type: 'error', 
        message: error.message || 'Failed to unassign students' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  // PHASE 3: Duplicate lesson function
  const handleDuplicateLesson = async (lessonId: string) => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      console.log('📋 Duplicating lesson:', lessonId);

      // 1. Fetch original lesson
      const { data: originalLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // 2. Fetch exercises
      const { data: originalExercises, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      if (exercisesError) throw exercisesError;

      // 3. Fetch attachments
      const { data: originalAttachments, error: attachmentsError } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId);

      if (attachmentsError) throw attachmentsError;

      // 4. Create new lesson
      const { data: newLesson, error: createError } = await supabase
        .from('lessons')
        .insert({
          tutor_id: session.user.id,
          title: `${originalLesson.title} (Copy)`,
          description: originalLesson.description,
          content: originalLesson.content,
          status: 'draft', // Always create as draft
          is_published: false
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('✅ Created duplicate lesson:', newLesson.id);

      // 5. Duplicate exercises
      if (originalExercises && originalExercises.length > 0) {
        const exercisesToInsert = originalExercises.map(ex => ({
          lesson_id: newLesson.id,
          exercise_type: ex.exercise_type,
          title: ex.title,
          question: ex.question,
          correct_answer: ex.correct_answer,
          options: ex.options,
          explanation: ex.explanation,
          order_number: ex.order_number,
          points: ex.points,
          word_limit: ex.word_limit,
          difficulty_level: ex.difficulty_level,
          estimated_duration_minutes: ex.estimated_duration_minutes
        }));

        const { error: exercisesInsertError } = await supabase
          .from('lesson_exercises')
          .insert(exercisesToInsert);

        if (exercisesInsertError) throw exercisesInsertError;
        console.log(`✅ Duplicated ${exercisesToInsert.length} exercises`);
      }

      // 6. Duplicate attachments (reference same files)
      if (originalAttachments && originalAttachments.length > 0) {
        const attachmentsToInsert = originalAttachments.map(att => ({
          lesson_id: newLesson.id,
          tutor_id: session.user.id,
          file_name: att.file_name,
          file_type: att.file_type,
          file_size: att.file_size,
          mime_type: att.mime_type,
          storage_path: att.storage_path, // Reuse same file
          display_order: att.display_order,
          description: att.description
        }));

        const { error: attachmentsInsertError } = await supabase
          .from('lesson_attachments')
          .insert(attachmentsToInsert);

        if (attachmentsInsertError) throw attachmentsInsertError;
        console.log(`✅ Duplicated ${attachmentsToInsert.length} attachments`);
      }

      setToast({ 
        type: 'success', 
        message: `✅ Lesson duplicated successfully! "${newLesson.title}"` 
      });

      await loadLessons();
    } catch (error: any) {
      console.error('❌ Error duplicating lesson:', error);
      setToast({ 
        type: 'error', 
        message: error.message || 'Failed to duplicate lesson' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  // PHASE 3: Restore draft from localStorage
  const handleRestoreDraft = () => {
    const draft = loadDraftFromLocalStorage();
    if (!draft) {
      setToast({ type: 'error', message: 'No draft found' });
      return;
    }

    setLessonForm(draft.lessonForm);
    setExercises(draft.exercises);
    setAttachments(draft.lessonForm.attachments || []);
    setHasDraft(false);

    setToast({ 
      type: 'success', 
      message: '✅ Draft restored successfully' 
    });
  };

  // PHASE 3: Clear draft
  const handleClearDraft = () => {
    clearDraftFromLocalStorage();
    setHasDraft(false);
    setToast({ 
      type: 'success', 
      message: 'Draft cleared' 
    });
  };

  // Filter lessons
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        (lesson.description?.toLowerCase() || '').includes(query)
      );
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(l => l.status === activeTab);
    }

    return filtered;
  }, [lessons, searchTerm, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = lessons.length;
    const published = lessons.filter(l => l.status === 'published').length;
    const draft = lessons.filter(l => l.status === 'draft').length;
    const totalAssignments = lessons.reduce((sum, l) => sum + (l.assignedCount || 0), 0);
    const avgAssignments = total > 0 ? Math.round(totalAssignments / total) : 0;

    return { total, published, draft, avgAssignments };
  }, [lessons]);

  // Loading state
  if (isLoading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.loading}</span>
      </div>
    );
  }

  const tPage = t.tutorLessonManagementPage;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tPage.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{tPage.subtitle}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadLessons}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{tPage.refresh}</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <PlusCircle className="h-5 w-5" />
            <span>{tPage.createLesson}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={tPage.totalLessons} 
          value={stats.total} 
          icon={Layers} 
          color="purple" 
        />
        <StatsCard 
          title={tPage.publishedLessons} 
          value={stats.published} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatsCard 
          title={tPage.draftLessons} 
          value={stats.draft} 
          icon={FileText} 
          color="orange" 
        />
        <StatsCard 
          title={tPage.avgAssignments} 
          value={stats.avgAssignments} 
          icon={Users} 
          color="blue" 
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800 dark:text-green-200' :
              toast.type === 'error' ? 'text-red-800 dark:text-red-200' :
              'text-yellow-800 dark:text-yellow-200'
            }`}>
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2">
        {[
          { id: 'all' as TabType, label: tPage.allLessons, count: stats.total },
          { id: 'published' as TabType, label: tPage.published, count: stats.published },
          { id: 'draft' as TabType, label: tPage.draft, count: stats.draft }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={tPage.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Locked Lessons Warning */}
      {filteredLessons.filter(l => l.isLocked).length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                {filteredLessons.filter(l => l.isLocked).length} Locked Lesson(s)
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                These lessons are locked because all assigned students have completed them. 
                To edit or delete a locked lesson, you must first unassign completed students.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Layers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? tPage.noLessonsFound : tPage.noLessonsYet}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm ? tPage.tryAdjusting : tPage.createFirstLesson}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{tPage.createLesson}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredLessons.map((lesson) => (
            <TutorLessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={handleEditLesson}
              onView={handleViewLesson}
              onDelete={handleDeleteLesson}
              onAssignStudents={handleAssignStudents}
              onUnassignStudents={handleUnassignStudents}
              onDuplicate={handleDuplicateLesson}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              {/* PHASE 3: Draft Restore Banner */}
              {hasDraft && modalMode === 'create' && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                          Draft Found
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          You have an unsaved draft. Would you like to restore it?
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={handleRestoreDraft}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={handleClearDraft}
                        className="px-3 py-1.5 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 3: Autosave Indicator */}
              {lastSaved && modalMode !== 'view' && (
  <div className="mb-3 flex items-center justify-end space-x-2 text-xs">
    {isSavingDraft ? (
      <>
        <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
        <span className="text-blue-600">Saving to Drafts...</span>
      </>
    ) : (
      <>
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        <span className="text-gray-500 dark:text-gray-400">
          Last saved: {lastSaved.toLocaleTimeString()} 
          {autosaveDraftId && ' (in Drafts tab)'}
        </span>
      </>
    )}
  </div>
)}

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  {modalMode === 'create' && <PlusCircle className="h-5 w-5 text-purple-600" />}
                  {modalMode === 'view' && <Eye className="h-5 w-5 text-blue-600" />}
                  {modalMode === 'edit' && <Edit className="h-5 w-5 text-purple-600" />}
                  <span>
                    {modalMode === 'create' && tPage.createNewLesson}
                    {modalMode === 'view' && tPage.viewLesson}
                    {modalMode === 'edit' && tPage.editLesson}
                  </span>
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-2">
                {[
                  { id: 'info' as ModalTab, label: tPage.lessonInfo, icon: FileText },
                  { id: 'exercises' as ModalTab, label: tPage.exercisesCount.replace('{count}', exercises.length.toString()), icon: BookOpen },
                  { id: 'preview' as ModalTab, label: tPage.preview || 'Preview', icon: Eye }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id)}
                      type="button"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        modalTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalTab === 'info' && (
                <div className="space-y-4">
                  {/* PHASE 3: Statistics Panel for Edit Mode */}
                  {modalMode === 'edit' && currentLesson && (
                    <LessonStatisticsPanel lessonId={currentLesson.id} t={tPage} />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tPage.lessonTitleRequired}
                    </label>
                    <input
                      type="text"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      placeholder={tPage.lessonTitlePlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tPage.description}
                    </label>
                    <textarea
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      disabled={modalMode === 'view'}
                      placeholder={tPage.descriptionPlaceholder}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tPage.lessonContent}
                    </label>
                    <RichTextEditor
                      content={lessonForm.content}
                      onChange={(html) => setLessonForm({ ...lessonForm, content: html })}
                      placeholder={tPage.contentPlaceholder}
                      disabled={modalMode === 'view'}
                      minHeight="200px"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tPage.status}
                    </label>
                    <div className="flex space-x-4">
                      {[
                        { value: 'published' as const, label: tPage.published, icon: CheckCircle },
                        { value: 'draft' as const, label: tPage.draft, icon: FileText }
                      ].map(option => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => modalMode !== 'view' && setLessonForm({ ...lessonForm, status: option.value })}
                            disabled={modalMode === 'view'}
                            type="button"
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                              lessonForm.status === option.value
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Attachments (Optional)
                        </label>
                        <LessonFileUploader
                          lessonId={currentLesson?.id}
                          tutorId={session.user?.id || ''}
                          existingAttachments={attachments}
                          onFilesChange={(files) => {
                            setAttachments(files);
                            setLessonForm({ ...lessonForm, attachments: files });
                          }}
                          disabled={modalMode === 'view'}
                          maxFiles={5}
                        />
                  </div>
                    
                  </div>

                  {/* {modalMode !== 'view' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {tPage.assignToStudents.replace('{count}', lessonForm.assignedStudentIds.length.toString())}
                      </label>

                      
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                        {students.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            {tPage.noStudentsAvailable}
                          </p>
                        ) : (
                          students.map(student => (
                            <label
                              key={student.id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={lessonForm.assignedStudentIds.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setLessonForm({
                                      ...lessonForm,
                                      assignedStudentIds: [...lessonForm.assignedStudentIds, student.id]
                                    });
                                  } else {
                                    setLessonForm({
                                      ...lessonForm,
                                      assignedStudentIds: lessonForm.assignedStudentIds.filter(id => id !== student.id)
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {student.first_name} {student.last_name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )} */} 

               {modalMode !== 'view' && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {tPage.assignToStudents?.replace('{count}', lessonForm.assignedStudentIds.length.toString()) || 
         `Assign to Students (${lessonForm.assignedStudentIds.length} selected)`}
      </label>
      
      {/* ✅ Select All / Deselect All Button */}
      {/* ✅ BEST VERSION: Select All / Deselect All Button */}
{students.length > 0 && (
  <button
    type="button"
    onClick={() => {
      const allStudentIds = students.map(s => s.student_id || s.id).filter(Boolean);
      
      console.log('🔘 [SELECT ALL] Clicked');
      console.log('📊 Students:', {
        total: students.length,
        allIds: allStudentIds,
        currentlyAssigned: lessonForm.assignedStudentIds
      });
      
      // Simple check: are all students in the assigned list?
      const allAreAssigned = allStudentIds.every(id => 
        lessonForm.assignedStudentIds.includes(id)
      );
      
      if (allAreAssigned && lessonForm.assignedStudentIds.length === allStudentIds.length) {
        // All are selected -> DESELECT ALL
        console.log('❌ Deselecting all');
        setLessonForm({ 
          ...lessonForm, 
          assignedStudentIds: [] 
        });
      } else {
        // Not all selected -> SELECT ALL (replace entire array)
        console.log('✅ Selecting all:', allStudentIds);
        setLessonForm({ 
          ...lessonForm, 
          assignedStudentIds: allStudentIds
        });
      }
    }}
    className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-700"
  >
    {(() => {
      const allStudentIds = students.map(s => s.student_id || s.id).filter(Boolean);
      const allAreAssigned = allStudentIds.length > 0 && 
                             allStudentIds.every(id => lessonForm.assignedStudentIds.includes(id)) &&
                             lessonForm.assignedStudentIds.length === allStudentIds.length;
      
      return allAreAssigned ? (
        <>
          <Square className="h-4 w-4" />
          <span>Deselect All</span>
        </>
      ) : (
        <>
          <CheckSquare className="h-4 w-4" />
          <span>Select All</span>
        </>
      );
    })()}
  </button>
)}
    </div>
        
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
      {students.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No students available
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Add students in the Students tab first
          </p>
        </div>
      ) : (
        students.map((student, index) => {
          // Debug: Log each student being rendered
          const studentId = student.student_id || student.id;
          const firstName = student.student_first_name || student.first_name || 'Unknown';
          const lastName = student.student_last_name || student.last_name || 'Student';
          const isChecked = lessonForm.assignedStudentIds.includes(studentId);
          
          // One-time debug log
          if (index === 0) {
            console.log('🎨 [RENDER] First student render:', {
              studentId,
              firstName,
              lastName,
              isChecked,
              allAssignedIds: lessonForm.assignedStudentIds
            });
          }
          
          return (
            <label
              key={studentId}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  console.log('📝 [CHECKBOX] Changed:', {
                    studentId,
                    studentName: `${firstName} ${lastName}`,
                    newCheckedState: e.target.checked,
                    currentAssignments: lessonForm.assignedStudentIds
                  });
                  
                  if (e.target.checked) {
                    // Add student
                    const newAssignments = [...lessonForm.assignedStudentIds, studentId];
                    console.log('➕ Adding student. New assignments:', newAssignments);
                    setLessonForm({
                      ...lessonForm,
                      assignedStudentIds: newAssignments
                    });
                  } else {
                    // Remove student
                    const newAssignments = lessonForm.assignedStudentIds.filter(
                      id => id !== studentId
                    );
                    console.log('➖ Removing student. New assignments:', newAssignments);
                    setLessonForm({
                      ...lessonForm,
                      assignedStudentIds: newAssignments
                    });
                  }
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {firstName?.[0]}{lastName?.[0]}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {firstName} {lastName}
                  </span>
                </div>
              </div>
            </label>
          );
        })
      )}
    </div>
    
    {/* Helper text showing count */}
    {students.length > 0 && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {lessonForm.assignedStudentIds.length === students.length ? (
          <>✅ All {students.length} students selected</>
        ) : lessonForm.assignedStudentIds.length > 0 ? (
          <>{lessonForm.assignedStudentIds.length} of {students.length} students selected</>
        ) : (
          <>No students selected</>
        )}
      </p>
    )}
  </div>
)}
                </div>
              )}

              {modalTab === 'exercises' && (
                <div className="space-y-4">
                  {editingExercise ? (
                    <ExerciseEditor
                      exercise={editingExercise}
                      onChange={setEditingExercise}
                      onSave={handleSaveExercise}
                      onCancel={() => setEditingExercise(null)}
                      readOnly={modalMode === 'view'}
                      t={tPage}
                    />
                  ) : (
                    <>
                      {exercises.length > 0 && (
                        <div className="space-y-3">
                          <div className="space-y-3">
      {exercises.map((exercise, index) => (
        <ExercisePreviewCard
          key={exercise.id}
        exercise={exercise}
        index={index}
        onEdit={modalMode !== 'view' ? () => handleEditExercise(exercise) : undefined}
        onDelete={modalMode !== 'view' ? () => handleDeleteExercise(exercise.id) : undefined}
        readOnly={modalMode === 'view'}
        t={tPage}
        />
      ))}
    </div>
                           </div>
)}
                      {modalMode !== 'view' && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {tPage.addAnotherExercise || 'Add an exercise'}
                          </p>
                          <ExerciseTypeSelector onSelect={handleAddExercise} t={tPage} />
                        </div>
                      )}

                      {exercises.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>{tPage.noExercisesYet || 'No exercises yet'}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {modalTab === 'preview' && (
                <LessonPreviewTab
                  lessonData={lessonForm}
                  exercises={exercises}
                  students={students}
                  attachments={attachments}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {exercises.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{exercises.length} {tPage.exercisesAdded || 'exercises added'}</span>
                    </span>
                  )}
                  {exercises.length === 0 && modalMode !== 'view' && (
                    <span className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{tPage.atLeastOneRequired || 'At least 1 exercise required'}</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closeModal}
                    type="button"
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    {modalMode === 'view' ? tPage.close : tPage.cancel}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      onClick={handleSubmitLesson}
                      disabled={isSubmitting || !lessonForm.title.trim()}
                      type="button"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{modalMode === 'create' ? tPage.creating : tPage.saving}</span>
                        </>
                      ) : (
                        <>
                          {modalMode === 'create' ? <PlusCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                          <span>{modalMode === 'create' ? tPage.createLesson : tPage.saveChanges}</span>
                        </>
                      )} 
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}