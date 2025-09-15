// src/pages/StudentLessonHistory.tsx - Historia lekcji studenta
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star,
  BookOpen,
  Zap,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LessonHistoryItem {
  id: string;
  lesson_id: string;
  completed_at: string;
  score: number;
  time_spent: number;
  lesson_title: string;
  lesson_description: string;
  tutor_name: string;
  exercises_count: number;
  exercises: Array<{
    id: string;
    exercise_type: 'ABCD' | 'Fiszki' | 'Tekstowe';
    title: string;
    question: string;
    correct_answer: string;
    options?: any;
    student_answer?: string;
    is_correct?: boolean;
  }>;
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

      // Pobierz historię lekcji
      const { data: studentLesson, error: lessonError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          lesson_id,
          completed_at,
          score,
          time_spent,
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

      // Pobierz ćwiczenia z tej lekcji
      const { data: exercises, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      if (exercisesError && exercisesError.code !== '42P01') {
        console.error('Error loading exercises:', exercisesError);
      }

      // Formatuj dane
      const historyItem: LessonHistoryItem = {
        id: studentLesson.id,
        lesson_id: studentLesson.lesson_id,
        completed_at: studentLesson.completed_at,
        score: studentLesson.score || 0,
        time_spent: studentLesson.time_spent || 0,
        lesson_title: studentLesson.lessons.title,
        lesson_description: studentLesson.lessons.description || '',
        tutor_name: `${studentLesson.lessons.users.first_name} ${studentLesson.lessons.users.last_name}`,
        exercises_count: exercises?.length || 0,
        exercises: (exercises || []).map(exercise => ({
          id: exercise.id,
          exercise_type: exercise.exercise_type === 'multiple_choice' ? 'ABCD' :
                        exercise.exercise_type === 'flashcard' ? 'Fiszki' :
                        exercise.exercise_type === 'text_answer' ? 'Tekstowe' : 'ABCD',
          title: exercise.title,
          question: exercise.question,
          correct_answer: exercise.correct_answer,
          options: exercise.options ? JSON.parse(exercise.options) : null,
          // TODO: W przyszłości można dodać zapisane odpowiedzi studenta
          student_answer: undefined,
          is_correct: undefined
        }))
      };

      setLessonHistory(historyItem);

    } catch (err: any) {
      console.error('Error loading lesson history:', err);
      setError(err.message || 'Failed to load lesson history');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson history...</p>
        </div>
      </div>
    );
  }

  if (error || !lessonHistory) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Lesson history not found'}</p>
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
            {lessonHistory.lesson_title} - History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review your completed lesson and exercises
          </p>
        </div>
      </div>

      {/* Lesson Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lesson Summary
          </h2>
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(lessonHistory.score)}`}>
              {lessonHistory.score}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(lessonHistory.time_spent / 60)}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {lessonHistory.exercises_count}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Exercises</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              <Star className="h-6 w-6 inline" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Completed: {new Date(lessonHistory.completed_at).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>Tutor: {lessonHistory.tutor_name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Exercises Review */}
      {lessonHistory.exercises.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Exercises Review ({lessonHistory.exercises.length})</span>
          </h2>

          <div className="space-y-4">
            {lessonHistory.exercises.map((exercise, index) => (
              <div key={exercise.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {exercise.exercise_type === 'ABCD' ? '📝' :
                       exercise.exercise_type === 'Fiszki' ? '🃏' : '✍️'} 
                      Exercise {index + 1}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      {exercise.exercise_type}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedExercise(selectedExercise === index ? null : index)}
                    className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{selectedExercise === index ? 'Hide' : 'View'} Details</span>
                  </button>
                </div>

                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {exercise.title}
                </h4>

                {selectedExercise === index && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Question:
                        </label>
                        <p className="text-gray-900 dark:text-white">{exercise.question}</p>
                      </div>

                      {exercise.exercise_type === 'ABCD' && exercise.options && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Options:
                          </label>
                          <div className="space-y-2">
                            {Array.isArray(exercise.options) && exercise.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span className="text-gray-900 dark:text-white">{option}</span>
                                {String.fromCharCode(65 + optIndex) === exercise.correct_answer && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {exercise.exercise_type === 'Fiszki' && exercise.options && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Flashcards:
                          </label>
                          <div className="space-y-2">
                            {Array.isArray(exercise.options) ? exercise.options.map((card, cardIndex) => (
                              <div key={cardIndex} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="font-medium text-blue-900 dark:text-blue-300">
                                  Front: {card.front}
                                </div>
                                <div className="text-blue-700 dark:text-blue-400">
                                  Back: {card.back}
                                </div>
                              </div>
                            )) : (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="font-medium text-blue-900 dark:text-blue-300">
                                  Front: {exercise.question}
                                </div>
                                <div className="text-blue-700 dark:text-blue-400">
                                  Back: {exercise.correct_answer}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {exercise.exercise_type === 'Tekstowe' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expected Answer:
                          </label>
                          <p className="text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-3 rounded">
                            {exercise.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate(`/student/lessons/${lessonId}`)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Review Lesson Again</span>
        </button>
        
        <button
          onClick={() => navigate('/student/lessons')}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <BookOpen className="h-5 w-5" />
          <span>Back to All Lessons</span>
        </button>
      </div>
    </div>
  );
}