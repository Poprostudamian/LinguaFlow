// src/pages/StudentLessonViewer.tsx - ULEPSZONA WERSJA DEBUG
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
  AlertCircle
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

// Ulepszona implementacja getLessonDetails z dodatkowymi logami
const getLessonDetails = async (lessonId: string, studentId: string): Promise<LessonDetails | null> => {
  try {
    console.log('🔍 Getting lesson details for:', { lessonId, studentId });

    // Pobierz informacje o lekcji wraz z przypisaniem studenta
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        student_id,
        lesson_id,
        assigned_at,
        started_at,
        completed_at,
        status,
        score,
        time_spent,
        progress,
        lessons!inner (
          id,
          title,
          description,
          content,
          status,
          created_at,
          updated_at,
          tutor_id,
          users!lessons_tutor_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      console.error('❌ Error fetching lesson details:', error);
      throw error;
    }

    if (!data) {
      console.log('ℹ️ Lesson not found or not assigned to student');
      return null;
    }

    console.log('✅ Raw lesson data:', data);
    console.log('📝 Raw lesson content:', data.lessons.content);
    console.log('📝 Content length:', data.lessons.content ? data.lessons.content.length : 0);
    console.log('📝 Content type:', typeof data.lessons.content);

    // Formatuj dane dla komponentu
    const formattedData = {
      id: data.lessons.id,
      title: data.lessons.title,
      description: data.lessons.description || '',
      content: data.lessons.content || 'No content available for this lesson.',
      created_at: data.lessons.created_at,
      tutor: {
        first_name: data.lessons.users.first_name,
        last_name: data.lessons.users.last_name,
        email: data.lessons.users.email
      },
      student_lesson: {
        status: data.status,
        progress: data.progress || 0,
        score: data.score,
        time_spent: data.time_spent || 0,
        started_at: data.started_at,
        completed_at: data.completed_at
      }
    };

    console.log('✅ Formatted lesson data:', formattedData);
    console.log('📝 Final content:', formattedData.content);
    return formattedData;

  } catch (error) {
    console.error('Error getting lesson details:', error);
    throw error;
  }
};

// Prosta implementacja getLessonExercises
const getLessonExercises = async (lessonId: string) => {
  try {
    console.log('🎯 Getting exercises for lesson:', lessonId);

    const { data, error } = await supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_number', { ascending: true });

    if (error) {
      // Jeśli tabela nie istnieje, zwróć pustą tablicę
      if (error.code === '42P01') {
        console.log('ℹ️ lesson_exercises table does not exist yet');
        return [];
      }
      console.error('❌ Error fetching exercises:', error);
      return []; // Nie rzucaj błędu, tylko zwróć pustą tablicę
    }

    console.log('✅ Found', data?.length || 0, 'exercises');
    
    // Parsuj opcje JSON dla ćwiczeń ABCD
    const formattedExercises = (data || []).map(exercise => ({
      ...exercise,
      options: exercise.options ? JSON.parse(exercise.options) : null
    }));

    return formattedExercises;

  } catch (error) {
    console.error('Error getting lesson exercises:', error);
    return []; // Zwróć pustą tablicę zamiast rzucać błąd
  }
};

export function StudentLessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'exercises'>('content');
  const [isStarting, setIsStarting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('🚀 StudentLessonViewer mounted:', { lessonId, studentId: session?.user?.id });
    if (lessonId && session?.user?.id) {
      loadLessonData();
    }
  }, [lessonId, session?.user?.id]);

  const loadLessonData = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📚 Loading lesson data for:', { lessonId, studentId: session.user.id });

      // Pobierz szczegóły lekcji
      const lessonData = await getLessonDetails(lessonId, session.user.id);
      console.log('📖 Lesson data result:', lessonData);

      if (!lessonData) {
        setError('Lesson not found or not assigned to you');
        return;
      }

      setLesson(lessonData);

      // Dodaj debug info z więcej szczegółów
      setDebugInfo({
        lessonId,
        studentId: session.user.id,
        userRole: session.user.role,
        lessonTitle: lessonData.title,
        contentLength: lessonData.content ? lessonData.content.length : 0,
        hasContent: !!lessonData.content && lessonData.content.trim().length > 0,
        rawContent: lessonData.content
      });

      // Pobierz ćwiczenia
      const exercisesData = await getLessonExercises(lessonId);
      console.log('🎯 Exercises data result:', exercisesData);
      setExercises(exercisesData);

      // Jeśli są ćwiczenia i lekcja jest w trakcie/ukończona, pokaż ćwiczenia
      if (exercisesData.length > 0 && lessonData.student_lesson.status !== 'assigned') {
        setActiveTab('exercises');
      }

    } catch (err: any) {
      console.error('❌ Error loading lesson:', err);
      setError(err.message || 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!lessonId || !session?.user?.id) return;

    try {
      setIsStarting(true);
      console.log('▶️ Starting lesson:', { lessonId, studentId: session.user.id });
      
      // Aktualizuj status na "in_progress"
      await updateStudentLessonProgress(
        session.user.id,
        lessonId,
        10, // 10% progress na start
        'in_progress'
      );

      // Odśwież dane
      await loadLessonData();
      
      // Przejdź do ćwiczeń jeśli są dostępne
      if (exercises.length > 0) {
        setActiveTab('exercises');
      }

    } catch (err: any) {
      console.error('❌ Error starting lesson:', err);
      setError('Failed to start lesson');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-500">
              <p>Lesson ID: {debugInfo.lessonId}</p>
              <p>Student ID: {debugInfo.studentId}</p>
              <p>User Role: {debugInfo.userRole}</p>
            </div>
          )}
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
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Lesson ID: {debugInfo.lessonId}</p>
              <p>Student ID: {debugInfo.studentId}</p>
              <p>User Role: {debugInfo.userRole}</p>
              <p>Error: {error}</p>
            </div>
          )}
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => navigate('/student/lessons')}
              className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
            >
              Back to Lessons
            </button>
            <button
              onClick={loadLessonData}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { student_lesson } = lesson;
  const hasExercises = exercises.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Debug panel dla development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Enhanced Debug Info:</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>Lesson ID: {debugInfo.lessonId}</p>
            <p>Student ID: {debugInfo.studentId}</p>
            <p>User Role: {debugInfo.userRole}</p>
            <p>Lesson Title: {debugInfo.lessonTitle}</p>
            <p>Content Length: {debugInfo.contentLength} characters</p>
            <p>Has Content: {debugInfo.hasContent ? 'YES' : 'NO'}</p>
            <p>Lesson Status: {student_lesson.status}</p>
            <p>Progress: {student_lesson.progress}%</p>
            <p>Exercises: {exercises.length}</p>
            
            {/* Raw content preview */}
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                Raw Content Preview (click to expand)
              </summary>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                <pre>{debugInfo.rawContent || 'No content'}</pre>
              </div>
            </details>
          </div>
        </div>
      )}

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
                <Zap className="h-4 w-4" />
                <span>{exercises.length} exercises</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Status */}
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

            {/* Score */}
            {student_lesson.score !== null && (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {student_lesson.score}%
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
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

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Lesson Content
        </h2>
        
        {/* Content Warning if empty */}
        {(!lesson.content || lesson.content.trim().length === 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200">
                This lesson has no content yet. The tutor may need to add content to this lesson.
              </p>
            </div>
          </div>
        )}
        
        <div className="prose dark:prose-invert max-w-none mb-6">
          {lesson.content && lesson.content.trim().length > 0 ? (
            <div 
              dangerouslySetInnerHTML={{ __html: lesson.content }}
              className="text-gray-700 dark:text-gray-300"
            />
          ) : (
            <div className="text-gray-500 dark:text-gray-400 italic text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No content available for this lesson.</p>
              <p className="text-sm mt-1">Please contact your tutor to add content to this lesson.</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center pt-6">
          {student_lesson.status === 'assigned' && (
            <button
              onClick={handleStartLesson}
              disabled={isStarting}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isStarting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
              <span>{isStarting ? 'Starting...' : 'Start Lesson'}</span>
            </button>
          )}

          {student_lesson.status === 'in_progress' && hasExercises && (
            <div className="text-center">
              <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Zap className="h-5 w-5" />
                <span>Exercises Available ({exercises.length})</span>
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Exercise functionality coming soon!
              </p>
            </div>
          )}

          {student_lesson.status === 'in_progress' && !hasExercises && (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Lesson in progress! Continue reading the content above.
              </p>
              <button
                onClick={() => {
                  // Symuluj ukończenie lekcji
                  updateStudentLessonProgress(
                    session.user.id,
                    lessonId,
                    100,
                    'completed',
                    100, // 100% score
                    300  // 5 minut
                  ).then(() => loadLessonData());
                }}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Completed
              </button>
            </div>
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
    </div>
  );
}