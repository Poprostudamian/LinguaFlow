// src/pages/StudentLessonsPage.tsx - Updated for consistent score calculation

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

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get status config
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
                navigate(`/student/lesson/${lesson.lesson_id}/history`);
              } else {
                navigate(`/student/lesson/${lesson.lesson_id}`);
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
          <span className="text-gray-600 dark:text-gray-300">Loading lessons...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Lessons</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadLessons}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
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
          {t.lessons.myLessons}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and continue learning
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inProgress}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Progress</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.averageProgress}%</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {/* ✅ FIXED: Show actual average score or N/A */}
            {stats.averageScore !== null ? `${stats.averageScore}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="assigned">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="progress">Progress</option>
            <option value="score">Score</option>
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {lessons.length === 0 ? t.lessons.noLessons : 'No lessons found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {lessons.length === 0 
              ? 'Contact your tutor to get started with your first lesson.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      )}
    </div>
  );
}