// src/pages/StudentLessonsPage.tsx - MODERN LESSONS LIBRARY

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  BookOpen, 
  Clock, 
  CheckCircle,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  User,
  Zap,
  TrendingUp,
  Award,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
  Star,
  Target,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStudentLessons } from '../lib/supabase';

interface StudentLessonData {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
  score: number | null;
  time_spent: number;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    created_at: string;
    users: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

type ViewMode = 'grid' | 'list';
type TabFilter = 'all' | 'assigned' | 'in_progress' | 'completed';
type SortOption = 'recent' | 'progress' | 'score' | 'alphabetical';

export function StudentLessonsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // State
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Load lessons
  useEffect(() => {
    if (session?.user?.id) {
      loadStudentLessons();
    }
  }, [session?.user?.id]);

  const loadStudentLessons = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getStudentLessons(session.user.id);
      setLessons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort lessons
  const filteredLessons = lessons
    .filter(lesson => {
      // Tab filter
      if (tabFilter !== 'all' && lesson.status !== tabFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const tutorName = `${lesson.lessons.users.first_name} ${lesson.lessons.users.last_name}`;
        return (
          lesson.lessons.title.toLowerCase().includes(query) ||
          lesson.lessons.description?.toLowerCase().includes(query) ||
          tutorName.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'alphabetical':
          return a.lessons.title.localeCompare(b.lessons.title);
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: lessons.length,
    completed: lessons.filter(l => l.status === 'completed').length,
    inProgress: lessons.filter(l => l.status === 'in_progress').length,
    assigned: lessons.filter(l => l.status === 'assigned').length,
    averageProgress: lessons.length > 0 
      ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / lessons.length)
      : 0,
    averageScore: lessons.filter(l => l.score !== null).length > 0
      ? Math.round(
          lessons.filter(l => l.score !== null).reduce((sum, l) => sum + (l.score || 0), 0) / 
          lessons.filter(l => l.score !== null).length
        )
      : null
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  // Lesson Card Component
  const LessonCard = ({ lesson }: { lesson: StudentLessonData }) => {
    const statusConfig = getStatusConfig(lesson.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full bg-gradient-to-r ${
              lesson.status === 'completed'
                ? 'from-green-500 to-green-600'
                : 'from-purple-500 to-blue-500'
            } transition-all duration-500`}
            style={{ width: `${lesson.progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{statusConfig.label}</span>
                </span>
                {lesson.score !== null && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <Star className="h-3 w-3" />
                    <span>{lesson.score}%</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {lesson.lessons.title}
              </h3>
              {lesson.lessons.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {lesson.lessons.description}
                </p>
              )}
            </div>
          </div>

          {/* Tutor & Date Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lesson.assigned_at)}</span>
            </div>
          </div>

          {/* Progress Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {lesson.progress}% complete
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
            className={`w-full bg-gradient-to-r ${statusConfig.actionColor} text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-md hover:scale-105`}
          >
            <PlayCircle className="h-4 w-4" />
            <span>{statusConfig.action}</span>
          </button>
        </div>
      </div>
    );
  };

  // List Item Component
  const LessonListItem = ({ lesson }: { lesson: StudentLessonData }) => {
    const statusConfig = getStatusConfig(lesson.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-pointer">
        <div className="flex items-center space-x-4">
          {/* Progress Circle */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {lesson.progress}%
              </span>
            </div>
          </div>

          {/* Lesson Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {lesson.lessons.title}
              </h3>
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.label}</span>
              </span>
              {lesson.score !== null && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <Star className="h-3 w-3" />
                  <span>{lesson.score}%</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-3.5 w-3.5" />
                <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(lesson.assigned_at)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${
                  lesson.status === 'completed'
                    ? 'from-green-500 to-green-600'
                    : 'from-purple-500 to-blue-500'
                }`}
                style={{ width: `${lesson.progress}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
            className={`px-6 py-2 bg-gradient-to-r ${statusConfig.actionColor} text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex-shrink-0`}
          >
            {statusConfig.action}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning journey and progress
          </p>
        </div>

        <button
          onClick={loadStudentLessons}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading lessons</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Total Lessons
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats.total}
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Completed
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats.completed}
              </p>
            </div>
            <div className="bg-green-200 dark:bg-green-900/40 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Avg Progress
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats.averageProgress}%
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                Avg Score
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.averageScore !== null ? `${stats.averageScore}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-yellow-200 dark:bg-yellow-900/40 p-3 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
          {/* Tab Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'assigned', label: 'Not Started', count: stats.assigned },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabFilter(tab.key as TabFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tabFilter === tab.key
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search, Sort, View Toggle */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-3 pr-8 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="progress">Progress</option>
                <option value="score">Score</option>
                <option value="alphabetical">A-Z</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Display */}
      {filteredLessons.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLessons.map(lesson => (
              <LessonListItem key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || tabFilter !== 'all' ? 'No lessons found' : 'No lessons yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || tabFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Your tutor will assign lessons to you soon. Stay tuned!'}
            </p>
            {(searchTerm || tabFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTabFilter('all');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}