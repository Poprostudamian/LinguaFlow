// src/pages/StudentDashboard.tsx - UPDATED WITH REAL SUPABASE DATA

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Flame, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { LessonCard } from '../components/LessonCard';
import { 
  getStudentStats, 
  getStudentLessons, 
  StudentStats, 
  StudentUpcomingLesson,
  updateStudentLessonProgress 
} from '../lib/supabase';

export function StudentDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<StudentUpcomingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentData = async () => {
    if (!session.user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Loading student dashboard data...');
      
      // Load student stats and lessons in parallel
      const [studentStats, studentLessons] = await Promise.all([
        getStudentStats(session.user.id),
        getStudentLessons(session.user.id)
      ]);

      setStats(studentStats);
      setUpcomingLessons(studentLessons);
      
      console.log('✅ Student data loaded successfully');
    } catch (err: any) {
      console.error('❌ Error loading student data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when user changes
  useEffect(() => {
    if (session.isAuthenticated && session.user?.role === 'student') {
      loadStudentData();
    }
  }, [session.isAuthenticated, session.user?.id, session.user?.role]);

  const handleStartLesson = async (lessonId: string) => {
    if (!session.user?.id) return;

    try {
      await updateStudentLessonProgress(lessonId, 1, 'in_progress');
      
      // Refresh data to show updated status
      await loadStudentData();
      
      alert('Lesson started! Continue your learning journey.');
    } catch (error: any) {
      console.error('Error starting lesson:', error);
      alert('Failed to start lesson. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadStudentData();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Student Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your learning progress...
            </p>
          </div>
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to load dashboard
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user?.first_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning progress and upcoming lessons
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Lessons Completed"
          value={stats?.kpis.lessonsCompleted || 0}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Study Streak"
          value={`${stats?.kpis.studyStreak || 0} days`}
          icon={Flame}
          color="orange"
        />
        <KPICard
          title="Total Hours"
          value={`${stats?.kpis.totalHours || 0}h`}
          icon={Clock}
          color="blue"
        />
        <KPICard
          title="Current Level"
          value={stats?.kpis.currentLevel || 'Beginner'}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Progress Overview */}
      {stats?.kpis.totalLessonsAssigned && stats.kpis.totalLessonsAssigned > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overall Progress
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{stats.kpis.averageProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stats.kpis.averageProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stats.kpis.lessonsCompleted} of {stats.kpis.totalLessonsAssigned} lessons
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton
          label="Chat with Tutor"
          icon={MessageCircle}
          onClick={() => {
            // Navigate to messages page
            window.location.href = '/student/messages';
          }}
        />
        <ActionButton
          label="Schedule Lesson"
          icon={Calendar}
          variant="secondary"
          onClick={() => {
            // Navigate to schedule page
            window.location.href = '/student/schedule';
          }}
        />
        <ActionButton
          label="Continue Learning"
          icon={Play}
          variant="secondary"
          onClick={() => {
            // Navigate to lessons page
            window.location.href = '/student/lessons';
          }}
        />
      </div>

      {/* Upcoming Lessons */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Lessons
          </h2>
          {upcomingLessons.length > 3 && (
            <button
              onClick={() => window.location.href = '/student/lessons'}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-sm font-medium"
            >
              View all lessons →
            </button>
          )}
        </div>

        {upcomingLessons.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No lessons assigned yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your tutor hasn't assigned any lessons yet. Check back later!
            </p>
            <button
              onClick={() => window.location.href = '/student/messages'}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contact your tutor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.slice(0, 6).map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Tutor: {lesson.tutor_name}
                    </p>
                    {lesson.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    lesson.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : lesson.status === 'in_progress'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'  
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {lesson.status === 'assigned' ? 'New' : 
                     lesson.status === 'in_progress' ? 'In Progress' : 
                     lesson.status}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{lesson.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${lesson.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {lesson.status === 'assigned' ? (
                    <button
                      onClick={() => handleStartLesson(lesson.lesson_id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Lesson</span>
                    </button>
                  ) : lesson.status === 'in_progress' ? (
                    <button
                      onClick={() => handleStartLesson(lesson.lesson_id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                    >
                      <Play className="h-4 w-4" />
                      <span>Continue</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md text-sm cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Assigned {new Date(lesson.assigned_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Great job! 
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Last activity: {new Date(stats.recentActivity).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}