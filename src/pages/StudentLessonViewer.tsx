// src/pages/StudentLessonViewer.tsx - Nowy komponent do wyświetlania lekcji
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLessonDetails, updateLessonProgress, startStudentLesson } from '../lib/supabase';

interface LessonDetails {
  // Assignment info
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  score: number | null;
  time_spent: number;
  progress: number;
  
  // Lesson info
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    status: string;
    created_at: string;
    tutor: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export function StudentLessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lessonDetails, setLessonDetails] = useState<LessonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [studyStartTime, setStudyStartTime] = useState<Date | null>(null);
  const [studyTime, setStudyTime] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (studyStartTime && lessonDetails?.status === 'in_progress') {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - studyStartTime.getTime()) / 1000);
        setStudyTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [studyStartTime, lessonDetails?.status]);

  // Load lesson details
  useEffect(() => {
    if (lessonId && session?.user?.id) {
      loadLessonDetails();
    }
  }, [lessonId, session?.user?.id]);

  const loadLessonDetails = async () => {
    if (!lessonId || !session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading lesson details for:', lessonId);
      const details = await getLessonDetails(session.user.id, lessonId);
      
      setLessonDetails(details);
      
      // Jeśli lekcja jest już rozpoczęta, uruchom timer
      if (details.status === 'in_progress' && details.started_at) {
        const startedAt = new Date(details.started_at);
        setStudyStartTime(startedAt);
      }
      
      console.log('✅ Lesson details loaded:', details);
    } catch (err: any) {
      console.error('❌ Error loading lesson details:', err);
      setError(err.message || 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!lessonDetails || !session?.user?.id) return;
    
    setIsStarting(true);
    
    try {
      await startStudentLesson(session.user.id, lessonDetails.lesson_id);
      
      // Update local state
      setLessonDetails(prev => prev ? {
        ...prev,
        status: 'in_progress',
        started_at: new Date().toISOString()
      } : null);
      
      // Start timer
      setStudyStartTime(new Date());
      
      console.log('✅ Lesson started successfully');
    } catch (error: any) {
      console.error('❌ Error starting lesson:', error);
      alert('Failed to start lesson: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lessonDetails || !session?.user?.id) return;
    
    const finalStudyTime = lessonDetails.time_spent + studyTime;
    
    try {
      await updateLessonProgress(
        session.user.id, 
        lessonDetails.lesson_id, 
        100, 
        'completed'
      );
      
      // Update local state
      setLessonDetails(prev => prev ? {
        ...prev,
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        time_spent: finalStudyTime
      } : null);
      
      setStudyStartTime(null);
      
      alert('Congratulations! Lesson completed successfully!');
    } catch (error: any) {
      console.error('❌ Error completing lesson:', error);
      alert('Failed to mark lesson as complete: ' + error.message);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lesson...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lessonDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/student/lessons')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Lessons</span>
          </button>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Lesson</h3>
            </div>
            <p className="text-red-600 dark:text-red-300 mt-2">
              {error || 'Lesson not found or access denied'}
            </p>
            <button
              onClick={loadLessonDetails}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/student/lessons')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Lessons</span>
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Study Timer */}
            {lessonDetails.status === 'in_progress' && (
              <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300 font-mono">
                  {formatTime(studyTime)}
                </span>
              </div>
            )}
            
            {/* Status Badge */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              lessonDetails.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : lessonDetails.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {lessonDetails.status === 'assigned' ? 'Not Started' : 
               lessonDetails.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </span>
          </div>
        </div>

        {/* Lesson Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {lessonDetails.lesson.title}
              </h1>
              
              {lessonDetails.lesson.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lessonDetails.lesson.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>
                    {lessonDetails.lesson.tutor.first_name} {lessonDetails.lesson.tutor.last_name}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Assigned {new Date(lessonDetails.assigned_at).toLocaleDateString()}</span>
                </div>
                
                {lessonDetails.progress > 0 && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{lessonDetails.progress}% Complete</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Button */}
            <div className="ml-6">
              {lessonDetails.status === 'assigned' && (
                <button
                  onClick={handleStartLesson}
                  disabled={isStarting}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isStarting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span>{isStarting ? 'Starting...' : 'Start Lesson'}</span>
                </button>
              )}
              
              {lessonDetails.status === 'in_progress' && (
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Mark Complete</span>
                </button>
              )}
              
              {lessonDetails.status === 'completed' && (
                <div className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {lessonDetails.progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{lessonDetails.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    lessonDetails.status === 'completed' 
                      ? 'bg-green-600' 
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${lessonDetails.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Lesson Content
          </h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {lessonDetails.lesson.content}
            </div>
          </div>
          
          {/* Lesson Stats */}
          {(lessonDetails.time_spent > 0 || studyTime > 0) && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Study Time: {formatTime(lessonDetails.time_spent + studyTime)}
                  </span>
                </div>
                
                {lessonDetails.score && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Score: {lessonDetails.score}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}