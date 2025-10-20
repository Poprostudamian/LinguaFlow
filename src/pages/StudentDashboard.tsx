// 📁 Updated File: /src/pages/StudentDashboard.tsx
// ✅ FIXED: Uses existing structure with consistent metrics from getStudentMetrics

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
import { useLanguage } from '../contexts/LanguageContext';
import { getStudentLessons, getStudentMetrics } from '../lib/supabase'; // ✅ UPDATED: Added getStudentMetrics
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

interface StudentMetrics {
  student_id: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  assigned_lessons: number;
  completion_rate: number;
  average_progress: number;
  average_score: number;
  total_study_time_hours: number;
  last_activity: string | null;
  current_level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null); // ✅ UPDATED: Use metrics instead of stats
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

      // ✅ UPDATED: Load both lessons and consistent metrics
      const [lessonsData, metricsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentMetrics(session.user.id) // Use new unified metrics function
      ]);

      setLessons(lessonsData);
      setMetrics(metricsData);

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
  
  // ✅ UPDATED: Calculate streak from metrics
  const studyStreak = metrics ? Math.max(1, Math.ceil(metrics.total_study_time_hours / 2)) : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.studentDashboard.title}
          </h1>
        </div>

        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t.common.loading}
          </span>
        </div>
      </div>
    );
  }

  // Error state
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

      {/* ✅ UPDATED: KPI Cards with consistent metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t.studentDashboard.completedLessons}
          value={`${metrics?.completed_lessons || 0}/${metrics?.total_lessons || 0}`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title={t.studentDashboard.hoursLearned}
          value={Math.round(metrics?.total_study_time_hours || 0)}
          icon={Clock}
          color="blue"
        />
        <KPICard
          title={t.studentDashboard.averageScore}
          value={`${metrics?.average_score || 0}%`}
          icon={Award}
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
                Continue Learning
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons?filter=in_progress')}
              className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
            >
              {t.studentDashboard.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressLessons.map(lesson => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                    {lesson.lessons.title}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {lesson.lessons.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                  </div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {lesson.progress}% complete
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Assignments - Assigned Lessons */}
      {upcomingLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                New Assignments
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/lessons?filter=assigned')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              {t.studentDashboard.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.map(lesson => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {lesson.lessons.title}
                  </h3>
                  <Play className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {lesson.lessons.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                    New
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {metrics && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Your Learning Progress</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Level</p>
              <p className="text-xl font-bold">{metrics.current_level}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Completion Rate</p>
              <p className="text-xl font-bold">{metrics.completion_rate}%</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Average Score</p>
              <p className="text-xl font-bold">{metrics.average_score}%</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Study Time</p>
              <p className="text-xl font-bold">{Math.round(metrics.total_study_time_hours)}h</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t.studentDashboard.noLessons}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your tutor will assign lessons for you to complete.
          </p>
        </div>
      )}
    </div>
  );
}