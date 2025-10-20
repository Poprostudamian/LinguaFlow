// src/pages/StudentLessonsPage.tsx - Z PEŁNYMI TŁUMACZENIAMI

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
import { getStudentLessons, getStudentStats } from '../lib/supabase';

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
  const { t } = useLanguage(); // ← DODANE
  
  // State
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [averageScoreFromAPI, setAverageScoreFromAPI] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Load lessons and stats
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

      // ✅ Load both lessons and stats in parallel for consistency
      const [lessonsData, statsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentStats(session.user.id)
      ]);

      setLessons(lessonsData);
      setAverageScoreFromAPI(statsData.average_score);
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
    // ✅ Use centralized calculation from API instead of local calculation
    averageScore: averageScoreFromAPI
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get status config - ZAMIENIONE NA TŁUMACZENIA
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          label: t.lessons.notStarted,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: BookOpen,
          action: t.lessons.startLesson,
          actionColor: 'from-blue-600 to-blue-700'
        };
      case 'in_progress':
        return {
          label: t.lessons.inProgress,
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          icon: Zap,
          action: t.lessons.continueLesson,
          actionColor: 'from-purple-600 to-purple-700'
        };
      case 'completed':
        return {
          label: t.lessons.completed,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: CheckCircle,
          action: t.lessons.reviewLesson,
          actionColor: 'from-green-600 to-green-700'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          action: t.lessons.viewLesson,
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
                  {lesson.progress}% {t.lessonViewer.complete}
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
          <p className="text-gray-600 dark:text-gray-400">{t.common.loading}</p>
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
            {t.lessons.myLessons}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.studentDashboard.progress}
          </p>
        </div>

        <button
          onClick={loadStudentLessons}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t.common.loading}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">{t.lessons.assignedLessons}</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.assigned}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">{t.lessons.inProgress}</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.inProgress}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">{t.lessons.completed}</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">{t.studentDashboard.averageScore}</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.students.searchStudents}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            {/* Tab Filters */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTabFilter('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tabFilter === 'all'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.students.allLevels}
              </button>
              <button
                onClick={() => setTabFilter('assigned')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tabFilter === 'assigned'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.lessons.notStarted}
              </button>
              <button
                onClick={() => setTabFilter('in_progress')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tabFilter === 'in_progress'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.lessons.inProgress}
              </button>
              <button
                onClick={() => setTabFilter('completed')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tabFilter === 'completed'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.lessons.completed}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
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
              {searchTerm || tabFilter !== 'all' ? t.lessons.noLessons : t.studentDashboard.noLessons}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || tabFilter !== 'all'
                ? t.common.filter
                : t.lessons.noLessons}
            </p>
            {(searchTerm || tabFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTabFilter('all');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                {t.common.filter}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}