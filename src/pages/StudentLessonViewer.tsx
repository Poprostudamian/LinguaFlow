// src/pages/StudentLessonViewer.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle, 
  PlayCircle,
  FileText,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLessonDetails, getLessonExercises, updateStudentLessonProgress } from '../lib/supabase';
import { ExerciseViewer, Exercise } from '../components/ExerciseViewer';

interface LessonDetails {
  id: string;
  title: string;
  description: string;
  content: string;
  created_at: string;
  tutor: {
    first_name: string;
    last_name: string;
    email: string;
  };
  student_lesson: {
    status: 'assigned' | 'in_progress' | 'completed';
    progress: number;
    score: number | null;
    time_spent: number;
    started_at: string | null;
    completed_at: string | null;
  };
}

export function StudentLessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'exercises'>('content');
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (lessonId && session?.user?.id) {
      loadLessonData();
    }
  }, [lessonId, session?.user?.id]);

  const loadLessonData = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Pobierz szczegóły lekcji
      const lessonData = await getLessonDetails(lessonId, session.user.id);
      if (!lessonData) {
        setError('Lesson not found or not assigned to you');
        return;
      }

      setLesson(lessonData);

      // Pobierz ćwiczenia
      const exercisesData = await getLessonExercises(lessonId);
      setExercises(exercisesData);

      // Jeśli są ćwiczenia i lekcja jest w trakcie/ukończona, pokaż ćwiczenia
      if (exercisesData.length > 0 && lessonData.student_lesson.status !== 'assigned') {
        setActiveTab('exercises');
      }

    } catch (err: any) {
      console.error('Error loading lesson:', err);
      setError(err.message || 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsStarting(true);
      
      // Aktualizuj status na "in_progress"
      await updateStudentLessonProgress(
        session.user.id,
        lessonId,
        10, // 10% progress na start
        'in_progress'
      );

      // Odśwież dane
      await loadLessonData();
      
      // Przejdź do ćwiczeń jeśli są dostępne
      if (exercises.length > 0) {
        setActiveTab('exercises');
      }

    } catch (err: any) {
      console.error('Error starting lesson:', err);
      setError('Failed to start lesson');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteExercises = async (score: number, timeSpent: number) => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsCompleting(true);

      // Aktualizuj progress i oznacz jako ukończone
      await updateStudentLessonProgress(
        session.user.id,
        lessonId,
        100,
        'completed',
        score,
        timeSpent
      );

      // Odśwież dane
      await loadLessonData();

    } catch (err: any) {
      console.error('Error completing exercises:', err);
      setError('Failed to complete exercises');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExerciseProgress = (current: number, total: number) => {
    if (!lessonId || !session?.user?.id) return;

    // Aktualizuj progress w czasie rzeczywistym (30% + 60% za ćwiczenia)
    const exerciseProgress = Math.round((current / total) * 60);
    const totalProgress = 30 + exerciseProgress; // 30% za rozpoczęcie + 60% za ćwiczenia + 10% za ukończenie

    updateStudentLessonProgress(
      session.user.id,
      lessonId,
      Math.min(totalProgress, 90) // Max 90% podczas robienia ćwiczeń
    ).catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate('/student/lessons')}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const { student_lesson } = lesson;
  const hasExercises = exercises.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/student/lessons')}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lesson.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lesson.description}
          </p>
        </div>
      </div>

      {/* Lesson metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>
                {student_lesson.time_spent > 0 
                  ? `${Math.round(student_lesson.time_spent / 60)} min spent`
                  : 'Not started'
                }
              </span>
            </div>

            {hasExercises && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4" />
                <span>{exercises.length} exercises</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Status */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              student_lesson.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : student_lesson.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {student_lesson.status === 'assigned' ? 'Not Started' : 
               student_lesson.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </span>

            {/* Score */}
            {student_lesson.score !== null && (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {student_lesson.score}%
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {student_lesson.progress > 0 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                student_lesson.status === 'completed' 
                  ? 'bg-green-500' 
                  : 'bg-purple-600'
              }`}
              style={{ width: `${student_lesson.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Lesson Content</span>
              </div>
            </button>

            {hasExercises && (
              <button
                onClick={() => setActiveTab('exercises')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exercises'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Exercises ({exercises.length})</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                  className="text-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-center pt-6">
                {student_lesson.status === 'assigned' && (
                  <button
                    onClick={handleStartLesson}
                    disabled={isStarting}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <PlayCircle className="h-5 w-5" />
                    )}
                    <span>{isStarting ? 'Starting...' : 'Start Lesson'}</span>
                  </button>
                )}

                {student_lesson.status === 'in_progress' && hasExercises && (
                  <button
                    onClick={() => setActiveTab('exercises')}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Zap className="h-5 w-5" />
                    <span>Start Exercises</span>
                  </button>
                )}

                {student_lesson.status === 'completed' && (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      Lesson completed! Score: {student_lesson.score}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div>
              {student_lesson.status === 'assigned' ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Start the lesson first
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You need to start the lesson before accessing exercises.
                  </p>
                  <button
                    onClick={() => setActiveTab('content')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Go to Lesson Content
                  </button>
                </div>
              ) : student_lesson.status === 'completed' ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Exercises Completed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    You've already completed all exercises for this lesson.
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    Final Score: {student_lesson.score}%
                  </p>
                </div>
              ) : (
                <ExerciseViewer
                  exercises={exercises}
                  onComplete={handleCompleteExercises}
                  onProgress={handleExerciseProgress}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}