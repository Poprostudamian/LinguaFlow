// src/pages/StudentDashboard.tsx - UPDATED to use real data
import React from 'react';
import { 
  BookOpen, 
  Flame, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { useStudentLessons } from '../contexts/StudentLessonsContext';
import { useAuth } from '../contexts/AuthContext';

export function StudentDashboard() {
  const { lessons, stats, isLoading, error, refreshLessons } = useStudentLessons();
  const { session } = useAuth();

  // Get upcoming lessons (assigned or in_progress)
  const upcomingLessons = lessons.filter(l => 
    l.status === 'assigned' || l.status === 'in_progress'
  ).slice(0, 3);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your learning progress...
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

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
          onClick={refreshLessons}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Dashboard</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshLessons}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Real Data Indicator */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            Live Database Connection
          </span>
        </div>
        <div className="text-green-600 dark:text-green-300 text-sm mt-1">
          Showing real data from your lessons and progress
        </div>
      </div>

      {/* KPI Cards - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Lessons Completed"
          value={stats.completedLessons}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Study Streak"
          value={`${stats.completionRate}%`}
          icon={Flame}
          color="orange"
        />
        <KPICard
          title="Study Time"
          value={`${Math.round(stats.totalStudyTime / 60)}h`}
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
          onClick={() => {
            const inProgressLesson = lessons.find(l => l.status === 'in_progress');
            if (inProgressLesson) {
              alert(`Continue with: ${inProgressLesson.lessons.title}`);
            } else {
              alert('No lessons in progress. Check My Lessons to start a new one!');
            }
          }}
        />
      </div>

      {/* Upcoming Lessons - REAL DATA */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Lessons ({upcomingLessons.length})
        </h2>
        
        {upcomingLessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lessons assigned yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your tutor will assign lessons for you to complete.
            </p>
            <button
              onClick={() => {
                if (session?.user?.id) {
                  // Enable test data creation from console
                  console.log('To create sample lessons, run: createSampleStudentLessons("' + session.user.id + '")');
                  alert('Check the browser console for test data creation commands!');
                }
              }}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Need test data? Check console for helper commands
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.map((lessonData) => (
              <div
                key={lessonData.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-2">
                    {lessonData.lessons.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    lessonData.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {lessonData.status === 'in_progress' ? 'In Progress' : 'New'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  by {lessonData.lessons.users.first_name} {lessonData.lessons.users.last_name}
                </p>
                
                {lessonData.lessons.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {lessonData.lessons.description}
                  </p>
                )}
                
                {lessonData.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{lessonData.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${lessonData.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  <Play className="h-4 w-4" />
                  <span>{lessonData.status === 'in_progress' ? 'Continue' : 'Start Lesson'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}