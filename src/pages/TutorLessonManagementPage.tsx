// src/pages/TutorLessonManagementPage.tsx - PRZETŁUMACZONA WERSJA Z PEŁNĄ FUNKCJONALNOŚCIĄ

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
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTutorStudents } from '../contexts/StudentsContext';
import {
  getLessonsWithLockStatus,
  checkLessonLockStatus,
  getLessonEditPermissions
} from '../lib/supabase';

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
type ModalTab = 'info' | 'exercises';
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
// TOAST COMPONENT
// ============================================================================
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md">
      <div className={`${colors[type]} border rounded-lg p-4 shadow-lg flex items-start space-x-3`}>
        {icons[type]}
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
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
// ENHANCED LESSON CARD
// ============================================================================
interface EnhancedLessonCardProps {
  lesson: LessonWithAssignments;
  onView: (lesson: LessonWithAssignments) => void;
  onEdit: (lesson: LessonWithAssignments) => void;
  onDelete: (lessonId: string) => void;
  t: any;
}

function EnhancedLessonCard({ lesson, onView, onEdit, onDelete, t }: EnhancedLessonCardProps) {
  const getStatusConfig = (status: string) => {
    return status === 'published'
      ? {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          icon: CheckCircle,
          label: t.published
        }
      : {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          icon: Clock,
          label: t.draft
        };
  };

  const config = getStatusConfig(lesson.status);
  const StatusIcon = config.icon;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Users className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.assigned}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{lesson.assignedCount || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.completed}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{lesson.completedCount || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Target className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.rate}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {lesson.assignedCount ? Math.round(((lesson.completedCount || 0) / lesson.assignedCount) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Calendar className="h-3 w-3" />
        <span>{t.created} {new Date(lesson.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(lesson)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
        >
          <Eye className="h-4 w-4" />
          <span>{t.view}</span>
        </button>
        <button
          onClick={() => onEdit(lesson)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>{t.edit}</span>
        </button>
        <button
          onClick={() => {
            if (window.confirm(`${t.deleteConfirm} "${lesson.title}"?`)) {
              onDelete(lesson.id);
            }
          }}
          className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXERCISE BUILDER COMPONENTS
// ============================================================================

function ExerciseTypeSelector({ onSelect, t }: { onSelect: (type: ExerciseType) => void; t: any }) {
  const types = [
    { value: 'multiple_choice' as ExerciseType, label: t.abcdQuestion, icon: List, color: 'blue' },
    { value: 'flashcard' as ExerciseType, label: t.flashcards, icon: CreditCard, color: 'purple' },
    { value: 'text_answer' as ExerciseType, label: t.textAnswer, icon: Type, color: 'green' }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {types.map(type => {
        const Icon = type.icon;
        return (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            className="p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
          >
            <Icon className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</p>
          </button>
        );
      })}
    </div>
  );
}

function MultipleChoiceBuilder({ exercise, onChange, t }: { exercise: Exercise; onChange: (ex: Exercise) => void; t: any }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.questionRequired}</label>
        <input
          type="text"
          value={exercise.question}
          onChange={(e) => onChange({ ...exercise, question: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder={t.questionPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.options}</label>
        {['A', 'B', 'C', 'D'].map((letter, idx) => (
          <div key={idx} className="flex items-center space-x-2 mb-2">
            <span className="w-8 text-center font-medium text-gray-600 dark:text-gray-400">{letter}.</span>
            <input
              type="text"
              value={exercise.options?.[idx] || ''}
              onChange={(e) => {
                const newOptions = [...(exercise.options || ['', '', '', ''])];
                newOptions[idx] = e.target.value;
                onChange({ ...exercise, options: newOptions });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder={`${t.option} ${letter}`}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.correctAnswerRequired}</label>
        <select
          value={exercise.correctAnswer || 'A'}
          onChange={(e) => onChange({ ...exercise, correctAnswer: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.explanation}</label>
        <textarea
          value={exercise.explanation || ''}
          onChange={(e) => onChange({ ...exercise, explanation: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
          placeholder={t.explanationPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.points}</label>
        <input
          type="number"
          min="1"
          value={exercise.points}
          onChange={(e) => onChange({ ...exercise, points: parseInt(e.target.value) || 1 })}
          className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );
}

function FlashcardBuilder({ exercise, onChange, t }: { exercise: Exercise; onChange: (ex: Exercise) => void; t: any }) {
  const flashcards = exercise.flashcards || [];

  const addFlashcard = () => {
    onChange({
      ...exercise,
      flashcards: [...flashcards, { front: '', back: '' }]
    });
  };

  const updateFlashcard = (idx: number, field: 'front' | 'back', value: string) => {
    const newCards = [...flashcards];
    newCards[idx] = { ...newCards[idx], [field]: value };
    onChange({ ...exercise, flashcards: newCards });
  };

  const removeFlashcard = (idx: number) => {
    onChange({
      ...exercise,
      flashcards: flashcards.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.titleRequired}</label>
        <input
          type="text"
          value={exercise.title}
          onChange={(e) => onChange({ ...exercise, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder={t.titlePlaceholder}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.flashcards}</label>
          <button
            onClick={addFlashcard}
            type="button"
            className="flex items-center space-x-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addCard}</span>
          </button>
        </div>

        {flashcards.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.noFlashcardsYet}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flashcards.map((card, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.card} {idx + 1}</span>
                  <button
                    onClick={() => removeFlashcard(idx)}
                    type="button"
                    className="text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{t.front}</label>
                    <input
                      type="text"
                      value={card.front}
                      onChange={(e) => updateFlashcard(idx, 'front', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white text-sm"
                      placeholder={t.frontPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{t.back}</label>
                    <input
                      type="text"
                      value={card.back}
                      onChange={(e) => updateFlashcard(idx, 'back', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white text-sm"
                      placeholder={t.backPlaceholder}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.points}</label>
        <input
          type="number"
          min="1"
          value={exercise.points}
          onChange={(e) => onChange({ ...exercise, points: parseInt(e.target.value) || 1 })}
          className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );
}

function TextAnswerBuilder({ exercise, onChange, t }: { 
  exercise: Exercise; 
  onChange: (ex: Exercise) => void; 
  t: any 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.questionRequired}
        </label>
        <input
          type="text"
          value={exercise.question}
          onChange={(e) => onChange({ ...exercise, question: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder={t.questionPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.sampleAnswer}
        </label>
        <textarea
          value={exercise.correctAnswer || ''}
          onChange={(e) => onChange({ ...exercise, correctAnswer: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
          placeholder={t.sampleAnswerPlaceholder}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional: Provide a sample answer as reference for grading
        </p>
      </div>

      {/* ✅ ADDED: Word Limit Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Word Limit
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            min="10"
            max="5000"
            value={exercise.wordLimit || 500}
            onChange={(e) => onChange({ 
              ...exercise, 
              wordLimit: parseInt(e.target.value) || 500 
            })}
            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            words maximum
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Students will be required to stay within this word limit
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.points}
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={exercise.points}
          onChange={(e) => onChange({ 
            ...exercise, 
            points: parseInt(e.target.value) || 1 
          })}
          className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maximum points for this exercise
        </p>
      </div>

      {/* ✅ ADDED: Information Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">📝 Manual Grading Required</p>
            <p>
              Text answers will be submitted to you for review and grading. 
              Students will receive a notification once you grade their answer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseListItem({ exercise, index, onEdit, onDelete, readOnly = false, t }: { 
  exercise: Exercise; 
  index: number; 
  onEdit?: () => void; 
  onDelete?: () => void;
  readOnly?: boolean;
  t: any;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = (type: ExerciseType) => {
    switch (type) {
      case 'multiple_choice': return List;
      case 'flashcard': return CreditCard;
      case 'text_answer': return Type;
    }
  };

  const getTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case 'multiple_choice': return t.abcdQuestion;
      case 'flashcard': return t.flashcards;
      case 'text_answer': return t.textAnswer;
    }
  };

  const Icon = getTypeIcon(exercise.type);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Icon className="h-5 w-5 text-purple-600" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {exercise.type === 'flashcard' ? exercise.title : exercise.question}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {getTypeLabel(exercise.type)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {exercise.points} pts</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {!readOnly && onEdit && (
            <button
              onClick={onEdit}
              type="button"
              className="p-1 text-purple-600 hover:text-purple-700"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {!readOnly && onDelete && (
            <button
              onClick={onDelete}
              type="button"
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
          {exercise.type === 'multiple_choice' && (
            <div>
              <p className="mb-2"><strong>{t.options}:</strong></p>
              {exercise.options?.map((opt, idx) => (
                <p key={idx} className={idx === 'ABCD'.indexOf(exercise.correctAnswer || 'A') ? 'text-green-600 font-medium' : ''}>
                  {String.fromCharCode(65 + idx)}. {opt} {idx === 'ABCD'.indexOf(exercise.correctAnswer || 'A') && '✓'}
                </p>
              ))}
            </div>
          )}
          {exercise.type === 'flashcard' && (
            <p>{exercise.flashcards?.length || 0} {t.flashcards.toLowerCase()}</p>
          )}
          {exercise.type === 'text_answer' && (
            <p>{t.maxLength}: {exercise.maxLength}</p>
          )}
        </div>
      )}
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

  // Load lessons
  useEffect(() => {
    if (session?.user?.id) {
      loadLessons();
    }
  }, [session?.user?.id]);

  const loadLessons = async () => {
  if (!session?.user?.id) return;

  setIsLoading(true);
  setError(null);

  try {
    // ✅ NOWE: Użyj funkcji z lock status
    const lessonsData = await getLessonsWithLockStatus(session.user.id);
    setLessons(lessonsData);
  } catch (err: any) {
    setError(err.message || t.tutorLessonManagementPage.errorLoading);
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
          points: ex.points,
          explanation: ex.explanation
        };

        if (ex.exercise_type === 'multiple_choice') {
          return {
            ...baseExercise,
            options: JSON.parse(ex.options || '[]'),
            correctAnswer: ex.correct_answer
          };
        } else if (ex.exercise_type === 'flashcard') {
          return {
            ...baseExercise,
            flashcards: JSON.parse(ex.options || '[]')
          };
        } else if (ex.exercise_type === 'text_answer') {
          const opts = JSON.parse(ex.options || '{}');
          return {
            ...baseExercise,
            correctAnswer: ex.correct_answer,
            wordLimit: ex.word_limit || opts.maxLength || 500,
            maxLength: opts.maxLength || 500
          };
        }

        return baseExercise;
      });

      setExercises(loadedExercises);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setExercises([]);
    }
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
      maxLength: type === 'text_answer' ? 500 : undefined
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

    // ✅ VALIDATION: Require at least 1 exercise
    if (exercises.length === 0) {
      setToast({ type: 'warning', message: t.tutorLessonManagementPage.addOneExercise });
      setModalTab('exercises');
      return;
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
            word_limit: exercise.wordLimit || 500,
            options: JSON.stringify({ 
      maxLength: exercise.wordLimit || exercise.maxLength || 500 
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
          message: t.tutorLessonManagementPage.lessonCreated
            .replace('{title}', lessonForm.title)
            .replace('{count}', exercises.length.toString())
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
              options: JSON.stringify({ maxLength: exercise.maxLength || 500 })
            };
          }

          return baseExercise;
        });

        await supabase
          .from('lesson_exercises')
          .insert(exercisesData);

        setToast({ 
          type: 'success', 
          message: t.tutorLessonManagementPage.lessonUpdated.replace('{title}', lessonForm.title)
        });
      }

      closeModal();
      loadLessons();

    } catch (err: any) {
      setToast({ type: 'error', message: err.message || t.tutorLessonManagementPage.failedToSave });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete lesson
  const handleDelete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setToast({ type: 'success', message: t.tutorLessonManagementPage.lessonDeleted });
      loadLessons();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || t.tutorLessonManagementPage.failedToDelete });
    }
  };

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
      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {tPage.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>{tPage.subtitle}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLessons}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{tPage.refresh}</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{tPage.createLesson}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title={tPage.totalLessons} value={stats.total} icon={BookOpen} color="purple" />
        <KPICard title={tPage.publishedLessons} value={stats.published} icon={CheckCircle} color="green" />
        <KPICard title={tPage.draftLessons} value={stats.draft} icon={FileText} color="orange" />
        <KPICard title={tPage.avgAssignments} value={stats.avgAssignments} icon={TrendingUp} color="blue" />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 inline-flex space-x-1">
        {[
          { id: 'all' as TabType, label: tPage.allLessons, count: lessons.length },
          { id: 'published' as TabType, label: tPage.published, count: stats.published },
          { id: 'draft' as TabType, label: tPage.draft, count: stats.draft }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search Bar */}
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
          {filteredLessons.map(lesson => (
            <EnhancedLessonCard
              key={lesson.id}
              lesson={lesson}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={handleDelete}
              t={tPage}
            />
          ))}
        </div>
      )}

      {/* Modal (Create/View/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
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
                  { id: 'exercises' as ModalTab, label: tPage.exercisesCount.replace('{count}', exercises.length.toString()), icon: BookOpen }
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
              {modalTab === 'info' ? (
                <div className="space-y-4">
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
                    <textarea
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      disabled={modalMode === 'view'}
                      placeholder={tPage.contentPlaceholder}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none disabled:opacity-50"
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
                  </div>

                  {modalMode !== 'view' && (
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
                              key={student.student_id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={lessonForm.assignedStudentIds.includes(student.student_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setLessonForm({
                                      ...lessonForm,
                                      assignedStudentIds: [...lessonForm.assignedStudentIds, student.student_id]
                                    });
                                  } else {
                                    setLessonForm({
                                      ...lessonForm,
                                      assignedStudentIds: lessonForm.assignedStudentIds.filter(id => id !== student.student_id)
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {student.student_first_name} {student.student_last_name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {editingExercise ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingExercise.type === 'multiple_choice' ? tPage.abcdQuestion : 
                           editingExercise.type === 'flashcard' ? tPage.flashcards : tPage.textAnswer}
                        </h3>
                        <button
                          onClick={() => setEditingExercise(null)}
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {editingExercise.type === 'multiple_choice' && (
                        <MultipleChoiceBuilder exercise={editingExercise} onChange={setEditingExercise} t={tPage} />
                      )}
                      {editingExercise.type === 'flashcard' && (
                        <FlashcardBuilder exercise={editingExercise} onChange={setEditingExercise} t={tPage} />
                      )}
                      {editingExercise.type === 'text_answer' && (
                        <TextAnswerBuilder exercise={editingExercise} onChange={setEditingExercise} t={tPage} />
                      )}

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={handleSaveExercise}
                          type="button"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all"
                        >
                          {tPage.saveExercise}
                        </button>
                        <button
                          onClick={() => setEditingExercise(null)}
                          type="button"
                          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                          {tPage.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {exercises.length === 0 ? (
                        <div>
                          {modalMode !== 'view' && (
                            <>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {tPage.chooseExerciseType}
                              </p>
                              <ExerciseTypeSelector onSelect={handleAddExercise} t={tPage} />
                            </>
                          )}
                          {modalMode === 'view' && (
                            <div className="text-center py-8">
                              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">{tPage.noExercisesInLesson}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {tPage.exercises} ({exercises.length})
                              </h3>
                            </div>
                            <div className="space-y-3 mb-4">
                              {exercises.map((exercise, index) => (
                                <ExerciseListItem
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

                          {modalMode !== 'view' && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{tPage.addAnotherExercise}</p>
                              <ExerciseTypeSelector onSelect={handleAddExercise} t={tPage} />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {exercises.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{exercises.length} {tPage.exercisesAdded}</span>
                    </span>
                  )}
                  {exercises.length === 0 && modalMode !== 'view' && (
                    <span className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{tPage.atLeastOneRequired}</span>
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
                      disabled={isSubmitting || !lessonForm.title.trim() || exercises.length === 0}
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