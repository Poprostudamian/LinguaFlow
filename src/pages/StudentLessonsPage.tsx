// src/pages/StudentLessonsPage.tsx - FIXED: Review Lesson navigation path

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  User,
  Play,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudentLessons } from '../lib/supabase';

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

export function StudentLessonsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    if (session?.user?.id) {
      loadLessons();
    }
  }, [session?.user?.id]);

  const loadLessons = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const lessonsData = await getStudentLessons(session.user.id);
      setLessons(lessonsData);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort lessons
  const filteredLessons = lessons
    .filter((lesson) => {
      // Status filter
      if (statusFilter !== 'all' && lesson.status !== statusFilter) {
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

  // ✅ FIXED: Calculate stats with proper score handling
  const stats = {
    total: lessons.length,
    completed: lessons.filter(l => l.status === 'completed').length,
    inProgress: lessons.filter(l => l.status === 'in_progress').length,
    assigned: lessons.filter(l => l.status === 'assigned').length,
    averageProgress: lessons.length > 0 
      ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / lessons.length)
      : 0,
    // ✅ FIXED: Only calculate average score from completed lessons with actual scores
    averageScore: (() => {
      const completedWithScores = lessons.filter(l => l.status === 'completed' && l.score !== null);
      return completedWithScores.length > 0
        ? Math.round(completedWithScores.reduce((sum, l) => sum + (l.score || 0), 0) / completedWithScores.length)
        : null;
    })()
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          action: 'Review Lesson',
          actionColor: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        };
      case 'in_progress':
        return {
          icon: Play,
          label: 'In Progress',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
          action: 'Continue',
          actionColor: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Assigned',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          action: 'Start Lesson',
          actionColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        };
    }
  };

  // Lesson Card Component
  const LessonCard = ({ lesson }: { lesson: StudentLessonData }) => {
    const statusConfig = getStatusConfig(lesson.status, lesson.progress);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full bg-gradient-to-r ${
              lesson.status === 'completed'
                ? 'from-green-500 to-emerald-500'
                : lesson.status === 'in_progress'
                ? 'from-purple-500 to-purple-600'
                : 'from-blue-500 to-blue-600'
            }`}
            style={{ width: `${lesson.progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {lesson.lessons.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>
                  {lesson.lessons.users.first_name} {lesson.lessons.users.last_name}
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center space-x-1`}>
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </div>
          </div>

          {/* Description */}
          {lesson.lessons.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {lesson.lessons.description}
            </p>
          )}

          {/* Progress and Score */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {lesson.progress}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {/* ✅ FIXED: Show actual score for completed lessons, progress for others */}
                {lesson.status === 'completed' && lesson.score !== null 
                  ? `${lesson.score}%` 
                  : lesson.status === 'completed' 
                    ? 'N/A'
                    : `${lesson.progress}%`
                }
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {lesson.status === 'completed' ? 'Score' : 'Progress'}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (lesson.status === 'completed') {
                // ✅ FIXED: Use correct path with 'lessons' (plural) to match App.tsx route
                navigate(`/student/lessons/${lesson.lesson_id}/history`);
              } else {
                // ✅ FIXED: Use correct path with 'lessons' (plural) to match App.tsx route  
                navigate(`/student/lessons/${lesson.lesson_id}`);
              }
            }}
            className={`w-full bg-gradient-to-r ${statusConfig.actionColor} text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium`}
          >
            <StatusIcon className="h-4 w-4" />
            <span>{statusConfig.action}</span>
          </button>

          {/* Assignment Date */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Assigned {formatDate(lesson.assigned_at)}</span>
              </div>
              {lesson.status === 'completed' && lesson.score && (
                <div className="flex items-center space-x-1">
                  <Award className="h-3 w-3" />
                  <span>Score: {lesson.score}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading lessons...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Lessons</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={loadLessons}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning progress and continue your education journey
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <BookOpen className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.inProgress}</p>
            </div>
            <Play className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.averageProgress}%</p>
            </div>
            <BarChart3 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.averageScore ? `${stats.averageScore}%` : 'N/A'}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="progress">Progress</option>
              <option value="score">Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Lessons Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Your tutor hasn\'t assigned any lessons yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}