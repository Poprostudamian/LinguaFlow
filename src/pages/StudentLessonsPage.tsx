// 📁 Updated File: /src/pages/StudentLessonsPage.tsx
// ✅ FIXED: Uses existing structure with consistent metrics from getStudentMetrics

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
import { useLanguage } from '../contexts/LanguageContext';
import { getStudentLessons, getStudentMetrics } from '../lib/supabase'; // ✅ UPDATED: Added getStudentMetrics

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

type ViewMode = 'grid' | 'list';
type TabFilter = 'all' | 'assigned' | 'in_progress' | 'completed';
type SortOption = 'recent' | 'progress' | 'score' | 'alphabetical';

export function StudentLessonsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  // State
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null); // ✅ UPDATED: Use metrics
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Load lessons and metrics
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

      // ✅ UPDATED: Load both lessons and consistent metrics
      const [lessonsData, metricsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentMetrics(session.user.id)
      ]);

      setLessons(lessonsData);
      setMetrics(metricsData);
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
        const searchLower = searchTerm.toLowerCase();
        const tutorName = `${lesson.lessons.users.first_name} ${lesson.lessons.users.last_name}`;
        return (
          lesson.lessons.title.toLowerCase().includes(searchLower) ||
          lesson.lessons.description?.toLowerCase().includes(searchLower) ||
          tutorName.toLowerCase().includes(searchLower)
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: t.lessons.completed,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: CheckCircle,
          progressColor: 'from-green-500 to-green-600'
        };
      case 'in_progress':
        return {
          label: t.lessons.inProgress,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Clock,
          progressColor: 'from-blue-500 to-purple-500'
        };
      case 'assigned':
        return {
          label: t.lessons.notStarted,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: BookOpen,
          progressColor: 'from-gray-400 to-gray-500'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: BookOpen,
          progressColor: 'from-gray-400 to-gray-500'
        };
    }
  };

  const handleLessonClick = (lesson: StudentLessonData) => {
    navigate(`/student/lessons/${lesson.lesson_id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.lessons.myLessons}
          </h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading lessons...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.lessons.myLessons}
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
            onClick={loadStudentLessons}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.lessons.myLessons}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning progress and continue your lessons.
        </p>
      </div>

      {/* ✅ UPDATED: Statistics Cards with consistent metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.average_score}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Performance on completed lessons
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Average Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.average_progress}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Level: {metrics.current_level}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons or tutors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tabFilter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
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

      {/* Lessons Display */}
      {filteredLessons.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredLessons.map((lesson) => {
            const statusConfig = getStatusConfig(lesson.status);
            const StatusIcon = statusConfig.icon;

            if (viewMode === 'grid') {
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600"
                >
                  {/* Progress Bar Header */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-700">
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
                        <span>{new Date(lesson.assigned_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Progress Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lesson.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            } else {
              // List view
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${statusConfig.progressColor} flex items-center justify-center`}>
                        <StatusIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                          {lesson.lessons.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {lesson.score !== null && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            <Star className="h-3 w-3" />
                            <span>{lesson.score}%</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                        {lesson.lessons.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{lesson.lessons.users.first_name} {lesson.lessons.users.last_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(lesson.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {lesson.progress}%
                      </div>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${statusConfig.progressColor} transition-all duration-500`}
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || tabFilter !== 'all' ? 'No lessons found' : t.lessons.noLessons}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || tabFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Your tutor will assign lessons for you to complete.'
            }
          </p>
        </div>
      )}

      {/* Sort By Dropdown (visible when lessons exist) */}
      {filteredLessons.length > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="progress">Progress</option>
              <option value="score">Score</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}400 mb-1">
                  Total Lessons
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.total_lessons}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.assigned_lessons} assigned, {metrics.in_progress_lessons} in progress
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.completion_rate}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.completed_lessons} lessons completed
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-