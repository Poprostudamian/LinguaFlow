// src/pages/StudentDashboard.tsx - NAPRAWIONA WERSJA Z RZECZYWISTYMI DANYMI

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Flame, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStudentLessons, getStudentStats } from '../lib/supabase';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';

interface StudentLessonData {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
  score: number | null;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

interface StudentStats {
  student_id: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  total_study_time_minutes: number;
  average_progress: number;
  last_activity: string | null;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id]);

  const loadDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Załaduj lekcje i statystyki równolegle
      const [lessonsData, statsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentStats(session.user.id)
      ]);

      setLessons(lessonsData);
      setStats(statsData);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Oblicz dane do wyświetlenia
  const upcomingLessons = lessons.filter(l => l.status === 'assigned').slice(0, 3);
  const recentLessons = lessons.filter(l => l.status === 'in_progress' || l.status === 'completed').slice(0, 3);
  
  // Oblicz streak (przykładowa logika)
  const studyStreak = stats ? Math.min(Math.floor(stats.total_study_time_minutes / 60), 30) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Dashboard
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading dashboard</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning progress and upcoming lessons
          </p>
        </div>
        
        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Lessons Completed"
          value={stats?.completed_lessons || 0}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Study Streak"
          value={`${studyStreak} days`}
          icon={Flame}
          color="orange"
        />
        <KPICard
          title="Total Hours"
          value={`${Math.round((stats?.total_study_time_minutes || 0) / 60)}h`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton
          label="View All Lessons"
          icon={BookOpen}
          onClick={() => navigate('/student/lessons')}
        />
        <ActionButton
          label="Chat with Tutor"
          icon={MessageCircle}
          variant="secondary"
          onClick={() => navigate('/student/messages')}
        />
        <ActionButton
          label="View Schedule"
          icon={Calendar}
          variant="secondary"
          onClick={() => navigate('/student/schedule')}
        />
      </div>

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upcoming Lessons
            </h2>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {lesson.lessons.title}
                  </h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs rounded-full">
                    New
                  </span>
                </div>
                
                {lesson.lessons.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {lesson.lessons.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                  </div>
                  
                  <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                    Start →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {lesson.lessons.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lesson.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {lesson.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                      </span>
                      
                      {lesson.progress > 0 && (
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{lesson.progress}% complete</span>
                        </span>
                      )}
                      
                      {lesson.score !== null && (
                        <span className="flex items-center space-x-1">
                          <span>Score: {lesson.score}%</span>
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {lesson.progress > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            lesson.status === 'completed' ? 'bg-green-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                      {lesson.status === 'completed' ? 'Review' : 'Continue'} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No lessons yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your tutors will assign lessons to you soon!
          </p>
          <button
            onClick={() => navigate('/student/messages')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Contact Your Tutor
          </button>
        </div>
      )}
    </div>
  );
}