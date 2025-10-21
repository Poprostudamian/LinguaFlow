// src/pages/StudentLessonViewer.tsx - Simplified without translations to test

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
  RefreshCw,
  Calendar,
  ChevronRight,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, saveStudentExerciseAnswers } from '../lib/supabase';
import { InteractiveExerciseViewer } from '../components/InteractiveExerciseViewer';

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
  options?: string[] | { front: string; back: string }[] | null;
  explanation?: string;
}

export function StudentLessonViewer() {
  console.log('🎯 StudentLessonViewer mounted');
  
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 Component state:', { lessonId, userId: session?.user?.id, isLoading, error });

  useEffect(() => {
    console.log('🎯 useEffect called');
    if (lessonId && session?.user?.id) {
      fetchLessonDetails();
    }
  }, [lessonId, session?.user?.id]);

  const fetchLessonDetails = async () => {
    console.log('🎯 fetchLessonDetails starting...');
    try {
      setIsLoading(true);
      setError(null);

      // Fetch lesson with tutor info
      console.log('🎯 Fetching lesson data...');
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutor_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('🎯 Lesson error:', lessonError);
        throw lessonError;
      }
      console.log('🎯 Lesson data:', lessonData);

      // Fetch student_lesson relationship
      console.log('🎯 Fetching student lesson relationship...');
      const { data: studentLessonData, error: studentLessonError } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', session?.user?.id)
        .single();

      if (studentLessonError) {
        console.error('🎯 Student lesson error:', studentLessonError);
        throw studentLessonError;
      }
      console.log('🎯 Student lesson data:', studentLessonData);

      // Fetch exercises
      console.log('🎯 Fetching exercises...');
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number', { ascending: true });

      if (exercisesError) {
        console.error('🎯 Exercises error:', exercisesError);
        throw exercisesError;
      }
      console.log('🎯 Exercises data:', exercisesData);

      setLesson({
        ...lessonData,
        tutor: lessonData.tutor,
        student_lesson: studentLessonData,
      });
      setExercises(exercisesData || []);
      console.log('🎯 State updated successfully');
    } catch (err: any) {
      console.error('🎯 Error fetching lesson details:', err);
      setError('Failed to load lesson details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!lessonId || !session?.user?.id) return;

    setIsStarting(true);
    try {
      const { error: updateError } = await supabase
        .from('student_lessons')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      if (updateError) throw updateError;

      // Refresh lesson details
      await fetchLessonDetails();
    } catch (err: any) {
      console.error('Error starting lesson:', err);
      setError('Failed to start lesson. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleExercisesComplete = async (results: any[]) => {
    if (!lessonId || !session?.user?.id) return;

    setIsCompleting(true);
    try {
      console.log('📝 Starting lesson completion...', {
        lessonId,
        studentId: session.user.id,
        resultsCount: results.length
      });

      // Save answers
      await saveStudentExerciseAnswers(
        session.user.id,
        lessonId,
        results
      );

      console.log('✅ Answers saved successfully');

      // Calculate score
      const correctCount = results.filter(r => r.is_correct).length;
      const totalCount = results.length;
      const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

      // Calculate time spent (in seconds)
      const timeSpent = lesson?.student_lesson?.started_at
        ? Math.floor((Date.now() - new Date(lesson.student_lesson.started_at).getTime()) / 1000)
        : 0;

      console.log('📊 Calculated results:', { score, timeSpent, correctCount, totalCount });

      // Update student_lesson with completion data
      const { error: updateError } = await supabase
        .from('student_lessons')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          score: score,
          time_spent: timeSpent,
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      if (updateError) {
        console.error('❌ Error updating lesson status:', updateError);
        throw updateError;
      }

      console.log('✅ Lesson marked as completed');

      // Refresh lesson details to show completion
      await fetchLessonDetails();
      
    } catch (err: any) {
      console.error('❌ Error completing lesson:', err);
      setError('Failed to complete lesson. Please try again.');
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

  // Loading state
  if (isLoading) {
    console.log('🎯 Rendering loading state');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading lesson...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    console.log('🎯 Rendering error state:', { error, hasLesson: !!lesson });
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
            Error
          </h3>
          <p className="text-red-600 dark:text-red-300">
            {error || 'Lesson not found'}
          </p>
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

  console.log('🎯 Rendering main content:', { status: student_lesson.status });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/student/lessons')}
          className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {lesson.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>
                {lesson.tutor.first_name} {lesson.tutor.last_name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lesson.created_at)}</span>
            </div>
            {exercises.length > 0 && (
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>
                  {exercises.length} exercises
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-4 py-2 rounded-xl font-medium
          ${student_lesson.status === 'assigned' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}
          ${student_lesson.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
          ${student_lesson.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
        `}>
          {student_lesson.status === 'assigned' && 'Not Started'}
          {student_lesson.status === 'in_progress' && 'In Progress'}
          {student_lesson.status === 'completed' && 'Completed'}
        </div>
      </div>

      {/* Start Lesson Card - only for assigned */}
      {student_lesson.status === 'assigned' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-xl">
                <PlayCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Ready to start this lesson?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Begin your learning journey now
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

      {/* Progress Stats - for in_progress lessons */}
      {student_lesson.status === 'in_progress' && student_lesson.started_at && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {student_lesson.progress}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(student_lesson.time_spent)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time Spent
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatDate(student_lesson.started_at)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Started on
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lesson Content
          </h2>
        </div>
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      </div>

      {/* Interactive Exercises Section */}
      {student_lesson.status !== 'assigned' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Interactive Exercises
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete all exercises to finish the lesson
              </p>
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No exercises available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This lesson doesn't have any exercises yet
              </p>
            </div>
          ) : (
            <div>
              {student_lesson.status === 'completed' ? (
                // Completed lesson - show message and history button
                <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <Award className="h-16 w-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Lesson Completed!
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    You've already completed this lesson with a score of{' '}
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {student_lesson.score}%
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    View your detailed results and answers in the lesson history
                  </p>
                  <button
                    onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center space-x-2 mx-auto"
                  >
                    <Clock className="h-5 w-5" />
                    <span>View History & Results</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // In progress - show interactive exercises
                <InteractiveExerciseViewer 
                  exercises={exercises}
                  onComplete={handleExercisesComplete}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}