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