// src/pages/TutorLessonManagementPage.tsx - PRZETŁUMACZONA WERSJA
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Calendar, Clock, Users, PlusCircle, AlertCircle, RefreshCw, Plus, X, Edit, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Importy Supabase
import { 
  getTutorLessons, 
  createLesson, 
  deleteLesson,
  assignLessonToStudents,
  unassignLessonFromStudents,
  supabase
} from '../lib/supabase';

// ========================================================================================
// INTERFACES I TYPY
// ========================================================================================

// Podstawowy interface dla lekcji
export interface LessonWithAssignments {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  tutor_id: string;
  created_at: string;
  updated_at: string;
  assignedCount: number;
}

// Interface dla tworzenia lekcji
export interface CreateLessonData {
  title: string;
  description?: string;
  assignedStudentIds: string[];
  status: 'draft' | 'published';
}

// Interface dla aktualizacji lekcji
export interface UpdateLessonData {
  title?: string;
  description?: string;
  status?: 'draft' | 'published';
}

// Interface dla prostych ćwiczeń
interface SimpleExercise {
  id?: string;
  type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  flashcards?: Array<{front: string, back: string}>;
  maxLength?: number;
}

// Interface studenta
interface TutorStudent {
  student_id: string;
  student_email: string;
  student_first_name: string;
  student_last_name: string;
}

// Modal state interface
interface LessonModal {
  isOpen: boolean;
  lesson: LessonWithAssignments | null;
  mode: 'preview' | 'edit';
}

// ========================================================================================
// GŁÓWNY KOMPONENT
// ========================================================================================

export function TutorLessonManagementPage() {
  const { t } = useLanguage();
  const { session } = useAuth();

  // ========================================================================================
  // STATE MANAGEMENT
  // ========================================================================================
  
  // Podstawowe stany
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Formularz tworzenia lekcji
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLesson, setNewLesson] = useState<CreateLessonData>({
    title: '',
    description: '',
    assignedStudentIds: [],
    status: 'published'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Ćwiczenia
  const [exercises, setExercises] = useState<SimpleExercise[]>([]);

  // Modal
  const [lessonModal, setLessonModal] = useState<LessonModal>({
    isOpen: false,
    lesson: null,
    mode: 'preview'
  });

  // Studenci
  const [students, setStudents] = useState<TutorStudent[]>([]);

  // ========================================================================================
  // USEEFFECT - LOAD DATA
  // ========================================================================================

  useEffect(() => {
    loadLessons();
    loadStudents();
  }, [session]);

  // ========================================================================================
  // DATA LOADING FUNCTIONS
  // ========================================================================================

  const loadLessons = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTutorLessons(session.user.id);
      setLessons(data);
    } catch (error: any) {
      console.error('Error loading lessons:', error);
      setError(error.message || t.tutorLessonManagementPage.errorLoading);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('tutor_students')
        .select('student_id, student_email, student_first_name, student_last_name')
        .eq('tutor_id', session.user.id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // ========================================================================================
  // LESSON CRUD FUNCTIONS
  // ========================================================================================

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsCreating(true);
    setError(null);

    try {
      console.log('🎯 Creating lesson with exercises:', {
        lesson: newLesson,
        exercises: exercises
      });

      // KROK 1: Stwórz lekcję
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          tutor_id: session.user.id,
          title: newLesson.title.trim(),
          description: newLesson.description?.trim() || null,
          content: `<h2>${newLesson.title}</h2><p>This lesson includes ${exercises.length} interactive exercises.</p>`,
          status: newLesson.status,
          is_published: newLesson.status === 'published'
        })
        .select()
        .single();

      if (lessonError) {
        console.error('❌ Error creating lesson:', lessonError);
        throw lessonError;
      }

      console.log('✅ Lesson created:', lesson);
      const lessonId = lesson.id;

      // KROK 2: Przypisz studentów do lekcji
      if (newLesson.assignedStudentIds.length > 0) {
        const assignments = newLesson.assignedStudentIds.map(studentId => ({
          lesson_id: lessonId,
          student_id: studentId,
          status: 'assigned' as const,
          progress: 0,
          score: null,
          time_spent: 0
        }));

        const { error: assignmentError } = await supabase
          .from('student_lessons')
          .insert(assignments);

        if (assignmentError) {
          console.error('❌ Error assigning students:', assignmentError);
          throw assignmentError;
        }

        console.log('✅ Students assigned:', newLesson.assignedStudentIds.length);
      }

      // KROK 3: Stwórz ćwiczenia
      if (exercises.length > 0) {
        console.log('🎯 Creating exercises for lesson:', lessonId);

        const exercisesData = exercises.map((exercise, index) => {
          const baseExercise = {
            lesson_id: lessonId,
            exercise_type: exercise.type,
            title: exercise.title,
            question: exercise.question,
            order_number: index + 1,
            points: exercise.points || 1,
            explanation: null
          };

          if (exercise.type === 'multiple_choice') {
            return {
              ...baseExercise,
              correct_answer: exercise.correctAnswer || 'A',
              options: JSON.stringify(exercise.options || ['Option A', 'Option B', 'Option C', 'Option D'])
            };
          } else if (exercise.type === 'flashcard') {
            return {
              ...baseExercise,
              correct_answer: exercise.flashcards?.[0]?.back || 'Answer',
              options: JSON.stringify(exercise.flashcards || [])
            };
          } else if (exercise.type === 'text_answer') {
            return {
              ...baseExercise,
              correct_answer: exercise.correctAnswer || 'Sample answer',
              options: JSON.stringify({ maxLength: exercise.maxLength || 500 })
            };
          }

          return baseExercise;
        });

        const { error: exercisesError } = await supabase
          .from('lesson_exercises')
          .insert(exercisesData);

        if (exercisesError) {
          console.error('❌ Error creating exercises:', exercisesError);
          
          if (exercisesError.code === '42P01') {
            console.warn('⚠️', t.tutorLessonManagementPage.tableNotExist);
            alert(t.tutorLessonManagementPage.exerciseWarning);
          } else {
            throw exercisesError;
          }
        } else {
          console.log('✅ Exercises created:', exercises.length);
        }
      }

      // KROK 4: Reset formularza i odśwież dane
      setNewLesson({
        title: '',
        description: '',
        assignedStudentIds: [],
        status: 'published'
      });
      setExercises([]);
      setShowCreateForm(false);

      alert(`✅ ${t.tutorLessonManagementPage.lessonCreated} ${exercises.length} ${t.tutorLessonManagementPage.exercisesAdded}`);

      await loadLessons();

    } catch (error: any) {
      console.error('❌ Error creating lesson:', error);
      setError(error.message || 'Failed to create lesson');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!session?.user?.id) return;

    try {
      await deleteLesson(lessonId);
      await loadLessons();
      alert(t.tutorLessonManagementPage.lessonDeleted);
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      alert(error.message || 'Failed to delete lesson');
    }
  };

  // ========================================================================================
  // STUDENT ASSIGNMENT FUNCTIONS
  // ========================================================================================

  const toggleStudentSelection = (studentId: string) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  // ========================================================================================
  // EXERCISE MANAGEMENT FUNCTIONS
  // ========================================================================================

  const addExercise = (type: SimpleExercise['type']) => {
    const newExercise: SimpleExercise = {
      type: type,
      title: '',
      question: '',
      points: 1
    };

    if (type === 'multiple_choice') {
      newExercise.options = ['', '', '', ''];
      newExercise.correctAnswer = '';
    } else if (type === 'flashcard') {
      newExercise.flashcards = [{front: '', back: ''}];
      newExercise.question = '';
    } else if (type === 'text_answer') {
      newExercise.maxLength = 500;
    }

    setExercises(prev => [...prev, newExercise]);
  };

  const updateExercise = (index: number, field: keyof SimpleExercise, value: any) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    ));
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const addFlashcard = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (exercise.type === 'flashcard' && exercise.flashcards) {
      const updatedFlashcards = [...exercise.flashcards, {front: '', back: ''}];
      updateExercise(exerciseIndex, 'flashcards', updatedFlashcards);
    }
  };

  const updateFlashcard = (exerciseIndex: number, flashcardIndex: number, field: 'front' | 'back', value: string) => {
    const exercise = exercises[exerciseIndex];
    if (exercise.type === 'flashcard' && exercise.flashcards) {
      const updatedFlashcards = exercise.flashcards.map((card, i) => 
        i === flashcardIndex ? { ...card, [field]: value } : card
      );
      updateExercise(exerciseIndex, 'flashcards', updatedFlashcards);
    }
  };

  const removeFlashcard = (exerciseIndex: number, flashcardIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (exercise.type === 'flashcard' && exercise.flashcards && exercise.flashcards.length > 1) {
      const updatedFlashcards = exercise.flashcards.filter((_, i) => i !== flashcardIndex);
      updateExercise(exerciseIndex, 'flashcards', updatedFlashcards);
    }
  };

  // ========================================================================================
  // MODAL MANAGEMENT FUNCTIONS
  // ========================================================================================

  const openLessonModal = (lesson: LessonWithAssignments, mode: 'preview' | 'edit') => {
    setLessonModal({
      isOpen: true,
      lesson: lesson,
      mode: mode
    });
  };

  const closeLessonModal = () => {
    setLessonModal({
      isOpen: false,
      lesson: null,
      mode: 'preview'
    });
  };

  // ========================================================================================
  // COMPUTED VALUES
  // ========================================================================================

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const publishedLessons = filteredLessons.filter(l => l.status === 'published');
  const draftLessons = filteredLessons.filter(l => l.status === 'draft');

  // ========================================================================================
  // LOADING STATE
  // ========================================================================================

  if (isLoading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.loading}</span>
      </div>
    );
  }

  // ========================================================================================
  // MAIN RENDER
  // ========================================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorLessonManagementPage.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorLessonManagementPage.subtitle}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t.tutorLessonManagementPage.createLesson}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadLessons}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              {t.tutorLessonManagementPage.retry}
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.totalLessons}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.publishedLessons}</p>
              <p className="text-2xl font-bold text-green-600">{lessons.filter(l => l.status === 'published').length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.draftLessons}</p>
              <p className="text-2xl font-bold text-yellow-600">{lessons.filter(l => l.status === 'draft').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.totalAssigned}</p>
              <p className="text-2xl font-bold text-blue-600">{lessons.reduce((sum, l) => sum + (l.assignedCount || 0), 0)}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Create Lesson Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t.tutorLessonManagementPage.createNewLesson}
          </h2>

          <form onSubmit={handleCreateLesson} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.tutorLessonManagementPage.lessonTitle}
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t.tutorLessonManagementPage.lessonTitlePlaceholder}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.tutorLessonManagementPage.lessonDescription}
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.tutorLessonManagementPage.lessonDescriptionPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Students Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.tutorLessonManagementPage.assignStudents}
              </label>
              
              {students.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.noStudentsAvailable}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t.tutorLessonManagementPage.noStudentsDescription}</p>
                </div>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <label
                      key={student.student_id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={newLesson.assignedStudentIds.includes(student.student_id)}
                        onChange={() => toggleStudentSelection(student.student_id)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.student_first_name} {student.student_last_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({student.student_email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
              
              {newLesson.assignedStudentIds.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {newLesson.assignedStudentIds.length} {t.tutorLessonManagementPage.selectedStudents}
                </p>
              )}
            </div>

            {/* Exercises Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.tutorLessonManagementPage.exercises}
                </label>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => addExercise('multiple_choice')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t.tutorLessonManagementPage.multipleChoice}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => addExercise('flashcard')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t.tutorLessonManagementPage.flashcards}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => addExercise('text_answer')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t.tutorLessonManagementPage.textAnswer}</span>
                  </button>
                </div>
              </div>

              {/* Exercises List */}
              {exercises.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">{t.tutorLessonManagementPage.noExercises}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t.tutorLessonManagementPage.addExerciseDescription}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.tutorLessonManagementPage.exerciseType}: {
                            exercise.type === 'multiple_choice' ? t.tutorLessonManagementPage.typeMultipleChoice :
                            exercise.type === 'flashcard' ? t.tutorLessonManagementPage.typeFlashcard :
                            t.tutorLessonManagementPage.typeTextAnswer
                          }
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Exercise Title */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t.tutorLessonManagementPage.exerciseTitle}
                        </label>
                        <input
                          type="text"
                          value={exercise.title}
                          onChange={(e) => updateExercise(index, 'title', e.target.value)}
                          placeholder={t.tutorLessonManagementPage.exerciseTitlePlaceholder}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        />
                      </div>

                      {/* Multiple Choice */}
                      {exercise.type === 'multiple_choice' && (
                        <>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t.tutorLessonManagementPage.question}
                            </label>
                            <textarea
                              value={exercise.question}
                              onChange={(e) => updateExercise(index, 'question', e.target.value)}
                              placeholder={t.tutorLessonManagementPage.questionPlaceholder}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white resize-none"
                            />
                          </div>

                          <div className="space-y-2 mb-3">
                            {exercise.options?.map((option, optIndex) => (
                              <div key={optIndex}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {t.tutorLessonManagementPage.option} {String.fromCharCode(65 + optIndex)}
                                </label>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(exercise.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    updateExercise(index, 'options', newOptions);
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t.tutorLessonManagementPage.correctAnswer}
                            </label>
                            <select
                              value={exercise.correctAnswer || ''}
                              onChange={(e) => updateExercise(index, 'correctAnswer', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                            >
                              <option value="">{t.tutorLessonManagementPage.selectCorrect}</option>
                              {exercise.options?.map((_, optIndex) => (
                                <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                                  {t.tutorLessonManagementPage.option} {String.fromCharCode(65 + optIndex)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Flashcards */}
                      {exercise.type === 'flashcard' && (
                        <div className="space-y-3">
                          {exercise.flashcards?.map((flashcard, fcIndex) => (
                            <div key={fcIndex} className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-600">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {t.tutorLessonManagementPage.flashcard} {fcIndex + 1}
                                </span>
                                {exercise.flashcards && exercise.flashcards.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFlashcard(index, fcIndex)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {t.tutorLessonManagementPage.front}
                                  </label>
                                  <input
                                    type="text"
                                    value={flashcard.front}
                                    onChange={(e) => updateFlashcard(index, fcIndex, 'front', e.target.value)}
                                    placeholder={t.tutorLessonManagementPage.frontPlaceholder}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-500 dark:text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {t.tutorLessonManagementPage.back}
                                  </label>
                                  <input
                                    type="text"
                                    value={flashcard.back}
                                    onChange={(e) => updateFlashcard(index, fcIndex, 'back', e.target.value)}
                                    placeholder={t.tutorLessonManagementPage.backPlaceholder}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-500 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addFlashcard(index)}
                            className="w-full py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            + {t.tutorLessonManagementPage.addFlashcard}
                          </button>
                        </div>
                      )}

                      {/* Text Answer */}
                      {exercise.type === 'text_answer' && (
                        <>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t.tutorLessonManagementPage.question}
                            </label>
                            <textarea
                              value={exercise.question}
                              onChange={(e) => updateExercise(index, 'question', e.target.value)}
                              placeholder={t.tutorLessonManagementPage.questionPlaceholder}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white resize-none"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t.tutorLessonManagementPage.maxLength}
                            </label>
                            <input
                              type="number"
                              value={exercise.maxLength || 500}
                              onChange={(e) => updateExercise(index, 'maxLength', parseInt(e.target.value))}
                              min="1"
                              max="5000"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t.tutorLessonManagementPage.characters}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Points */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t.tutorLessonManagementPage.points}
                        </label>
                        <input
                          type="number"
                          value={exercise.points}
                          onChange={(e) => updateExercise(index, 'points', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.tutorLessonManagementPage.lessonStatus}
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={newLesson.status === 'published'}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.tutorLessonManagementPage.published}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorLessonManagementPage.publishedStatus}</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={newLesson.status === 'draft'}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.tutorLessonManagementPage.draft}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorLessonManagementPage.draftStatus}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isCreating || !newLesson.title.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreating ? t.tutorLessonManagementPage.creating : `${t.tutorLessonManagementPage.createLessonButton}${exercises.length > 0 ? ` (${exercises.length} ${t.tutorLessonManagementPage.withExercises})` : ''}`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setExercises([]);
                  setNewLesson({
                    title: '',
                    description: '',
                    assignedStudentIds: [],
                    status: 'published'
                  });
                }}
                disabled={isCreating}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.tutorLessonManagementPage.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.tutorLessonManagementPage.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t.tutorLessonManagementPage.allStatus}</option>
              <option value="published">{t.tutorLessonManagementPage.published}</option>
              <option value="draft">{t.tutorLessonManagementPage.draft}</option>
            </select>
          </div>
          
          <button
            onClick={loadLessons}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.tutorLessonManagementPage.refresh}</span>
          </button>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {t.tutorLessonManagementPage.noLessons}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t.tutorLessonManagementPage.noLessonsDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lesson.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lesson.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {lesson.status === 'published' ? t.tutorLessonManagementPage.published : t.tutorLessonManagementPage.draft}
                      </span>
                    </div>
                    
                    {lesson.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {lesson.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{lesson.assignedCount || 0} {t.tutorLessonManagementPage.assigned}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{t.tutorLessonManagementPage.sampleExercises}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openLessonModal(lesson, 'preview')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title={t.tutorLessonManagementPage.preview}
                    >
                      <Eye className="h-4 w-4" />
                      <span>{t.tutorLessonManagementPage.preview}</span>
                    </button>
                    <button
                      onClick={() => openLessonModal(lesson, 'edit')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      title={t.tutorLessonManagementPage.edit}
                    >
                      <Edit className="h-4 w-4" />
                      <span>{t.tutorLessonManagementPage.edit}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`${t.tutorLessonManagementPage.confirmDelete} "${lesson.title}"?`)) {
                          handleDeleteLesson(lesson.id);
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title={t.tutorLessonManagementPage.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t.tutorLessonManagementPage.delete}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {lessons.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Showing {filteredLessons.length} of {lessons.length} lessons
            </div>
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{publishedLessons.length} {t.tutorLessonManagementPage.published}</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{draftLessons.length} {t.tutorLessonManagementPage.draftLessons}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{lessons.reduce((sum, l) => sum + (l.assignedCount || 0), 0)} Total Assignments</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorLessonManagementPage;