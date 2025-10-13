// src/pages/StudentLessonHistory.tsx - MODERN LESSON HISTORY

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
    // NEW FIELDS for student answers:
    student_answer: string | null;
    is_correct: boolean;
    submitted_at: string | null;
  }[];
}

export function YourPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      {/* Zamień hardcoded teksty na t.section.key */}
      <h1>{t.studentDashboard.title}</h1>
      <p>{t.studentDashboard.welcome}</p>
      <button>{t.common.save}</button>
    </div>
  );
}

export function StudentLessonHistory() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  useEffect(() => {
    if (lessonId && session?.user?.id) {
      loadLessonHistory();
    }
  }, [lessonId, session?.user?.id]);

  const loadLessonHistory = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get lesson history
      const { data: studentLesson, error: lessonError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          lesson_id,
          completed_at,
          score,
          time_spent,
          progress,
          lessons!inner (
            id,
            title,
            description,
            users!lessons_tutor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id)
        .eq('status', 'completed')
        .single();

      if (lessonError) throw lessonError;

      if (!studentLesson) {
        setError('Lesson history not found or lesson not completed yet');
        return;
      }

      // Get exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      if (exercisesError && exercisesError.code !== '42P01') {
        console.error('Error loading exercises:', exercisesError);
      }

      // Get student's answers - THIS IS THE KEY PART!
      const { data: studentAnswers, error: answersError } = await supabase
        .from('student_exercise_answers')
        .select('*')
        .eq('student_id', session.user.id)
        .in('exercise_id', (exercises || []).map(ex => ex.id));

      if (answersError) {
        console.error('Error loading student answers:', answersError);
      }

      console.log('📊 Student answers loaded:', studentAnswers);

      // Create a map of exercise_id -> student answer
      const answersMap = new Map();
      (studentAnswers || []).forEach(answer => {
        answersMap.set(answer.exercise_id, {
          answer: answer.answer,
          is_correct: answer.is_correct,
          submitted_at: answer.submitted_at
        });
      });

      const historyItem: LessonHistoryItem = {
        id: studentLesson.id,
        lesson_id: studentLesson.lesson_id,
        completed_at: studentLesson.completed_at,
        score: studentLesson.score || 0,
        time_spent: studentLesson.time_spent || 0,
        progress: studentLesson.progress || 100,
        lesson_title: studentLesson.lessons.title,
        lesson_description: studentLesson.lessons.description || '',
        tutor_name: `${studentLesson.lessons.users.first_name} ${studentLesson.lessons.users.last_name}`,
        exercises_count: exercises?.length || 0,
        exercises: (exercises || []).map(exercise => {
          const studentAnswer = answersMap.get(exercise.id);
          
          return {
            id: exercise.id,
            exercise_type: exercise.exercise_type,
            title: exercise.title,
            question: exercise.question,
            correct_answer: exercise.correct_answer,
            options: exercise.options ? (typeof exercise.options === 'string' ? JSON.parse(exercise.options) : exercise.options) : null,
            explanation: exercise.explanation,
            points: exercise.points,
            // Add student's answer data
            student_answer: studentAnswer?.answer || null,
            is_correct: studentAnswer?.is_correct || false,
            submitted_at: studentAnswer?.submitted_at || null
          };
        })
      };

      setLessonHistory(historyItem);

    } catch (err: any) {
      console.error('Error loading lesson history:', err);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson history...</p>
        </div>
      </div>
    );
  }

  if (error || !lessonHistory) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Lesson history not found'}</p>
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
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {lessonHistory.lesson_title}
            </h1>
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review your performance and lesson details
          </p>
        </div>
      </div>

      {/* Completion Banner */}
      <div className={`bg-gradient-to-r ${getScoreColor(lessonHistory.score)} rounded-2xl p-8 text-white shadow-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <Award className="h-16 w-16" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {getScoreLabel(lessonHistory.score)}
              </h2>
              <p className="text-white/90 text-lg">
                Completed on {formatDate(lessonHistory.completed_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold mb-2">{lessonHistory.score}%</div>
            <p className="text-white/90">Final Score</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Final Score
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {lessonHistory.score}%
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Time Spent
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatDuration(lessonHistory.time_spent)}
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Exercises
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {lessonHistory.exercises_count}
              </p>
            </div>
            <div className="bg-green-200 dark:bg-green-900/40 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                Progress
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {lessonHistory.progress}%
              </p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-900/40 p-3 rounded-lg">
              <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Lesson Information
          </h2>
        </div>

        <div className="space-y-4">
          {lessonHistory.lesson_description && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Description
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {lessonHistory.lesson_description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tutor
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {lessonHistory.tutor_name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(lessonHistory.completed_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

     {/* Exercises Review */}
      {lessonHistory.exercises_count > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Exercises Review
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {lessonHistory.exercises_count} exercise{lessonHistory.exercises_count !== 1 ? 's' : ''} completed
              </p>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Exercise Results
            </h2>
            
            {lessonHistory.exercises.map((exercise, idx) => (
              <div
                key={exercise.id}
                className={`
                  p-6 rounded-xl border-2 transition-all
                  ${exercise.is_correct 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }
                `}
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {exercise.is_correct ? (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Exercise {idx + 1}: {exercise.title}
                      </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 ml-9">
                      {exercise.question}
                    </p>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                    {exercise.points} {exercise.points === 1 ? 'point' : 'points'}
                  </div>
                </div>

                {/* Answer Details */}
                <div className="ml-9 space-y-3">
                  {/* Multiple Choice */}
                  {exercise.exercise_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Your answer:</span>
                        <span className={`
                          font-semibold px-3 py-1 rounded-lg
                          ${exercise.is_correct 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }
                        `}>
                          {exercise.student_answer || 'No answer'}
                        </span>
                      </div>
                      
                      {!exercise.is_correct && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Correct answer:</span>
                          <span className="font-semibold px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {exercise.correct_answer}
                          </span>
                        </div>
                      )}

                      {/* Show all options */}
                      {exercise.options && Array.isArray(exercise.options) && (
                        <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">All options:</p>
                          <div className="space-y-1">
                            {(exercise.options as string[]).map((option, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isUserAnswer = exercise.student_answer === letter;
                              const isCorrectAnswer = exercise.correct_answer === letter;
                              
                              return (
                                <div 
                                  key={optIdx}
                                  className={`
                                    flex items-center space-x-2 p-2 rounded text-sm
                                    ${isCorrectAnswer ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : ''}
                                    ${isUserAnswer && !isCorrectAnswer ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}
                                  `}
                                >
                                  <span className={`
                                    font-bold w-6 text-center
                                    ${isCorrectAnswer ? 'text-green-600 dark:text-green-400' : ''}
                                    ${isUserAnswer && !isCorrectAnswer ? 'text-red-600 dark:text-red-400' : ''}
                                    ${!isUserAnswer && !isCorrectAnswer ? 'text-gray-500 dark:text-gray-400' : ''}
                                  `}>
                                    {letter}.
                                  </span>
                                  <span className="flex-1 text-gray-700 dark:text-gray-300">
                                    {option}
                                  </span>
                                  {isCorrectAnswer && (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Answer */}
                  {exercise.exercise_type === 'text_answer' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your answer:</p>
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-gray-900 dark:text-white">
                          {exercise.student_answer || 'No answer provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        This answer is pending review by your tutor
                      </p>
                    </div>
                  </div>
                )}

                  {/* Flashcard */}
                  {exercise.exercise_type === 'flashcard' && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Flashcards learned:</p>
                        <div className="space-y-2">
                          {Array.isArray(exercise.options) && 
                            (exercise.options as { front: string; back: string }[]).map((card, cardIdx) => (
                              <div key={cardIdx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="font-medium text-gray-900 dark:text-white mb-1">
                                  {card.front}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm">
                                  {card.back}
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      
                      {exercise.student_answer && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your summary:</p>
                          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                            <p className="text-gray-900 dark:text-white">
                              {exercise.student_answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {exercise.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Explanation:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-400">
                            {exercise.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
              Want to review the lesson content?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Go back to the lesson viewer to review materials
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