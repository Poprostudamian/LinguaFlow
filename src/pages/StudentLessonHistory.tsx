// src/pages/StudentLessonHistory.tsx - ULEPSZONA WERSJA 2.0

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
  RotateCcw,
  Trophy,
  Target,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles
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
  }>;
}

export function StudentLessonHistory() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());

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

      const { data: studentLesson, error: lessonError } = await supabase
        .from('student_lessons')
        .select(`
          id, lesson_id, completed_at, score, time_spent,
          lessons!inner (
            id, title, description,
            users!lessons_tutor_id_fkey (first_name, last_name)
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

      const { data: exercises } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

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
                        exercise.exercise_type === 'flashcard' ? 'Fiszki' : 'Tekstowe',
          title: exercise.title,
          question: exercise.question,
          correct_answer: exercise.correct_answer,
          options: exercise.options ? JSON.parse(exercise.options) : null
        }))
      };

      setLessonHistory(historyItem);
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson history');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExercise = (index: number) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', emoji: '🌟', message: 'Excellent!' };
    if (score >= 80) return { grade: 'B', emoji: '⭐', message: 'Great Job!' };
    if (score >= 70) return { grade: 'C', emoji: '👍', message: 'Good Work!' };
    if (score >= 60) return { grade: 'D', emoji: '📚', message: 'Keep Practicing!' };
    return { grade: 'F', emoji: '💪', message: 'Try Again!' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Trophy className="h-12 w-12 animate-bounce text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error || !lessonHistory) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-300 mb-4">{error || 'Lesson history not found'}</p>
          <button
            onClick={() => navigate('/student/lessons')}
            className="px-6 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 font-semibold"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const scoreData = getScoreGrade(lessonHistory.score);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header with Gradient and Achievement */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
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
              <div className="flex items-center space-x-3 mb-3">
                <Award className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold text-white">
                  {lessonHistory.lesson_title}
                </h1>
              </div>
              
              {lessonHistory.lesson_description && (
                <p className="text-green-100 text-lg mb-6 max-w-3xl">
                  {lessonHistory.lesson_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Completed {new Date(lessonHistory.completed_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Tutor: {lessonHistory.tutor_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{Math.round(lessonHistory.time_spent / 60)} minutes</span>
                </div>
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
              <div className="text-6xl mb-2">{scoreData.emoji}</div>
              <div className="text-5xl font-bold text-white mb-1">{lessonHistory.score}%</div>
              <div className="text-xl font-bold text-white/90 mb-1">Grade: {scoreData.grade}</div>
              <div className="text-sm text-white/80">{scoreData.message}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="h-8 w-8 opacity-80" />
            <div className={`text-3xl font-bold`}>
              {lessonHistory.score}%
            </div>
          </div>
          <p className="text-green-100 text-sm font-medium">Final Score</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">
              {Math.round(lessonHistory.time_spent / 60)}m
            </div>
          </div>
          <p className="text-blue-100 text-sm font-medium">Time Spent</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">
              {lessonHistory.exercises_count}
            </div>
          </div>
          <p className="text-purple-100 text-sm font-medium">Exercises</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">
              {scoreData.grade}
            </div>
          </div>
          <p className="text-amber-100 text-sm font-medium">Grade</p>
        </div>
      </div>

      {/* Exercises Review */}
      {lessonHistory.exercises.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
              <Target className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              <span>Exercises Review ({lessonHistory.exercises.length})</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Click on any exercise to view details and correct answers
            </p>
          </div>

          <div className="p-6 space-y-4">
            {lessonHistory.exercises.map((exercise, index) => {
              const isExpanded = expandedExercises.has(index);
              
              return (
                <div 
                  key={exercise.id} 
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md"
                >
                  {/* Exercise Header */}
                  <button
                    onClick={() => toggleExercise(index)}
                    className="w-full p-5 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-2xl">
                            {exercise.exercise_type === 'ABCD' ? '📝' :
                             exercise.exercise_type === 'Fiszki' ? '🃏' : '✍️'}
                          </span>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {exercise.title}
                          </h3>
                        </div>
                        <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                          {exercise.exercise_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Exercise Details (Expandable) */}
                  {isExpanded && (
                    <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-5">
                        {/* Question */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span>Question:</span>
                          </label>
                          <p className="text-gray-900 dark:text-white text-lg bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            {exercise.question}
                          </p>
                        </div>

                        {/* ABCD Options */}
                        {exercise.exercise_type === 'ABCD' && exercise.options && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                              <Target className="h-4 w-4 text-purple-500" />
                              <span>Options:</span>
                            </label>
                            <div className="space-y-2">
                              {Array.isArray(exercise.options) && exercise.options.map((option, optIndex) => {
                                const letter = String.fromCharCode(65 + optIndex);
                                const isCorrect = letter === exercise.correct_answer;
                                
                                return (
                                  <div 
                                    key={optIndex}
                                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                                      isCorrect
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                                        : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                      isCorrect
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {letter}
                                    </span>
                                    <span className="flex-1 text-gray-900 dark:text-white font-medium">
                                      {option}
                                    </span>
                                    {isCorrect && (
                                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Flashcards */}
                        {exercise.exercise_type === 'Fiszki' && exercise.options && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-purple-500" />
                              <span>Flashcards:</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Array.isArray(exercise.options) ? 
                                exercise.options.map((card, cardIndex) => (
                                  <div key={cardIndex} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                    <div className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                                      📖 Front: {card.front}
                                    </div>
                                    <div className="text-blue-700 dark:text-blue-400">
                                      💡 Back: {card.back}
                                    </div>
                                  </div>
                                )) : (
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                    <div className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                                      📖 Front: {exercise.question}
                                    </div>
                                    <div className="text-blue-700 dark:text-blue-400">
                                      💡 Back: {exercise.correct_answer}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                        {/* Text Answer */}
                        {exercise.exercise_type === 'Tekstowe' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Correct Answer:</span>
                            </label>
                            <p className="text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 font-medium">
                              {exercise.correct_answer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => navigate(`/student/lessons/${lessonId}`)}
          className="group flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
          <span>Review Lesson Again</span>
        </button>
        
        <button
          onClick={() => navigate('/student/lessons')}
          className="group flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
        >
          <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span>Back to All Lessons</span>
        </button>
      </div>
    </div>
  );
}