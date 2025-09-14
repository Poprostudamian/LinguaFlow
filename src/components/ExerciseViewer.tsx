// 1. src/components/ExerciseViewer.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'ABCD' | 'Fiszki' | 'Tekstowe';
  title: string;
  question: string;
  correct_answer: string;
  options?: string[];
  explanation?: string;
  order_number: number;
  points: number;
}

interface ExerciseViewerProps {
  exercises: Exercise[];
  onComplete: (score: number, timeSpent: number) => void;
  onProgress: (currentExercise: number, totalExercises: number) => void;
}

export function ExerciseViewer({ exercises, onComplete, onProgress }: ExerciseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [currentAnswer, setCurrentAnswer] = useState('');

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, exercises.length);
    }
  }, [currentIndex, exercises.length, onProgress]);

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentExercise.id]: answer
    }));
    setCurrentAnswer(answer);
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(userAnswers[exercises[currentIndex + 1]?.id] || '');
    } else {
      finishExercises();
    }
  };

  const finishExercises = () => {
    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const earnedPoints = exercises.reduce((sum, ex) => {
      const userAnswer = userAnswers[ex.id];
      const isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
      return sum + (isCorrect ? ex.points : 0);
    }, 0);

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setShowResults(true);
    if (onComplete) {
      onComplete(score, timeSpent);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No exercises available for this lesson.</p>
      </div>
    );
  }

  if (showResults) {
    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const earnedPoints = exercises.reduce((sum, ex) => {
      const userAnswer = userAnswers[ex.id];
      const isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
      return sum + (isCorrect ? ex.points : 0);
    }, 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Exercises Completed!
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Your Score: {score}% ({earnedPoints}/{totalPoints} points)
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Exercise {currentIndex + 1} of {exercises.length}</span>
          <span>{currentExercise.exercise_type}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {currentExercise.title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {currentExercise.question}
        </p>

        {/* ABCD Type */}
        {currentExercise.exercise_type === 'ABCD' && currentExercise.options && (
          <div className="space-y-3">
            {currentExercise.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              const isSelected = currentAnswer === optionLetter;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(optionLetter)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-purple-600 dark:text-purple-400 mr-3">
                    {optionLetter}.
                  </span>
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Other exercise types can be added here */}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={nextExercise}
          disabled={!currentAnswer}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <span>{currentIndex === exercises.length - 1 ? 'Finish' : 'Next'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ==============================================================================

// 2. src/pages/StudentLessonViewer.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle, 
  PlayCircle,
  RefreshCw,
  AlertCircle
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

      const [lessonData, exercisesData] = await Promise.all([
        getLessonDetails(lessonId, session.user.id),
        getLessonExercises(lessonId)
      ]);

      if (!lessonData) {
        setError('Lesson not found or not assigned to you');
        return;
      }

      setLesson(lessonData);
      setExercises(exercisesData);

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
      await updateStudentLessonProgress(
        session.user.id,
        lessonId,
        10,
        'in_progress'
      );

      await loadLessonData();
      
      if (exercises.length > 0) {
        setActiveTab('exercises');
      }

    } catch (err: any) {
      console.error('Error starting lesson:', err);
      setError('Failed to start lesson');
    }
  };

  const handleCompleteExercises = async (score: number, timeSpent: number) => {
    if (!lessonId || !session?.user?.id) return;

    try {
      await updateStudentLessonProgress(
        session.user.id,
        lessonId,
        100,
        'completed',
        score,
        timeSpent
      );

      await loadLessonData();

    } catch (err: any) {
      console.error('Error completing exercises:', err);
      setError('Failed to complete exercises');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
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
                <BookOpen className="h-4 w-4" />
                <span>{exercises.length} exercises</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
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

            {student_lesson.score !== null && (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {student_lesson.score}%
              </span>
            )}
          </div>
        </div>

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
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Lesson Content
            </button>

            {hasExercises && (
              <button
                onClick={() => setActiveTab('exercises')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exercises'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Exercises ({exercises.length})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                  className="text-gray-700 dark:text-gray-300"
                />
              </div>

              <div className="flex justify-center pt-6">
                {student_lesson.status === 'assigned' && (
                  <button
                    onClick={handleStartLesson}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <PlayCircle className="h-5 w-5" />
                    <span>Start Lesson</span>
                  </button>
                )}

                {student_lesson.status === 'in_progress' && hasExercises && (
                  <button
                    onClick={() => setActiveTab('exercises')}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <BookOpen className="h-5 w-5" />
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
                  onProgress={() => {}}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}