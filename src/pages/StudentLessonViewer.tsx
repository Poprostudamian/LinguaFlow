// src/pages/StudentLessonViewer.tsx - MODERN LESSON VIEWER

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
  Award,
  Target,
  Calendar,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, updateStudentLessonProgress } from '../lib/supabase';

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

interface Exercise {
  id: string;
  exercise_type: string;
  title: string;
  question: string;
  correct_answer: string;
  options?: any;
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
  const [startTime, setStartTime] = useState<number>(Date.now());

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

      // Get lesson details
      const { data, error: lessonError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          status,
          progress,
          score,
          time_spent,
          started_at,
          completed_at,
          lessons!inner (
            id,
            title,
            description,
            content,
            created_at,
            users!lessons_tutor_id_fkey (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id)
        .single();

      if (lessonError) throw lessonError;

      if (!data) {
        setError('Lesson not found or not assigned to you');
        return;
      }

      const lessonData: LessonDetails = {
        id: data.lessons.id,
        title: data.lessons.title,
        description: data.lessons.description || '',
        content: data.lessons.content || 'No content available.',
        created_at: data.lessons.created_at,
        tutor: data.lessons.users,
        student_lesson: {
          status: data.status,
          progress: data.progress,
          score: data.score,
          time_spent: data.time_spent,
          started_at: data.started_at,
          completed_at: data.completed_at
        }
      };

      setLesson(lessonData);

      // Get exercises (if they exist)
      const { data: exercisesData } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      setExercises(exercisesData || []);

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
      setStartTime(Date.now());

      await supabase
        .from('student_lessons')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          progress: 10
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      await loadLessonData();
    } catch (err) {
      console.error('Error starting lesson:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lessonId || !session?.user?.id || !lesson) return;

    try {
      setIsCompleting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await supabase
        .from('student_lessons')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          time_spent: lesson.student_lesson.time_spent + timeSpent,
          score: 100 // Can be calculated from exercises
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      await loadLessonData();
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-semibold">Error</h3>
              <p className="text-red-600 dark:text-red-300">{error || 'Lesson not found'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/lessons')}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700"
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/student/lessons')}
          className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {lesson.title}
            </h1>
            {student_lesson.status === 'completed' && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
          {lesson.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Progress
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {student_lesson.progress}%
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-500"
              style={{ width: `${student_lesson.progress}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Time Spent
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatTime(student_lesson.time_spent)}
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {student_lesson.score !== null && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  Score
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {student_lesson.score}%
                </p>
              </div>
              <div className="bg-yellow-200 dark:bg-yellow-900/40 p-3 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Tutor
              </p>
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                {lesson.tutor.first_name} {lesson.tutor.last_name}
              </p>
            </div>
            <div className="bg-green-200 dark:bg-green-900/40 p-3 rounded-lg">
              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {student_lesson.status === 'assigned' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-xl">
                <PlayCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Ready to start learning?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Begin this lesson and track your progress
                </p>
              </div>
            </div>
            <button
              onClick={handleStartLesson}
              disabled={isStarting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  <span>Start Lesson</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {student_lesson.status === 'in_progress' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Complete this lesson
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Mark as completed when you're done
                </p>
              </div>
            </div>
            <button
              onClick={handleCompleteLesson}
              disabled={isCompleting}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCompleting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Lesson</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Lesson Content</span>
            </div>
          </button>
          
          {hasExercises && (
            <button
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'exercises'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Exercises ({exercises.length})</span>
              </div>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'content' && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
                    Lesson Material
                  </h2>
                </div>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {lesson.content}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exercises' && hasExercises && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Practice Exercises
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-purple-100 dark:bg-purple-900/40 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {exercise.title}
                          </h3>
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                            {exercise.exercise_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {exercise.question}
                    </p>
                    {exercise.options && (
                      <div className="space-y-2">
                        {JSON.parse(exercise.options).map((option: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View History Button for Completed Lessons */}
      {student_lesson.status === 'completed' && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
            className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
          >
            <Clock className="h-5 w-5" />
            <span>View Lesson History</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}