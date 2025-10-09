// src/pages/StudentLessonViewer.tsx - UPDATED WITH INTERACTIVE EXERCISES

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [exerciseAnswers, setExerciseAnswers] = useState<any[]>([]);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);

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

      // Get exercises
      const { data: exercisesData } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number');

      // Parse exercises
      const parsedExercises = (exercisesData || []).map(ex => ({
        ...ex,
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

  const handleExercisesComplete = async (answers: any[], score: number) => {
    if (!lessonId || !session?.user?.id) return;

    try {
      console.log('📝 Exercises completed:', { answers, score });
      
      // ✅ ZAPISZ ODPOWIEDZI OD RAZU!
      if (answers.length > 0) {
        console.log('💾 Saving answers to database immediately...');
        await saveStudentExerciseAnswers(
          session.user.id,
          lessonId,
          answers
        );
        console.log('✅ Answers saved successfully!');
      }

      // Ustaw state dla UI
      setExerciseAnswers(answers);
      setCalculatedScore(score);

    } catch (err) {
      console.error('❌ Error saving answers:', err);
      alert('Failed to save your answers. Please try again.');
    }
  };

const handleCompleteLesson = async () => {
    if (!lessonId || !session?.user?.id || !lesson) return;

    try {
      setIsCompleting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      console.log('🏁 Completing lesson with score:', calculatedScore);

      // Zaktualizuj status lekcji (odpowiedzi są już zapisane w handleExercisesComplete)
      await supabase
        .from('student_lessons')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          time_spent: lesson.student_lesson.time_spent + timeSpent,
          score: calculatedScore || 0 // Użyj obliczonego score z ćwiczeń
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', session.user.id);

      console.log('✅ Lesson completed successfully');
      
      // Przekieruj do historii
      navigate(`/student/lessons/${lessonId}/history`);

    } catch (err) {
      console.error('❌ Error completing lesson:', err);
      alert('Failed to complete lesson. Please try again.');
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
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Lesson not found'}</p>
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
              <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lesson.created_at)}</span>
            </div>
            {exercises.length > 0 && (
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>{exercises.length} exercises</span>
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

      {/* Start Lesson Card */}
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

      {/* Complete Lesson Card - shows after exercises are done */}
      {student_lesson.status === 'in_progress' && exerciseAnswers.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-xl">
                <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Great job! Complete this lesson
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your score: {calculatedScore}% • Click to finish and save your progress
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
              <BookOpen className="h-5 w-5" />
              <span>Content</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'exercises'
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Exercises ({exercises.length})</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'content' && (
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  About this lesson
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {lesson.description || 'No description available.'}
                </p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {activeTab === 'exercises' && (
            <div>
              {exercises.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exercises available for this lesson.</p>
                </div>
              ) : student_lesson.status === 'assigned' ? (
                <div className="text-center py-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Start the lesson to access exercises
                  </p>
                  <button
                    onClick={handleStartLesson}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    Start Lesson
                  </button>
                </div>
              ) : student_lesson.status === 'completed' ? (
                // ✅ NEW: Show message for completed lessons instead of allowing re-submission
                <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <Award className="h-16 w-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Lesson Completed!
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    You've already completed this lesson with a score of <span className="font-bold text-green-600 dark:text-green-400">{student_lesson.score}%</span>
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
                // Only show interactive exercises for 'in_progress' lessons
                <InteractiveExerciseViewer 
                  exercises={exercises}
                  onComplete={handleExercisesComplete}
                />
              )}
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