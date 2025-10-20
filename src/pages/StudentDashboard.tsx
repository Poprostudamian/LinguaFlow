// src/pages/StudentDashboard.tsx - Z PEŁNYMI TŁUMACZENIAMI

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
  ArrowRight,
  TrendingUp,
  Award,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
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
  const { t } = useLanguage(); // ← DODANE
  
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

  // Helper function to get status config - ZAMIENIONE NA TŁUMACZENIA
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          label: t.lessons.notStarted, // ← TŁUMACZENIE
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: BookOpen,
          action: t.lessons.startLesson, // ← TŁUMACZENIE
          actionColor: 'from-blue-600 to-blue-700'
        };
      case 'in_progress':
        return {
          label: t.lessons.inProgress, // ← TŁUMACZENIE
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          icon: Zap,
          action: t.lessons.continueLesson, // ← TŁUMACZENIE
          actionColor: 'from-purple-600 to-purple-700'
        };
      case 'completed':
        return {
          label: t.lessons.completed, // ← TŁUMACZENIE
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: CheckCircle,
          action: t.lessons.reviewLesson, // ← TŁUMACZENIE
          actionColor: 'from-green-600 to-green-700'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          action: t.lessons.viewLesson, // ← TŁUMACZENIE
          actionColor: 'from-gray-600 to-gray-700'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.studentDashboard.title}
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">{t.common.error}</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            {t.common.loading}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.studentDashboard.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.studentDashboard.welcome}, {session.user?.first_name}! 👋
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t.studentDashboard.completedLessons}
          value={stats?.completed_lessons || 0}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title={t.studentDashboard.hoursLearned}
          value={Math.floor((stats?.total_study_time_minutes || 0) / 60)}
          icon={Clock}
          color="blue"
        />
        <KPICard
          title={t.studentDashboard.averageScore}
          value={`${Math.round(stats?.average_progress || 0)}%`}
          icon={TrendingUp}
          color="purple"
        />
        <KPICard
          title={t.studentDashboard.currentStreak}
          value={studyStreak}
          suffix={t.studentDashboard.days}
          icon={Flame}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionButton
          icon={BookOpen}
          label={t.nav.lessons}
          description={`${lessons.length} ${t.lessons.assignedLessons.toLowerCase()}`}
          onClick={() => navigate('/student/lessons')}
          color="purple"
        />
        <ActionButton
          icon={Calendar}
          label={t.nav.schedule}
          description={t.schedule.upcomingMeetings}
          onClick={() => navigate('/student/schedule')}
          color="blue"
        />
        <ActionButton
          icon={MessageCircle}
          label={t.nav.messages}
          description={t.messages.conversations}
          onClick={() => navigate('/student/messages')}
          color="green"
        />
      </div>

      {/* Continue Learning - In Progress Lessons */}
      {inProgressLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.lessons.continueLesson}
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>{t.studentDashboard.viewAll}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {inProgressLessons.map((lesson) => {
              const statusConfig = getStatusConfig(lesson.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {lesson.lessons.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center space-x-1`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(lesson.assigned_at)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lesson.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {lesson.progress}%
                        </span>
                      </div>
                    </div>
                    
                    <button
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/lessons/${lesson.lesson_id}`);
                      }}
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
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.studentDashboard.upcomingLessons}
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>{t.studentDashboard.viewAll}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingLessons.map((lesson) => {
              const statusConfig = getStatusConfig(lesson.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center space-x-1`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>
                  
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {lesson.lessons.title}
                  </h3>
                  
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
                  
                  <button
                    className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/lessons/${lesson.lesson_id}`);
                    }}
                  >
                    <Play className="h-4 w-4" />
                    <span>{statusConfig.action}</span>
                  </button>
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
                {t.studentDashboard.completedLessons}
              </h2>
            </div> 
            <button
              onClick={() => navigate('/student/lessons')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
            >
              <span>{t.studentDashboard.viewAll}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}/history`)}
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                    {lesson.score}%
                  </span>
                </div>
                
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {lesson.lessons.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{lesson.lessons.users.first_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t.lessons.completed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t.studentDashboard.noLessons}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t.lessons.noLessons}
          </p>
        </div>
      )}
    </div>
  );
}