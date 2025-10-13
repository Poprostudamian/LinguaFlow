// src/pages/StudentDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  ArrowRight,
  TrendingUp,
  Award,
  Target,
  Zap
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

export function YourPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      {/* Zamień hardcoded teksty na t.section.key */}
      <h1>{t.studentDashboard.title}</h1>
      <p>{t.studentDashboard.welcome}</p>
      <button>{t.common.save}</button>
    </div>
  );
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

  // Calculate display data
  const upcomingLessons = lessons.filter(l => l.status === 'assigned').slice(0, 3);
  const inProgressLessons = lessons.filter(l => l.status === 'in_progress').slice(0, 3);
  const completedLessons = lessons.filter(l => l.status === 'completed').slice(0, 3);
  
  // Calculate streak
  const studyStreak = stats 
    ? Math.min(Math.floor(stats.total_study_time_minutes / 60), 30) 
    : 0;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          label: 'Not Started',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: BookOpen,
          action: 'Start Lesson',
          actionColor: 'from-blue-600 to-blue-700'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          icon: Zap,
          action: 'Continue',
          actionColor: 'from-purple-600 to-purple-700'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: CheckCircle,
          action: 'Review',
          actionColor: 'from-green-600 to-green-700'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          action: 'View',
          actionColor: 'from-gray-600 to-gray-700'
        };
    }
  };

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning progress and continue your journey
          </p>
        </div>
        
        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Achievement Banner (if streak > 0) */}
      {studyStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
              <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                {studyStreak} Day Streak! 🔥
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Keep up the great work! You're on fire!
              </p>
            </div>
            <Award className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
        </div>
      )}

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

      {/* Quick Actions */}
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

      {/* In Progress Lessons - Priority Section */}
      {inProgressLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Continue Learning
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressLessons.map((lesson) => {
              const statusConfig = getStatusConfig(lesson.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={lesson.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Progress Bar */}
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                      style={{ width: `${lesson.progress}%` }}
                    />
                  </div>

                  <div className="p-5">
                    {/* Header with Status */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusConfig.label}</span>
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {lesson.progress}% done
                      </span>
                    </div>

                    {/* Lesson Info */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {lesson.lessons.title}
                    </h3>
                    
                    {lesson.lessons.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {lesson.lessons.description}
                      </p>
                    )}

                    {/* Tutor Info */}
                    <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                      className={`w-full bg-gradient-to-r ${statusConfig.actionColor} text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-md hover:scale-105`}
                    >
                      <Play className="h-4 w-4" />
                      <span>{statusConfig.action}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upcoming Lessons
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => {
              const statusConfig = getStatusConfig(lesson.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                  onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {lesson.lessons.title}
                        </h3>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(lesson.assigned_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/lessons/${lesson.lesson_id}`);
                      }}
                    >
                      <Play className="h-4 w-4" />
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Completed - Achievement Section */}
      {completedLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recently Completed
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                      {lesson.lessons.title}
                    </h3>
                    {lesson.score && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Score: {lesson.score}/100
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Completed {formatDate(lesson.assigned_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-purple-100 dark:bg-purple-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No lessons yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your tutor will assign you lessons soon. In the meantime, explore the platform!
            </p>
            <button
              onClick={() => navigate('/student/messages')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact Your Tutor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}