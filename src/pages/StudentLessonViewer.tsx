// src/pages/StudentLessonViewer.tsx - Z PEŁNYMI TŁUMACZENIAMI

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
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
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
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage(); // ← DODANE
  
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId && session?.user?.id) {
      fetchLessonDetails();
    }
  }, [lessonId, session?.user?.id]);

  const fetchLessonDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch lesson with tutor info
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

      if (lessonError) throw lessonError;

      // Fetch student_lesson relationship
      const { data: studentLessonData, error: studentLessonError } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', session?.user?.id)
        .single();

      if (studentLessonError) throw studentLessonError;

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_number', { ascending: true });

      if (exercisesError) throw exercisesError;

      setLesson({
        ...lessonData,
        tutor: lessonData.tutor,
        student_lesson: studentLessonData,
      });
      setExercises(exercisesData || []);
    } catch (err: any) {
      console.error('Error fetching lesson details:', err);
      setError(t.studentLessonViewer.errorLoadingLesson); // ← ZMIENIONE
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
      setError(t.studentLessonViewer.errorStartingLesson); // ← ZMIENIONE
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

    // ✅ FIX: Pass all 3 required parameters
    await saveStudentExerciseAnswers(
      session.user.id,  // studentId
      lessonId,         // lessonId
      results           // exerciseAnswers
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
    setError(t.studentLessonViewer.errorCompletingLesson);
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
    return `${minutes} ${t.studentLessonViewer.minutes}`; // ← ZMIENIONE
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t.studentLessonViewer.loading} {/* ← ZMIENIONE */}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
            {t.studentLessonViewer.error} {/* ← ZMIENIONE */}
          </h3>
          <p className="text-red-600 dark:text-red-300">
            {error || t.studentLessonViewer.lessonNotFound} {/* ← ZMIENIONE */}
          </p>
          <button
            onClick={() => navigate('/student/lessons')}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700"
          >
            {t.studentLessonViewer.backToLessons} {/* ← ZMIENIONE */}
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
                  {exercises.length} {t.studentLessonViewer.exercises} {/* ← ZMIENIONE */}
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
          {student_lesson.status === 'assigned' && t.studentLessonViewer.statusNotStarted} {/* ← ZMIENIONE */}
          {student_lesson.status === 'in_progress' && t.studentLessonViewer.statusInProgress} {/* ← ZMIENIONE */}
          {student_lesson.status === 'completed' && t.studentLessonViewer.statusCompleted} {/* ← ZMIENIONE */}
        </div>
      </div>

      {/* Start Lesson Card - tylko dla assigned */}
      {student_lesson.status === 'assigned' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-xl">
                <PlayCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {t.studentLessonViewer.readyToStart} {/* ← ZMIENIONE */}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.studentLessonViewer.beginJourney} {/* ← ZMIENIONE */}
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
                  <span>{t.studentLessonViewer.starting}</span> {/* ← ZMIENIONE */}
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  <span>{t.studentLessonViewer.startLesson}</span> {/* ← ZMIENIONE */}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Stats - tylko dla in_progress */}
      {student_lesson.status === 'in_progress' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.studentLessonViewer.yourProgress} {/* ← ZMIENIONE */}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  {t.studentLessonViewer.timeSpent} {/* ← ZMIENIONE */}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(student_lesson.time_spent)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  {t.studentLessonViewer.startedOn} {/* ← ZMIENIONE */}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {student_lesson.started_at && formatDate(student_lesson.started_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.studentLessonViewer.lessonContent} {/* ← ZMIENIONE */}
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
                  {t.studentLessonViewer.exercises} {/* ← ZMIENIONE */}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.studentLessonViewer.exercisesDescription} {/* ← ZMIENIONE */}
              </p>
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.studentLessonViewer.noExercises} {/* ← ZMIENIONE */}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t.studentLessonViewer.noExercisesDescription} {/* ← ZMIENIONE */}
              </p>
            </div>
          ) : (
            <div>
              {student_lesson.status === 'completed' ? (
                // Ukończona lekcja - pokaż komunikat i przycisk do historii
                <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <Award className="h-16 w-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.studentLessonViewer.lessonCompleted} {/* ← ZMIENIONE */}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {t.studentLessonViewer.completedMessage}{' '} {/* ← ZMIENIONE */}
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {student_lesson.score}%
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t.studentLessonViewer.viewDetailsHistory} {/* ← ZMIENIONE */}
                  </p>
                  <button
                    onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center space-x-2 mx-auto"
                  >
                    <Clock className="h-5 w-5" />
                    <span>{t.studentLessonViewer.viewHistory}</span> {/* ← ZMIENIONE */}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // In progress - pokaż interaktywne ćwiczenia
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