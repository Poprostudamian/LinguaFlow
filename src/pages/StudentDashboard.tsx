// src/pages/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Flame, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play,
  AlertCircle 
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { LessonCard } from '../components/LessonCard';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStudentLessons, 
  getStudentStats,
  StudentLesson,
  StudentStats 
} from '../lib/supabase';

interface StudentDashboardData {
  lessons: StudentLesson[];
  stats: StudentStats | null;
  loading: boolean;
  error: string | null;
}

export function StudentDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState<StudentDashboardData>({
    lessons: [],
    stats: null,
    loading: true,
    error: null
  });

  const loadStudentData = async () => {
    if (!session?.user?.id) {
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'No authenticated user found' 
      }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load lessons and stats in parallel
      const [lessonsData, statsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentStats(session.user.id)
      ]);

      setData({
        lessons: lessonsData || [],
        stats: statsData,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('❌ Error loading student data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error?.message || 'Failed to load student data'
      }));
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadStudentData();
    }
  }, [session?.user?.id]);

  // Loading state
  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {data.error}
          </p>
          <button
            onClick={loadStudentData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get stats with safe defaults
  const stats = data.stats || {
    total_lessons: 0,
    completed_lessons: 0,
    in_progress_lessons: 0,
    total_study_time_minutes: 0,
    average_progress: 0,
    last_activity: null
  };

  // Get upcoming lessons (in progress and assigned)
  const upcomingLessons = data.lessons.filter(lesson => 
    lesson.status === 'in_progress' || lesson.status === 'assigned'
  );

  // Calculate study streak (placeholder - you can enhance this later)
  const studyStreak = 7; // Default placeholder

  // Convert study time to hours
  const studyHours = Math.round(stats.total_study_time_minutes / 60 * 10) / 10;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning progress and upcoming lessons
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Lessons Completed"
          value={stats.completed_lessons}
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
          value={`${studyHours}h`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton
          label="Chat with Tutor"
          icon={MessageCircle}
          onClick={() => alert('Chat feature coming soon!')}
        />
        <ActionButton
          label="Schedule Lesson"
          icon={Calendar}
          variant="secondary"
          onClick={() => alert('Scheduling feature coming soon!')}
        />
        <ActionButton
          label="Continue Learning"
          icon={Play}
          variant="secondary"
          onClick={() => alert('Learning modules coming soon!')}
        />
      </div>

      {/* Upcoming Lessons */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Lessons
        </h2>
        
        {upcomingLessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Upcoming Lessons
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contact your tutor to get new lessons assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.slice(0, 6).map((lesson) => (
              <LessonCard key={lesson.lesson_id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {stats.total_lessons > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Progress Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.total_lessons}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Lessons
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.average_progress}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.in_progress_lessons}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                In Progress
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}