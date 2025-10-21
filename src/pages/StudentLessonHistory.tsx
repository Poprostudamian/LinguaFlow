// src/pages/StudentLessonHistory.tsx - Fixed with better error handling and debugging

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star,
  BookOpen,
  Eye,
  Award,
  Target,
  TrendingUp,
  Zap,
  User,
  FileText,
  XCircle,  
  Lightbulb,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface LessonHistoryItem {
  id: string;
  lesson_id: string;
  completed_at: string;
  score: number;
  time_spent: number;
  progress: number;
  lesson_title: string;
  lesson_description: string;
  tutor_name: string;
  exercises_count: number;
  exercises: {
    id: string;
    exercise_type: string;
    title: string;
    question: string;
    correct_answer: string;
    options?: string[] | { front: string; back: string }[] | null;
    explanation?: string;
    points: number;
    student_answer: string | null;
    is_correct: boolean;
    submitted_at: string | null;
    tutor_score?: number | null;
    tutor_feedback?: string | null;
    graded_by?: string | null;
    graded_at?: string | null;
  }[];
}

export function StudentLessonHistory() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 StudentLessonHistory mounted with:', { lessonId, userId: session?.user?.id });
    if (lessonId && session?.user?.id) {
      loadLessonHistory();
    } else {
      setError('Missing lesson ID or user session');
      setIsLoading(false);
    }
  }, [lessonId, session?.user?.id]);

  const loadLessonHistory = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📖 Loading lesson history for:', { lessonId, studentId: session.user.id });

      // ✅ FIXED: First check if student_lesson exists at all (any status)
      const { data: studentLessonCheck, error: checkError } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      if (checkError) {
        console.error('❌ Error checking student lesson:', checkError);
        throw checkError;
      }

      console.log('🎯 Student lesson check result:', studentLessonCheck);

      if (!studentLessonCheck || studentLessonCheck.length === 0) {
        setError('This lesson is not assigned to you or does not exist.');
        return;
      }

      const studentLessonData = studentLessonCheck[0];

      // Get lesson details with tutor info
      const { data: lessonDetails, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          users:tutor_id (
            first_name,
            last_name
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('❌ Error fetching lesson details:', lessonError);
        throw lessonError;
      }

      console.log('📚 Lesson details:', lessonDetails);

      // Get exercises for this lesson
      const { data: exercises, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
  .eq('lesson_id', lessonId)
  .order('order_number');

      if (exercisesError) {
        console.error('❌ Error fetching exercises:', exercisesError);
        throw exercisesError;
      }

      console.log('🏃‍♂️ Exercises found:', exercises);

      // Get student answers for these exercises
      const exerciseIds = exercises.map(ex => ex.id);
      const { data: studentAnswers, error: answersError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('student_id', session.user.id)
        .in('exercise_id', exerciseIds);

      if (answersError) {
        console.error('❌ Error fetching student answers:', answersError);
        throw answersError;
      }

      console.log('✏️ Student answers found:', studentAnswers);

      // Create a map of exercise_id -> student_answer for easier lookup
      const answersMap = new Map();
      studentAnswers.forEach(answer => {
        answersMap.set(answer.exercise_id, {
          answer: answer.answer,
          is_correct: answer.is_correct,
          submitted_at: answer.submitted_at,
          tutor_score: answer.tutor_score,
          tutor_feedback: answer.tutor_feedback,
          graded_by: answer.graded_by,
          graded_at: answer.graded_at
        });
      });

      const historyItem: LessonHistoryItem = {
        id: studentLessonData.id,
        lesson_id: studentLessonData.lesson_id,
        completed_at: studentLessonData.completed_at || studentLessonData.updated_at || studentLessonData.assigned_at,
        score: studentLessonData.score || 0,
        time_spent: studentLessonData.time_spent || 0,
        progress: studentLessonData.progress || 0,
        lesson_title: lessonDetails.title,
        lesson_description: lessonDetails.description || '',
        tutor_name: `${lessonDetails.users.first_name} ${lessonDetails.users.last_name}`,
        exercises_count: exercises.length,
        exercises: exercises.map(exercise => {
          const studentAnswer = answersMap.get(exercise.id);
          
          return {
            id: exercise.id,
            exercise_type: exercise.exercise_type,
            title: exercise.title,
            question: exercise.question,
            correct_answer: exercise.correct_answer,
            options: exercise.options ? 
              (typeof exercise.options === 'string' ? JSON.parse(exercise.options) : exercise.options) : null,
            explanation: exercise.explanation,
            points: exercise.points || 1,
            student_answer: studentAnswer?.answer || null,
            is_correct: studentAnswer?.is_correct || false,
            submitted_at: studentAnswer?.submitted_at || null,
            tutor_score: studentAnswer?.tutor_score || null,
            tutor_feedback: studentAnswer?.tutor_feedback || null,
            graded_by: studentAnswer?.graded_by || null,
            graded_at: studentAnswer?.graded_at || null
          };
        })
      };

      console.log('✅ Final lesson history:', historyItem);
      setLessonHistory(historyItem);

    } catch (err: any) {
      console.error('❌ Error loading lesson history:', err);
      setError(err.message || 'Failed to load lesson history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 70) return 'Good Job!';
    return 'Keep Practicing!';
  };

  const renderExerciseOptions = (exercise: any) => {
    if (!exercise.options) return null;

    if (exercise.exercise_type === 'flashcard') {
      return (
        <div className="space-y-2">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Front:</p>
            <p className="text-gray-900 dark:text-white">{exercise.options.front}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Back:</p>
            <p className="text-gray-900 dark:text-white">{exercise.options.back}</p>
          </div>
        </div>
      );
    }

    if (Array.isArray(exercise.options)) {
      return (
        <div className="space-y-2">
          {exercise.options.map((option: string, index: number) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                option === exercise.correct_answer 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : option === exercise.student_answer && exercise.student_answer !== exercise.correct_answer
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                {option === exercise.correct_answer && (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                {option === exercise.student_answer && exercise.student_answer !== exercise.correct_answer && (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className={`${
                  option === exercise.correct_answer 
                    ? 'text-green-800 dark:text-green-300 font-medium' 
                    : option === exercise.student_answer && exercise.student_answer !== exercise.correct_answer
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lessonHistory) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Lesson History</h3>
          </div>
          
          <p className="text-red-600 dark:text-red-300 mb-4">
            {error || 'Lesson history not found'}
          </p>
          
          <div className="space-y-2 text-sm text-red-600 dark:text-red-300">
            <p><strong>Debug Info:</strong></p>
            <p>• Lesson ID: {lessonId || 'Missing'}</p>
            <p>• User ID: {session?.user?.id || 'Missing'}</p>
            <p>• User Role: {session?.user?.role || 'Missing'}</p>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => navigate('/student/lessons')}
              className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition"
            >
              ← Back to Lessons
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student/lessons')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Lessons</span>
        </button>
      </div>

      {/* Lesson Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{lessonHistory.lesson_title}</h1>
              <p className="text-purple-100 mb-4">{lessonHistory.lesson_description}</p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Tutor: {lessonHistory.tutor_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Completed: {formatDate(lessonHistory.completed_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Time: {formatDuration(lessonHistory.time_spent)}</span>
                </div>
              </div>
            </div>
            
            {/* Score Badge */}
            <div className="text-center">
              <div className={`bg-gradient-to-r ${getScoreColor(lessonHistory.score)} rounded-full p-4 mb-2`}>
                <Award className="h-8 w-8 text-white" />
              </div>
              <div className="text-2xl font-bold">{lessonHistory.score}%</div>
              <div className="text-sm text-purple-100">{getScoreLabel(lessonHistory.score)}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg inline-flex mb-2">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{lessonHistory.progress}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg inline-flex mb-2">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{lessonHistory.exercises_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Exercises</div>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg inline-flex mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{lessonHistory.score}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg inline-flex mb-2">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessonHistory.exercises.filter(ex => ex.is_correct).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises Section */}
      {lessonHistory.exercises.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span>Exercise Results</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {lessonHistory.exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                        Exercise {index + 1}
                      </span>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {exercise.exercise_type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {exercise.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {exercise.question}
                    </p>
                  </div>
                  
                  {/* Result Badge */}
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    exercise.is_correct 
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                  }`}>
                    {exercise.is_correct ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {exercise.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>

                {/* Exercise Options/Content */}
                {renderExerciseOptions(exercise)}

                {/* Student Answer */}
                {exercise.student_answer && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Answer:
                    </h4>
                    <p className={`font-medium ${
                      exercise.is_correct 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {exercise.student_answer}
                    </p>
                    {exercise.submitted_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Submitted: {formatDate(exercise.submitted_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Correct Answer (if wrong) */}
                {!exercise.is_correct && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                      Correct Answer:
                    </h4>
                    <p className="text-green-800 dark:text-green-400 font-medium">
                      {exercise.correct_answer}
                    </p>
                  </div>
                )}

                {/* Tutor Feedback */}
                {exercise.tutor_feedback && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                          Tutor Feedback
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          {exercise.tutor_feedback}
                        </p>
                        {exercise.tutor_score && (
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Tutor Score: {exercise.tutor_score}%
                          </p>
                        )}
                        {exercise.graded_at && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Graded: {formatDate(exercise.graded_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {exercise.explanation && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                          Explanation
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                          {exercise.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Exercises Message */}
      {lessonHistory.exercises.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Exercises Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This lesson doesn't have any exercises or they haven't been loaded yet.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Review Lesson Content
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Go back to the lesson to review the content and materials
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/student/lessons/${lessonHistory.lesson_id}`)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2"
        >
          <Eye className="h-5 w-5" />
          <span>Review Lesson</span>
        </button>
      </div>
    </div>
  );
}