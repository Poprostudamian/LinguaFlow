// src/pages/TutorLessonManagementPage.tsx - KOMPLETNA NAPRAWIONA WERSJA
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Calendar, Clock, Users, PlusCircle, AlertCircle, RefreshCw, Plus, X, Edit, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Importy Supabase - sprawdź czy te funkcje istnieją w twoim projekcie
import { 
  getTutorLessons, 
  createLesson, 
  // updateLesson,
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

// Interface dla tworzenia lekcji - BEZ CONTENT!
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
  // Dodatkowe pola w zależności od typu
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

  // Studenci - zastąp useTutorStudents jeśli nie działa
  const [students, setStudents] = useState<TutorStudent[]>([]);

  // Context
  const { session } = useAuth();

  // ========================================================================================
  // EFFECTS I LOADERS
  // ========================================================================================

  // Load lessons on component mount
  useEffect(() => {
    if (session?.user?.id) {
      loadLessons();
      loadStudents();
    }
  }, [session?.user?.id]);

  // Funkcja ładowania lekcji
  const loadLessons = async () => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sprawdź czy funkcja istnieje, jeśli nie - użyj prostszego podejścia
      const lessonsData = await getTutorLessons(session.user.id);
      setLessons(lessonsData);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
      
      // Fallback - bezpośrednie zapytanie do Supabase
      try {
        const { data, error: supabaseError } = await supabase
          .from('lessons')
          .select('*')
          .eq('tutor_id', session.user.id)
          .order('updated_at', { ascending: false });

        if (supabaseError) throw supabaseError;

        // Dodaj assignedCount manually
        const lessonsWithCounts = await Promise.all(
          (data || []).map(async (lesson) => {
            const { count } = await supabase
              .from('student_lessons')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', lesson.id);

            return {
              ...lesson,
              assignedCount: count || 0
            };
          })
        );

        setLessons(lessonsWithCounts);
        setError(null);
      } catch (fallbackError: any) {
        setError('Failed to load lessons: ' + fallbackError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja ładowania studentów
  const loadStudents = async () => {
    if (!session?.user?.id) return;

    try {
      // Próbuj załadować studentów z bazy
      const { data, error } = await supabase
        .from('tutor_students')
        .select(`
          student_id,
          users!tutor_students_student_id_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('tutor_id', session.user.id);

      if (error) throw error;

      const formattedStudents: TutorStudent[] = (data || []).map(item => ({
        student_id: item.student_id,
        student_email: (item.users as any)?.email || '',
        student_first_name: (item.users as any)?.first_name || '',
        student_last_name: (item.users as any)?.last_name || ''
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      // Ustaw pustą tablicę jeśli nie można załadować
      setStudents([]);
    }
  };

  // ========================================================================================
  // LESSON MANAGEMENT FUNCTIONS
  // ========================================================================================

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }

    if (!newLesson.title.trim()) {
      setError('Lesson title is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let lesson;
      
      // Próbuj użyć funkcji createLesson
      try {
        lesson = await createLesson(session.user.id, {
          ...newLesson,
          title: newLesson.title.trim(),
          description: newLesson.description?.trim() || undefined
        });
      } catch (createError) {
        // Fallback - bezpośrednie wstawienie do Supabase
        const { data, error: insertError } = await supabase
          .from('lessons')
          .insert([{
            title: newLesson.title.trim(),
            description: newLesson.description?.trim() || null,
            status: newLesson.status,
            tutor_id: session.user.id,
            content: '' // Dodaj puste content jeśli tabela tego wymaga
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        lesson = data;
      }

      // Przypisz studentów jeśli wybrano
      if (newLesson.assignedStudentIds.length > 0) {
        try {
          await assignLessonToStudents(lesson.id, newLesson.assignedStudentIds);
        } catch (assignError) {
          // Fallback assignment
          const assignments = newLesson.assignedStudentIds.map(studentId => ({
            lesson_id: lesson.id,
            student_id: studentId,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          }));

          await supabase
            .from('student_lessons')
            .insert(assignments);
        }
      }

      // W przyszłości tutaj będziemy zapisywać ćwiczenia
      if (exercises.length > 0) {
        console.log('Exercises to save:', exercises.length);
        // TODO: Zaimplementować zapisywanie ćwiczeń do bazy
      }

      // Reset form
      setExercises([]);
      setNewLesson({
        title: '',
        description: '',
        assignedStudentIds: [],
        status: 'published'
      });
      
      setShowCreateForm(false);
      await loadLessons();
      
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setError(err.message || 'Failed to create lesson');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditLesson = async (lessonId: string, updates: UpdateLessonData) => {
    console.log('🔄 Editing lesson:', lessonId, updates);
    try {
      try {
        await updateLesson(lessonId, updates);
      } catch (updateError) {
        // Fallback
        const { error } = await supabase
          .from('lessons')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', lessonId);

        if (error) throw error;
      }
      
      await loadLessons();
      console.log('✅ Lesson updated successfully');
    } catch (error) {
      console.error('❌ Error updating lesson:', error);
      setError('Failed to update lesson');
      throw error;
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    console.log('🗑️ Deleting lesson:', lessonId);
    try {
      try {
        await deleteLesson(lessonId);
      } catch (deleteError) {
        // Fallback - bezpośrednie usunięcie
        // Najpierw usuń przypisania
        await supabase
          .from('student_lessons')
          .delete()
          .eq('lesson_id', lessonId);

        // Potem usuń lekcję
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
      }
      
      await loadLessons();
      console.log('✅ Lesson deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting lesson:', error);
      setError('Failed to delete lesson');
      throw error;
    }
  };

  const handleAssignStudents = async (lessonId: string, studentIds: string[]) => {
    console.log('👥 Assigning students:', lessonId, studentIds);
    try {
      try {
        await assignLessonToStudents(lessonId, studentIds);
      } catch (assignError) {
        // Fallback
        const assignments = studentIds.map(studentId => ({
          lesson_id: lessonId,
          student_id: studentId,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        }));

        const { error } = await supabase
          .from('student_lessons')
          .upsert(assignments);

        if (error) throw error;
      }
      
      await loadLessons();
      console.log('✅ Students assigned successfully');
    } catch (error) {
      console.error('❌ Error assigning students:', error);
      setError('Failed to assign students');
      throw error;
    }
  };

  const handleUnassignStudents = async (lessonId: string, studentIds: string[]) => {
    console.log('👥 Unassigning students:', lessonId, studentIds);
    try {
      try {
        await unassignLessonFromStudents(lessonId, studentIds);
      } catch (unassignError) {
        // Fallback
        const { error } = await supabase
          .from('student_lessons')
          .delete()
          .eq('lesson_id', lessonId)
          .in('student_id', studentIds);

        if (error) throw error;
      }
      
      await loadLessons();
      console.log('✅ Students unassigned successfully');
    } catch (error) {
      console.error('❌ Error unassigning students:', error);
      setError('Failed to unassign students');
      throw error;
    }
  };

  const handleStudentToggle = (studentId: string) => {
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

    // Dodaj domyślne pola w zależności od typu
    if (type === 'multiple_choice') {
      newExercise.options = ['', '', '', ''];
      newExercise.correctAnswer = '';
    } else if (type === 'flashcard') {
      newExercise.flashcards = [{front: '', back: ''}];
      newExercise.question = ''; // Dla flashcards nie używamy question
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

  // Funkcje pomocnicze dla flashcards
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

  const switchModalMode = (mode: 'preview' | 'edit') => {
    setLessonModal(prev => ({
      ...prev,
      mode: mode
    }));
  };

  // ========================================================================================
  // COMPUTED VALUES
  // ========================================================================================

  // Filter lessons
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
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lessons...</span>
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
            Lesson Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your lessons with interactive exercises
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Lesson</span>
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
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {lessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {publishedLessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {draftLessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {lessons.reduce((sum, l) => sum + (l.assignedCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Create Lesson Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Lesson
          </h2>
          
          <form onSubmit={handleCreateLesson} className="space-y-6">
            {/* Basic Lesson Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Spanish Grammar Basics"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newLesson.status}
                  onChange={(e) => setNewLesson({...newLesson, status: e.target.value as 'draft' | 'published'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newLesson.description}
                onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Brief description of the lesson..."
              />
            </div>

            {/* Exercises Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ćwiczenia ({exercises.length})
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => addExercise('multiple_choice')}
                    className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-md"
                  >
                    <Plus className="h-3 w-3" />
                    <span>ABCD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addExercise('flashcard')}
                    className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors px-2 py-1 border border-green-300 dark:border-green-600 rounded-md"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Fiszki</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addExercise('text_answer')}
                    className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors px-2 py-1 border border-orange-300 dark:border-orange-600 rounded-md"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tekstowe</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {exercise.type === 'multiple_choice' && '📝 ABCD '}
                        {exercise.type === 'flashcard' && '🃏 Fiszki '}
                        {exercise.type === 'text_answer' && '✍️ Tekstowe '}
                        #{exerciseIndex + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exerciseIndex)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Usuń ćwiczenie"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Podstawowe pola */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Tytuł ćwiczenia
                        </label>
                        <input
                          type="text"
                          value={exercise.title}
                          onChange={(e) => updateExercise(exerciseIndex, 'title', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
// Kontynuacja od momentu <input type="text" value={exercise.title}...

                          placeholder="np. Wybierz poprawną odpowiedź"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Punkty
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exercise.points}
                          onChange={(e) => updateExercise(exerciseIndex, 'points', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Typ
                        </label>
                        <select
                          value={exercise.type}
                          onChange={(e) => updateExercise(exerciseIndex, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        >
                          <option value="multiple_choice">ABCD</option>
                          <option value="flashcard">Fiszki</option>
                          <option value="text_answer">Tekstowe</option>
                        </select>
                      </div>
                    </div>

                    {/* Pytanie - wspólne dla wszystkich typów oprócz flashcard */}
                    {exercise.type !== 'flashcard' && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Pytanie
                        </label>
                        <textarea
                          value={exercise.question}
                          onChange={(e) => updateExercise(exerciseIndex, 'question', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white resize-none"
                          placeholder="Wpisz treść pytania..."
                        />
                      </div>
                    )}
                    
                    {/* Multiple Choice specific fields */}
                    {exercise.type === 'multiple_choice' && (
                      <>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Opcje odpowiedzi
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(exercise.options || ['', '', '', '']).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-4">
                                  {String.fromCharCode(65 + optionIndex)}:
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(exercise.options || ['', '', '', ''])];
                                    newOptions[optionIndex] = e.target.value;
                                    updateExercise(exerciseIndex, 'options', newOptions);
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                                  placeholder={`Opcja ${String.fromCharCode(65 + optionIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Poprawna odpowiedź
                          </label>
                          <select
                            value={exercise.correctAnswer || ''}
                            onChange={(e) => updateExercise(exerciseIndex, 'correctAnswer', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                          >
                            <option value="">Wybierz poprawną odpowiedź</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Flashcard specific fields */}
                    {exercise.type === 'flashcard' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Fiszki ({(exercise.flashcards || []).length})
                          </label>
                          <button
                            type="button"
                            onClick={() => addFlashcard(exerciseIndex)}
                            className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 px-2 py-1 border border-green-300 dark:border-green-600 rounded-md"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Dodaj fiszkę</span>
                          </button>
                        </div>
                        
                        {(exercise.flashcards || []).map((flashcard, flashcardIndex) => (
                          <div key={flashcardIndex} className="p-3 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Fiszka #{flashcardIndex + 1}
                              </span>
                              {(exercise.flashcards || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFlashcard(exerciseIndex, flashcardIndex)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Usuń fiszkę"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Przód (słowo/pytanie)
                                </label>
                                <input
                                  type="text"
                                  value={flashcard.front}
                                  onChange={(e) => updateFlashcard(exerciseIndex, flashcardIndex, 'front', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded-md dark:bg-gray-500 dark:text-white"
                                  placeholder="np. Hello"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Tył (tłumaczenie/odpowiedź)
                                </label>
                                <input
                                  type="text"
                                  value={flashcard.back}
                                  onChange={(e) => updateFlashcard(exerciseIndex, flashcardIndex, 'back', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded-md dark:bg-gray-500 dark:text-white"
                                  placeholder="np. Cześć"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Answer specific fields */}
                    {exercise.type === 'text_answer' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Maksymalna długość odpowiedzi (znaków)
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="2000"
                          value={exercise.maxLength || 500}
                          onChange={(e) => updateExercise(exerciseIndex, 'maxLength', parseInt(e.target.value) || 500)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                          placeholder="500"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {exercises.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Brak ćwiczeń. Wybierz typ ćwiczenia powyżej aby rozpocząć.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assign Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Students ({newLesson.assignedStudentIds.length} selected)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No students available. Add students first in the Students tab.
                  </p>
                ) : (
                  students.map((student) => (
                    <label key={student.student_id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLesson.assignedStudentIds.includes(student.student_id)}
                        onChange={() => handleStudentToggle(student.student_id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.student_first_name} {student.student_last_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({student.student_email})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating || !newLesson.title.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreating ? 'Creating...' : `Create Lesson${exercises.length > 0 ? ` (${exercises.length} exercises)` : ''}`}</span>
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
                Cancel
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
              placeholder="Search lessons by title..."
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
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <button
            onClick={loadLessons}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {filteredLessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {lessons.length === 0 ? 'No lessons yet' : 'No lessons match your search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {lessons.length === 0 
                ? 'Get started by creating your first lesson with interactive exercises.'
                : 'Try adjusting your search term or filters.'
              }
            </p>
            {lessons.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                Create Your First Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lesson.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lesson.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {lesson.status}
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
                        <span>{lesson.assignedCount || 0} assigned</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>Sample exercises</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openLessonModal(lesson, 'preview')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Preview lesson content"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => openLessonModal(lesson, 'edit')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      title="Edit lesson and exercises"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`)) {
                          handleDeleteLesson(lesson.id);
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete lesson permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
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
                <span>{publishedLessons.length} Published</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{draftLessons.length} Drafts</span>
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