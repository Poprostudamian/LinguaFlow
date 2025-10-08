// src/pages/StudentLessonViewer.tsx - COMPLETE FIX WITH INTERACTIVE EXERCISES

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
  Star,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ExerciseViewer } from '../components/ExerciseViewer';

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
  options?: string[] | any;
  explanation?: string;
  order_number: number;
  points: number;
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
  const [startTime] = useState<number>(Date.now());

  const hasExercises = exercises.length > 0;

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

      // ✅ Parse exercises and convert types
      const parsedExercises = (exercisesData || []).map(ex => ({
        ...ex,
        // Convert database types to ExerciseViewer types
        exercise_type: ex.exercise_type === 'multiple_choice' ? 'ABCD' :
                      ex.exercise_type === 'flashcard' ? 'Fiszki' :
                      ex.exercise_type === 'text_answer' ? 'Tekstowe' : 'ABCD',
        // Parse options if string
        options: ex.options ? (typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options) : null
      }));

      setExercises(parsedExercises);

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
      
      // Automatically switch to exercises tab if available
      if (exercises.length > 0) {
        setActiveTab('exercises');
      }
    } catch (err) {
      console.error('Error starting lesson:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // ✅ NOWY HANDLER - Called when exercises are completed
  const handleCompleteExercises = async (score: number, timeSpent: number) => {
    if (!lessonId || !session?.user?.id || !lesson) return;

    try {
      const totalTimeSpent = lesson.student_lesson.time_spent + timeSpent;

      await supabase
        .from('student_lessons')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          time_spent: totalTimeSpent,
          score: score
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      await loadLessonData();
    } catch (err) {
      console.error('Error completing exercises:', err);
    }
  };

  // ✅ NOWY HANDLER - Called when student progresses through exercises
  const handleExerciseProgress = (current: number, total: number) => {
    if (!lessonId || !session?.user?.id) return;

    // Calculate progress based on exercise completion
    const exerciseProgress = Math.round((current / total) * 60);
    const totalProgress = 30 + exerciseProgress; // 30% for reading, 60% for exercises

    supabase
      .from('student_lessons')
      .update({
        progress: Math.min(totalProgress, 90) // Max 90% until fully complete
      })
      .eq('lesson_id', lessonId)
      .eq('student_id', session.user.id)
      .then(() => {
        // Optionally refresh lesson data
      })
      .catch(console.error);
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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Progress
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {student_lesson.progress}%
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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

      {/* Start Lesson Button */}
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
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </div>
            </div>
          )}

          {/* ✅ NAPRAWIONE - Using ExerciseViewer component */}
          {activeTab === 'exercises' && hasExercises && (
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
  lessonId={lessonId}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}