// src/pages/TutorLessonManagementPage.tsx
// ✅ PHASE 1: CRITICAL FIXES IMPLEMENTED
// 1. Rich Text Editor (Tiptap) ✅
// 2. Preview Tab ✅
// 3. Increased Text Answer limit (500 → 2000) ✅
// 4. ABCD Options Validation ✅

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  PlusCircle,
  BookOpen,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Activity,
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
  LockOpen,
  Shield,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { 
  supabase, 
  getLessonsWithLockStatus,
  checkLessonLockStatus,
  getLessonEditPermissions,
  validateLessonOperation,     
  deleteLesson,                 
  assignStudentsToLesson,       
  unassignStudentsFromLesson
} from '../lib/supabase';
import { TutorLessonCard } from '../components/TutorLessonCard';
import { RichTextEditor } from '../components/RichTextEditor';
import { LessonPreviewTab } from '../components/LessonPreviewTab';
 
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
type ModalTab = 'info' | 'exercises' | 'preview'; // ✅ ADDED: preview tab
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
// HELPER FUNCTIONS
// ============================================================================

// ✅ NEW: Validate ABCD options
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

// ✅ NEW: Validate all exercises before saving
const validateExercises = (exercises: Exercise[]): { isValid: boolean; message?: string } => {
  if (exercises.length === 0) {
    return { isValid: false, message: 'At least one exercise is required' };
  }

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const exerciseNum = i + 1;

    // Validate title and question
    if (!exercise.title?.trim()) {
      return { isValid: false, message: `Exercise #${exerciseNum}: Title is required` };
    }
    if (!exercise.question?.trim()) {
      return { isValid: false, message: `Exercise #${exerciseNum}: Question is required` };
    }

    // Validate type-specific fields
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
          className={`flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-${color}-500 dark:hover:border-${color}-500 rounded-lg transition-all duration-200 hover:shadow-md group`}
        >
          <Icon className={`h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-${color}-600 dark:group-hover:text-${color}-400`} />
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
    // Validate before saving
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
                        setValidationError(''); // Clear error on change
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

        {/* Text Answer - ✅ INCREASED LIMIT TO 2000 */}
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
// EXERCISE PREVIEW COMPONENT (for list view)
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

          {/* Type-specific preview */}
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
  const { students } = useTutorStudents();

  // State
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    status: 'published' as 'draft' | 'published'
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load lessons on mount
  useEffect(() => {
    if (session?.user?.id) {
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
      status: 'published'
    });
    setExercises([]);
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
    
    // Load assigned students
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
    setShowModal(false);
    setCurrentLesson(null);
    setEditingExercise(null);
    setModalTab('info');
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
      maxLength: type === 'text_answer' ? 2000 : undefined, // ✅ INCREASED FROM 500 to 2000
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

  // Create/Update lesson
  const handleSubmitLesson = async () => {
    if (!session?.user?.id || !lessonForm.title.trim()) {
      setToast({ type: 'error', message: t.tutorLessonManagementPage.enterTitle });
      return;
    }

    // ✅ VALIDATE EXERCISES (including ABCD validation)
    const validation = validateExercises(exercises);
    if (!validation.isValid) {
      setToast({ type: 'error', message: validation.message || 'Invalid exercises' });
      setModalTab('exercises'); // Switch to exercises tab to show error
      return;
    }

    // ✅ VALIDATION for edit mode (check lock status)
    if (modalMode === 'edit' && currentLesson?.id) {
      console.log('💾 Saving lesson changes...');
      
      const permissions = await getLessonEditPermissions(currentLesson.id, session.user.id);
      if (!permissions.canEdit) {
        setToast({ 
          type: 'error', 
          message: permissions.reason || 'Cannot edit locked lesson - all students have completed it.'
        });
        return;
      }
      
      const validationCheck = await validateLessonOperation(currentLesson.id, session.user.id, 'edit');
      if (!validationCheck.allowed) {
        setToast({ 
          type: 'error', 
          message: validationCheck.reason || 'Cannot save changes to this lesson' 
        });
        return;
      }
    }
      
    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        // Create new lesson
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .insert({
            tutor_id: session.user.id,
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || null,
            content: lessonForm.content.trim() || `<h2>${lessonForm.title}</h2>`,
            status: lessonForm.status,
            is_published: lessonForm.status === 'published'
          })
          .select()
          .single();

        if (lessonError) throw lessonError;

        // Assign students
        if (lessonForm.assignedStudentIds.length > 0) {
          const assignments = lessonForm.assignedStudentIds.map(studentId => ({
            lesson_id: lesson.id,
            student_id: studentId,
            status: 'assigned' as const,
            progress: 0,
            score: null,
            time_spent: 0
          }));

          const { error: assignError } = await supabase
            .from('student_lessons')
            .insert(assignments);

          if (assignError) throw assignError;
        }

        // Create exercises
        const exercisesData = exercises.map((exercise, index) => {
          const baseExercise = {
            lesson_id: lesson.id,
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
          console.error('Error creating exercises:', exercisesError);
        }

        setToast({ 
          type: 'success', 
          message: `✅ Lesson "${lessonForm.title}" created with ${exercises.length} exercises!`
        });

      } else if (modalMode === 'edit' && currentLesson) {
        // Update existing lesson
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
          .eq('id', currentLesson.id);

        if (updateError) throw updateError;

        // Update student assignments (remove old, add new)
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

        // Update exercises (simple approach: delete all and recreate)
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
              options: JSON.stringify({  maxLength: exercise.wordLimit || exercise.maxLength || 2000 })
            };
          }

          return baseExercise;
        });

        await supabase
          .from('lesson_exercises')
          .insert(exercisesData);

        setToast({ 
          type: 'success', 
          message: `✅ Lesson "${lessonForm.title}" updated successfully!`
        });
      }

      closeModal();
      loadLessons();

    } catch (err: any) {
      console.error('Error saving lesson:', err);
      setToast({ type: 'error', message: err.message || 'Failed to save lesson' });
    } finally {
      setIsSubmitting(false);
    }
  };

 