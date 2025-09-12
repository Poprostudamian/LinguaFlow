// src/pages/TutorLessonManagementPage.tsx - KOMPLETNA NAPRAWIONA WERSJA
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Calendar, Clock, Users, PlusCircle, AlertCircle, RefreshCw, Plus, X, Edit, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Importy Supabase - sprawdź czy te funkcje istnieją w twoim projekcie
import { 
  getTutorLessons, 
  createLesson, 
  updateLesson,
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