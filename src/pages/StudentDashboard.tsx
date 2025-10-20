// 📁 Updated File: /src/pages/StudentDashboard.tsx
// ✅ FIXED: Uses consistent metrics from getStudentDashboardDataV2

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
import { getStudentDashboardDataV2 } from '../lib/supabase'; // ✅ UPDATED: Use V2 function
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

interface StudentDashboardData {
  kpis: {
    lessonsCompleted: number;
    studyStreak: number;
    totalHours: number;
    totalLessonsAssigned: number;
    averageProgress: number;
    averageScore: number;
    completionRate: number;
    currentLevel: string;
  };
  upcomingLessons: StudentLessonData[];
  tutors: any[];
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
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

      // ✅ UPDATED: Use new V2 function with consistent metrics
      const data = await getStudentDashboardDataV2(session.user.id);
      setDashboardData(data);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-200">Error</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <ActionButton
            onClick={loadDashboardData}
            variant="primary"
            size="sm"
            icon={RefreshCw}
          >
            Retry
          </ActionButton>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { kpis, upcomingLessons } = dashboardData;

  // Filter lessons by status for different sections
  const assignedLessons = upcomingLessons.filter(l => l.status === 'assigned').slice(0, 3);
  const inProgressLessons = upcomingLessons.filter(l => l.status === 'in_progress').slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.studentDashboard.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t.studentDashboard.welcome}! Track your learning progress and continue your lessons.
          </p>
        </div>

        {/* KPI Cards - ✅ UPDATED: Clear distinction between metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title={t.studentDashboard.completedLessons}
            value={`${kpis.lessonsCompleted}/${kpis.totalLessonsAssigned}`}
            icon={CheckCircle}
            color="green"
            description={`${kpis.completionRate}% completion rate`}
          />
          <KPICard
            title={t.studentDashboard.averageScore}
            value={`${kpis.averageScore}%`}
            icon={Award}
            color="purple"
            description="Performance on completed lessons"
          />
          <KPICard
            title="Average Progress"
            value={`${kpis.averageProgress}%`}
            icon={TrendingUp}
            color="blue"
            description="Content completion across all lessons"
          />
          <KPICard
            title={t.studentDashboard.hoursLearned}
            value={`${kpis.totalHours}h`}
            icon={Clock}
            color="orange"
            description={`Level: ${kpis.currentLevel}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Assigned Lessons */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  New Assignments
                </h2>
                <ActionButton
                  onClick={() => navigate('/lessons')}
                  variant="ghost"
                  size="sm"
                >
                  {t.studentDashboard.viewAll}
                </ActionButton>
              </div>

              {assignedLessons.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t.studentDashboard.noLessons}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/lesson/${lesson.lesson_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {lesson.lessons.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {lesson.lessons.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-400">
                            <User className="h-3 w-3 mr-1" />
                            {lesson.lessons.users.first_name} {lesson.lessons.users.last_name}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <Play className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Continue Learning / In Progress */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Continue Learning
              </h2>

              {inProgressLessons.length === 0 ? (
                <div className="text-center py-6">
                  <Flame className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No lessons in progress
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/lesson/${lesson.lesson_id}`)}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        {lesson.lessons.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {lesson.progress}% complete
                        </span>
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Your Learning Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Level</span>
                  <span className="font-medium">{kpis.currentLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Completion Rate</span>
                  <span className="font-medium">{kpis.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Average Score</span>
                  <span className="font-medium">{kpis.averageScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <ActionButton
            onClick={() => navigate('/lessons')}
            variant="primary"
            icon={BookOpen}
          >
            Browse All Lessons
          </ActionButton>
          <ActionButton
            onClick={() => navigate('/lessons?filter=completed')}
            variant="secondary"
            icon={Award}
          >
            View Completed Lessons
          </ActionButton>
        </div>
      </div>
    </div>
  );
}