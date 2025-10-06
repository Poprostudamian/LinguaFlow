// src/pages/StudentLessonViewer.tsx - ULEPSZONA WERSJA 2.0

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
  Zap,
  RefreshCw,
  AlertCircle,
  Trophy,
  Target,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, updateStudentLessonProgress } from '../lib/supabase';
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

const getLessonDetails = async (lessonId: string, studentId: string): Promise<LessonDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        id, student_id, lesson_id, assigned_at, started_at, completed_at,
        status, score, time_spent, progress,
        lessons!inner (
          id, title, description, content, status, created_at, updated_at, tutor_id,
          users!lessons_tutor_id_fkey (id, first_name, last_name, email)
        )
      `)
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;

    return {
      id: data.lessons.id,
      title: data.lessons.title,
      description: data.lessons.description || '',
      content: data.lessons.content || 'No content available.',
      created_at: data.lessons.created_at,
      tutor: {
        first_name: data.lessons.users.first_name,
        last_name: data.lessons.users.last_name,
        email: data.lessons.users.email
      },
      student_lesson: {
        status: data.status,
        progress: data.progress || 0,
        score: data.score,
        time_spent: data.time_spent || 0,
        started_at: data.started_at,
        completed_at: data.completed_at
      }
    };
  } catch (error) {
    console.error('Error getting lesson details:', error);
    throw error;
  }
};

const getLessonExercises = async (lessonId: string): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_number', { ascending: true });

    if (error) return [];

    return (data || []).map(exercise => ({
      ...exercise,
      exercise_type: exercise.exercise_type === 'multiple_choice' ? 'ABCD' :
                    exercise.exercise_type === 'flashcard' ? 'Fiszki' :
                    exercise.exercise_type === 'text_answer' ? 'Tekstowe' : 'ABCD',
      options: exercise.options ? JSON.parse(exercise.options) : null
    }));
  } catch (error) {
    return [];
  }
};

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

      const lessonData = await getLessonDetails(lessonId, session.user.id);
      if (!lessonData) {
        setError('Lesson not found or not assigned to you');
        return;
      }

      setLesson(lessonData);

      const exercisesData = await getLessonExercises(lessonId);
      setExercises(exercisesData);

      if (exercisesData.length > 0 && lessonData.student_lesson.status !== 'assigned') {
        setActiveTab('exercises');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsStarting(true);
      await updateStudentLessonProgress(session.user.id, lessonId, 10, 'in_progress');
      await loadLessonData();
      if (exercises.length > 0) setActiveTab('exercises');
    } catch (err: any) {
      setError('Failed to start lesson');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteExercises = async (score: number, timeSpent: number) => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsCompleting(true);
      await updateStudentLessonProgress(session.user.id, lessonId, 100, 'completed', score, timeSpent);
      await loadLessonData();
    } catch (err: any) {
      setError('Failed to complete exercises');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-6">{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate('/student/lessons')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const { student_lesson } = lesson;
  const hasExercises = exercises.length > 0;

  // Status configuration
  const statusConfig = {
    assigned: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      label: 'Not Started'
    },
    in_progress: {
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      label: 'In Progress'
    },
    completed: {
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      label: 'Completed'
    }
  };

  const config = statusConfig[student_lesson.status];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative p-8">
          <button
            onClick={() => navigate('/student/lessons')}
            className="mb-4 flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Lessons</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-3">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-purple-100 text-lg mb-6 max-w-3xl">
                  {lesson.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>
                    {student_lesson.time_spent > 0 
                      ? `${Math.round(student_lesson.time_spent / 60)} min spent`
                      : 'Not started'}
                  </span>
                </div>

                {hasExercises && (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>{exercises.length} exercises</span>
                  </div>
                )}

                {student_lesson.score !== null && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span className="font-bold">{student_lesson.score}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end space-y-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${config.bgColor} ${config.textColor} border-2 border-white/20`}>
                {config.label}
              </span>
              
              {student_lesson.progress > 0 && (
                <div className="text-right">
                  <div className="text-white/90 text-sm mb-1">Progress</div>
                  <div className="text-2xl font-bold text-white">{student_lesson.progress}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {student_lesson.progress > 0 && (
            <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${student_lesson.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 font-semibold text-sm transition-all relative ${
                activeTab === 'content'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {activeTab === 'content' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />
              )}
              <FileText className="h-5 w-5" />
              <span>Lesson Content</span>
            </button>

            {hasExercises && (
              <button
                onClick={() => setActiveTab('exercises')}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 font-semibold text-sm transition-all relative ${
                  activeTab === 'exercises'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {activeTab === 'exercises' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />
                )}
                <Zap className="h-5 w-5" />
                <span>Exercises ({exercises.length})</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-8">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              {/* Lesson Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-8 border-t border-gray-200 dark:border-gray-700">
                {student_lesson.status === 'assigned' && (
                  <button
                    onClick={handleStartLesson}
                    disabled={isStarting}
                    className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    ) : (
                      <PlayCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    )}
                    <span>{isStarting ? 'Starting Lesson...' : 'Start Lesson'}</span>
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </button>
                )}

                {student_lesson.status === 'in_progress' && hasExercises && (
                  <button
                    onClick={() => setActiveTab('exercises')}
                    className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
                  >
                    <Zap className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span>Start Exercises</span>
                    <Target className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  </button>
                )}

                {student_lesson.status === 'completed' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <Award className="h-16 w-16 text-green-500" />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Lesson Completed!
                        </h3>
                        <p className="text-xl text-green-600 dark:text-green-400 font-bold">
                          Score: {student_lesson.score}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div>
              {student_lesson.status === 'assigned' ? (
                <div className="text-center py-16">
                  <Target className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Start the lesson first
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                    You need to start the lesson before accessing exercises.
                  </p>
                  <button
                    onClick={() => setActiveTab('content')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    Go to Lesson Content
                  </button>
                </div>
              ) : student_lesson.status === 'completed' ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Exercises Completed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                    You've already completed all exercises for this lesson.
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-8">
                    Final Score: {student_lesson.score}%
                  </p>
                  <button
                    onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold"
                  >
                    View History
                  </button>
                </div>
              ) : (
                <ExerciseViewer
                  exercises={exercises}
                  onComplete={handleCompleteExercises}
                  onProgress={(currentIndex) => {
                    console.log('Exercise progress:', currentIndex);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}