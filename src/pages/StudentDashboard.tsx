// src/pages/StudentDashboard.tsx - Z PRAWDZIWYMI DANAMI Z BAZY

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
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { LessonCard } from '../components/LessonCard';
import { getStudentDashboardData, StudentStats, updateStudentLessonProgress } from '../lib/supabase';

// Interface for lesson card - matching the simple LessonCard component
interface LessonForCard {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export function StudentDashboard() {
  const { session } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!session.user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔄 Loading student dashboard data...');
      
      const data = await getStudentDashboardData();
      setDashboardData(data);
      
      console.log('✅ Dashboard data loaded:', data);
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [session.user?.id]);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
  };

  // Convert upcoming lessons to format expected by LessonCard
  const convertToLessonCard = (upcomingLesson: any): LessonForCard => {
    const assignedDate = new Date(upcomingLesson.assigned_at);
    const status = upcomingLesson.status === 'assigned' ? 'upcoming' : 'upcoming'; // All non-completed are 'upcoming'
    
    return {
      id: upcomingLesson.id,
      title: upcomingLesson.title,
      date: assignedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: assignedDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      tutor: upcomingLesson.tutor_name,
      status: status as 'upcoming' | 'completed' | 'cancelled'
    };
  };

  // Handle lesson progress update (for future use)
  const handleLessonProgress = async (lessonId: string, progress: number) => {
    try {
      await updateStudentLessonProgress(lessonId, progress);
      // Refresh dashboard after update
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading your dashboard...</span>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
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
              <h3 className="text-red-800 dark:text-red-200 font-medium">Unable to load dashboard</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="space-y-8">
      {/* Header */}
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
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Real Data Indicator */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            Live Database Connection
          </span>
        </div>
        <div className="text-green-600 dark:text-green-300 text-sm mt-1">
          Level: {dashboardData?.kpis.currentLevel} • 
          Progress: {dashboardData?.kpis.averageProgress}% • 
          Lessons: {dashboardData?.kpis.lessonsCompleted}/{dashboardData?.kpis.totalLessonsAssigned}
        </div>
      </div>

      {/* KPI Cards - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Lessons Completed"
          value={dashboardData?.kpis.lessonsCompleted || 0}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Study Streak"
          value={`${dashboardData?.kpis.studyStreak || 0} days`}
          icon={Flame}
          color="orange"
        />
        <KPICard
          title="Total Hours"
          value={`${dashboardData?.kpis.totalHours || 0}h`}
          icon={Clock}
          color="blue"
        />
        <KPICard
          title="Current Level"
          value={dashboardData?.kpis.currentLevel || 'Beginner'}
          icon={Award}
          color="green"
        />
      </div>

      {/* Progress Overview */}
      {dashboardData?.kpis.totalLessonsAssigned && dashboardData.kpis.totalLessonsAssigned > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Learning Progress</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dashboardData.kpis.averageProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData.kpis.averageProgress}%
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.round((dashboardData.kpis.lessonsCompleted / dashboardData.kpis.totalLessonsAssigned) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((dashboardData.kpis.lessonsCompleted / dashboardData.kpis.totalLessonsAssigned) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.kpis.totalHours}h
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton
          label="Chat with Tutor"
          icon={MessageCircle}
          onClick={() => window.location.href = '/student/messages'}
        />
        <ActionButton
          label="View Schedule"
          icon={Calendar}
          variant="secondary"
          onClick={() => window.location.href = '/student/schedule'}
        />
        <ActionButton
          label="Browse Lessons"
          icon={Play}
          variant="secondary"
          onClick={() => window.location.href = '/student/lessons'}
        />
      </div>

      {/* Upcoming Lessons - REAL DATA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Lessons ({dashboardData?.upcomingLessons.length || 0})
          </h2>
          
          {dashboardData?.upcomingLessons && dashboardData.upcomingLessons.length > 3 && (
            <button
              onClick={() => window.location.href = '/student/lessons'}
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
            >
              View all lessons →
            </button>
          )}
        </div>

        {dashboardData?.upcomingLessons.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lessons assigned yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Contact your tutor to get started with your first lesson
            </p>
            <button
              onClick={() => window.location.href = '/student/messages'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Tutor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.upcomingLessons.slice(0, 6).map((upcomingLesson) => {
              const lessonForCard = convertToLessonCard(upcomingLesson);
              return (
                <div key={upcomingLesson.id} className="relative">
                  <LessonCard lesson={lessonForCard} />
                  
                  {/* Progress overlay for in-progress lessons */}
                  {upcomingLesson.status === 'in_progress' && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                        {upcomingLesson.progress}% complete
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {dashboardData?.recentActivity && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last activity: {new Date(dashboardData.recentActivity).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric', 
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  );
}