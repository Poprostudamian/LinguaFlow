// src/pages/TutorLessonManagementPage.tsx - Enhanced with Lesson Locking

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Save, 
  X, 
  BookOpen, 
  Users,
  Lock,
  LockOpen,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TutorLessonCard } from '../components/TutorLessonCard';
import { 
  supabase, 
  getLessonsWithLockStatus,
  checkLessonLockStatus,
  getLessonEditPermissions
} from '../lib/supabase';
import { LessonWithAssignments, ExerciseBuilder as ExerciseBuilderType } from '../types/lesson.types';

interface LessonForm {
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
  assignedStudentIds: string[];
}

interface Toast {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export function TutorLessonManagementPage() {
  const { session } = useAuth();
  const { students, loading: studentsLoading } = useTutorStudents();
  const { t } = useLanguage();

  // State
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [modalTab, setModalTab] = useState<'info' | 'exercises'>('info');
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Form state
  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: '',
    description: '',
    content: '',
    status: 'draft',
    assignedStudentIds: []
  });

  // Exercise state
  const [exercises, setExercises] = useState<ExerciseBuilderType[]>([]);
  const [editingExercise, setEditingExercise] = useState<ExerciseBuilderType | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'tutor') {
      loadLessons();
    }
  }, [session]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadLessons = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // ✅ NEW: Use enhanced function that includes lock status
      const lessonsData = await getLessonsWithLockStatus(session.user.id);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorLoadingLessons });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLessonForm({
      title: '',
      description: '',
      content: '',
      status: 'draft',
      assignedStudentIds: []
    });
    setExercises([]);
    setEditingExercise(null);
    setModalTab('info');
  };

  const handleCreateLesson = () => {
    resetForm();
    setModalMode('create');
    setCurrentLessonId(null);
    setShowModal(true);
  };

  // ✅ ENHANCED: Check edit permissions before opening modal
  const handleEditLesson = async (lessonId: string) => {
    if (!session?.user?.id) return;

    try {
      // Check if lesson is editable
      const permissions = await getLessonEditPermissions(lessonId, session.user.id);
      
      if (!permissions.canEdit) {
        setToast({ 
          type: 'warning', 
          message: permissions.reason || t.tutorLessonManagementPage.cannotEditLesson 
        });
        return;
      }

      // Load lesson data for editing
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) {
        setToast({ type: 'error', message: t.tutorLessonManagementPage.lessonNotFound });
        return;
      }

      // Populate form
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        content: lesson.content || '',
        status: lesson.status,
        assignedStudentIds: lesson.assignedStudents || []
      });

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      if (exercisesError) throw exercisesError;

      const formattedExercises: ExerciseBuilderType[] = (exercisesData || []).map(ex => ({
        id: ex.id,
        type: ex.exercise_type as any,
        title: ex.title,
        question: ex.question,
        options: ex.options ? JSON.parse(ex.options) : undefined,
        correctAnswer: ex.correct_answer,
        explanation: ex.explanation || '',
        points: ex.points,
        flashcards: ex.exercise_type === 'flashcard' && ex.options ? JSON.parse(ex.options) : undefined,
        maxLength: ex.word_limit || undefined
      }));

      setExercises(formattedExercises);
      setCurrentLessonId(lessonId);
      setModalMode('edit');
      setShowModal(true);

    } catch (error) {
      console.error('Error preparing lesson for edit:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorLoadingLesson });
    }
  };

  const handleViewLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      status: lesson.status,
      assignedStudentIds: lesson.assignedStudents || []
    });

    setCurrentLessonId(lessonId);
    setModalMode('view');
    setShowModal(true);
  };

  // ✅ ENHANCED: Check delete permissions
  const handleDeleteLesson = async (lessonId: string) => {
    if (!session?.user?.id) return;

    try {
      // Check if lesson can be deleted
      const permissions = await getLessonEditPermissions(lessonId, session.user.id);
      
      if (!permissions.canDelete) {
        setToast({ 
          type: 'warning', 
          message: permissions.reason || t.tutorLessonManagementPage.cannotDeleteLesson 
        });
        return;
      }

      // Proceed with deletion
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('tutor_id', session.user.id);

      if (error) throw error;

      setToast({ type: 'success', message: t.tutorLessonManagementPage.lessonDeleted });
      loadLessons();

    } catch (error) {
      console.error('Error deleting lesson:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorDeletingLesson });
    }
  };

  const handleAssignStudents = async (lessonId: string, studentIds: string[]) => {
    try {
      // ✅ Check if lesson allows new assignments
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson?.isLocked) {
        setToast({ 
          type: 'warning', 
          message: t.tutorLessonManagementPage.cannotAssignToLockedLesson 
        });
        return;
      }

      const assignments = studentIds.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
        status: 'assigned' as const,
        progress: 0,
        score: null,
        assigned_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('student_lessons')
        .insert(assignments);

      if (error) throw error;

      setToast({ type: 'success', message: t.tutorLessonManagementPage.studentsAssigned });
      loadLessons();

    } catch (error) {
      console.error('Error assigning students:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorAssigningStudents });
    }
  };

  const handleUnassignStudents = async (lessonId: string, studentIds: string[]) => {
    try {
      const { error } = await supabase
        .from('student_lessons')
        .delete()
        .eq('lesson_id', lessonId)
        .in('student_id', studentIds);

      if (error) throw error;

      setToast({ type: 'success', message: t.tutorLessonManagementPage.studentsUnassigned });
      loadLessons();

    } catch (error) {
      console.error('Error unassigning students:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorUnassigningStudents });
    }
  };

  const handleAddExercise = (type: 'multiple_choice' | 'flashcard' | 'text_answer') => {
    const newExercise: ExerciseBuilderType = {
      id: `temp-${Date.now()}`,
      type,
      title: '',
      question: '',
      explanation: '',
      points: 10,
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

  const handleEditExercise = (exercise: ExerciseBuilderType) => {
    setEditingExercise(exercise);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  // ✅ ENHANCED: Check if lesson is locked before submitting
  const handleSubmitLesson = async () => {
    if (!session?.user?.id || !lessonForm.title.trim()) {
      setToast({ type: 'error', message: t.tutorLessonManagementPage.enterTitle });
      return;
    }

    // Validation: Require at least 1 exercise
    if (exercises.length === 0) {
      setToast({ type: 'warning', message: t.tutorLessonManagementPage.addOneExercise });
      setModalTab('exercises');
      return;
    }

    // ✅ NEW: For edit mode, check if lesson is locked
    if (modalMode === 'edit' && currentLessonId) {
      const permissions = await getLessonEditPermissions(currentLessonId, session.user.id);
      if (!permissions.canEdit) {
        setToast({ 
          type: 'error', 
          message: permissions.reason || t.tutorLessonManagementPage.cannotEditLockedLesson 
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

        // Save exercises
        if (exercises.length > 0) {
          const exerciseInserts = exercises.map((ex, index) => ({
            lesson_id: lesson.id,
            exercise_type: ex.type,
            title: ex.title,
            question: ex.question,
            correct_answer: ex.correctAnswer,
            options: ex.options ? JSON.stringify(ex.options) : null,
            explanation: ex.explanation || null,
            points: ex.points,
            order_number: index + 1,
            word_limit: ex.maxLength || null
          }));

          const { error: exercisesError } = await supabase
            .from('lesson_exercises')
            .insert(exerciseInserts);

          if (exercisesError) throw exercisesError;
        }

        // Assign students
        if (lessonForm.assignedStudentIds.length > 0) {
          const assignments = lessonForm.assignedStudentIds.map(studentId => ({
            lesson_id: lesson.id,
            student_id: studentId,
            status: 'assigned' as const,
            progress: 0,
            score: null,
            assigned_at: new Date().toISOString()
          }));

          const { error: assignError } = await supabase
            .from('student_lessons')
            .insert(assignments);

          if (assignError) throw assignError;
        }

        setToast({ type: 'success', message: t.tutorLessonManagementPage.lessonCreated });

      } else if (modalMode === 'edit' && currentLessonId) {
        // Update existing lesson
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || null,
            content: lessonForm.content.trim(),
            status: lessonForm.status,
            is_published: lessonForm.status === 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentLessonId)
          .eq('tutor_id', session.user.id);

        if (updateError) throw updateError;

        // Update exercises (delete existing and recreate)
        const { error: deleteExercisesError } = await supabase
          .from('lesson_exercises')
          .delete()
          .eq('lesson_id', currentLessonId);

        if (deleteExercisesError) throw deleteExercisesError;

        if (exercises.length > 0) {
          const exerciseInserts = exercises.map((ex, index) => ({
            lesson_id: currentLessonId,
            exercise_type: ex.type,
            title: ex.title,
            question: ex.question,
            correct_answer: ex.correctAnswer,
            options: ex.options ? JSON.stringify(ex.options) : null,
            explanation: ex.explanation || null,
            points: ex.points,
            order_number: index + 1,
            word_limit: ex.maxLength || null
          }));

          const { error: exercisesError } = await supabase
            .from('lesson_exercises')
            .insert(exerciseInserts);

          if (exercisesError) throw exercisesError;
        }

        setToast({ type: 'success', message: t.tutorLessonManagementPage.lessonUpdated });
      }

      setShowModal(false);
      resetForm();
      loadLessons();

    } catch (error) {
      console.error('Error saving lesson:', error);
      setToast({ type: 'error', message: t.tutorLessonManagementPage.errorSavingLesson });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter lessons based on search
  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lesson.description && lesson.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ✅ NEW: Separate locked and unlocked lessons for better UX
  const lockedLessons = filteredLessons.filter(lesson => lesson.isLocked);
  const unlockedLessons = filteredLessons.filter(lesson => !lesson.isLocked);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.tutorLessonManagementPage.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t.tutorLessonManagementPage.subtitle}
            </p>
          </div>
          <button
            onClick={handleCreateLesson}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <PlusCircle className="h-5 w-5" />
            <span>{t.tutorLessonManagementPage.createNewLesson}</span>
          </button>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.tutorLessonManagementPage.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* ✅ NEW: Lock Status Stats */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{lessons.length} {t.tutorLessonManagementPage.totalLessons}</span>
              </div>
              {lockedLessons.length > 0 && (
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Lock className="h-4 w-4" />
                  <span>{lockedLessons.length} {t.tutorLessonManagementPage.lockedLessons}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ NEW: Locked Lessons Info Banner */}
        {lockedLessons.length > 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t.tutorLessonManagementPage.lockedLessonsNotice}
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  {t.tutorLessonManagementPage.lockedLessonsExplanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <div>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.tutorLessonManagementPage.noLessonsFound}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.tutorLessonManagementPage.tryAdjusting}
                </p>
              </div>
            ) : (
              <div>
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.tutorLessonManagementPage.noLessonsYet}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t.tutorLessonManagementPage.createFirstLesson}
                </p>
                <button
                  onClick={handleCreateLesson}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  {t.tutorLessonManagementPage.createNewLesson}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ✅ NEW: Show unlocked lessons first */}
            {unlockedLessons.length > 0 && (
              <div className="space-y-4">
                {searchTerm && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <LockOpen className="h-5 w-5 text-green-500" />
                    <span>{t.tutorLessonManagementPage.editableLessons}</span>
                  </h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {unlockedLessons.map((lesson) => (
                    <TutorLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={handleEditLesson}
                      onView={handleViewLesson}
                      onDelete={handleDeleteLesson}
                      onAssignStudents={handleAssignStudents}
                      onUnassignStudents={handleUnassignStudents}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ✅ NEW: Show locked lessons separately */}
            {lockedLessons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>{t.tutorLessonManagementPage.lockedLessonsSection}</span>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({lockedLessons.length})
                  </span>
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {lockedLessons.map((lesson) => (
                    <TutorLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={handleEditLesson}
                      onView={handleViewLesson}
                      onDelete={handleDeleteLesson}
                      onAssignStudents={handleAssignStudents}
                      onUnassignStudents={handleUnassignStudents}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
            toast.type === 'warning' ? 'bg-yellow-100 border border-yellow-200 text-yellow-800' :
            'bg-blue-100 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {toast.type === 'error' && <X className="h-5 w-5" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
              {toast.type === 'info' && <Info className="h-5 w-5" />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {modalMode === 'create' && t.tutorLessonManagementPage.createNewLesson}
                  {modalMode === 'edit' && t.tutorLessonManagementPage.editLesson}
                  {modalMode === 'view' && t.tutorLessonManagementPage.viewLesson}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              {modalMode !== 'view' && (
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setModalTab('info')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      modalTab === 'info'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t.tutorLessonManagementPage.lessonInfo}
                  </button>
                  <button
                    onClick={() => setModalTab('exercises')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      modalTab === 'exercises'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t.tutorLessonManagementPage.exercisesCount.replace('{count}', exercises.length.toString())}
                  </button>
                </div>
              )}

              {/* Modal Content */}
              <div className="p-6">
                {modalTab === 'info' && (
                  <div className="space-y-6">
                    {/* Lesson Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.tutorLessonManagementPage.lessonTitleRequired}
                      </label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        placeholder={t.tutorLessonManagementPage.lessonTitlePlaceholder}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.tutorLessonManagementPage.description}
                      </label>
                      <textarea
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                        placeholder={t.tutorLessonManagementPage.descriptionPlaceholder}
                        rows={3}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.tutorLessonManagementPage.lessonContent}
                      </label>
                      <textarea
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                        placeholder={t.tutorLessonManagementPage.contentPlaceholder}
                        rows={6}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Status and Student Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.tutorLessonManagementPage.status}
                        </label>
                        <select
                          value={lessonForm.status}
                          onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value as 'draft' | 'published' })}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        >
                          <option value="draft">{t.tutorLessonManagementPage.draft}</option>
                          <option value="published">{t.tutorLessonManagementPage.published}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.tutorLessonManagementPage.assignToStudents.replace('{count}', lessonForm.assignedStudentIds.length.toString())}
                        </label>
                        {studentsLoading ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t.tutorLessonManagementPage.loadingStudents}
                          </div>
                        ) : students.length === 0 ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t.tutorLessonManagementPage.noStudentsAvailable}
                          </div>
                        ) : (
                          <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                            {students.map((student) => (
                              <label key={student.student_id} className="flex items-center space-x-2 p-1">
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
                                  disabled={modalMode === 'view'}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {student.student_first_name} {student.student_last_name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'exercises' && modalMode !== 'view' && (
                  <ExerciseBuilder
                    exercises={exercises}
                    editingExercise={editingExercise}
                    onAddExercise={handleAddExercise}
                    onEditExercise={handleEditExercise}
                    onSaveExercise={handleSaveExercise}
                    onDeleteExercise={handleDeleteExercise}
                    onSetEditingExercise={setEditingExercise}
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {modalMode === 'view' ? t.tutorLessonManagementPage.close : t.tutorLessonManagementPage.cancel}
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
                        <span>{modalMode === 'create' ? t.tutorLessonManagementPage.creating : t.tutorLessonManagementPage.saving}</span>
                      </>
                    ) : (
                      <>
                        {modalMode === 'create' ? <PlusCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        <span>{modalMode === 'create' ? t.tutorLessonManagementPage.createLesson : t.tutorLessonManagementPage.saveChanges}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}