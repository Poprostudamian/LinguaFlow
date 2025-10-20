// 📁 Updated File: /src/pages/StudentLessonsPage.tsx
// ✅ FIXED: Uses consistent metrics from getStudentMetrics

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Play, 
  CheckCircle, 
  Clock, 
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudentLessons, getStudentMetrics } from '../lib/supabase'; // ✅ UPDATED: Use getStudentMetrics
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

export function StudentLessonsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null); // ✅ UPDATED: Use metrics instead of separate stats
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    if (session?.user?.id) {
      loadLessonsData();
    }
  }, [session?.user?.id]);

  const loadLessonsData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // ✅ UPDATED: Load both lessons and unified metrics
      const [lessonsData, metricsData] = await Promise.all([
        getStudentLessons(session.user.id),
        getStudentMetrics(session.user.id)
      ]);

      setLessons(lessonsData);
      setMetrics(metricsData);

    } catch (err: any) {
      console.error('Error loading lessons data:', err);
      setError(err.message || 'Failed to load lessons data');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'assigned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'assigned':
        return BookOpen;
      default:
        return BookOpen;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading lessons...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-200">Error</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <ActionButton
            onClick={loadLessonsData}
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.lessons.myLessons}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your learning journey and track your progress.
          </p>
        </div>

        {/* ✅ UPDATED: Consistent KPI Cards using unified metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Lessons"
              value={`${metrics.total_lessons}`}
              icon={BookOpen}
              color="blue"
              description={`${metrics.assigned_lessons} assigned, ${metrics.in_progress_lessons} in progress`}
            />
            <KPICard
              title="Completion Rate"
              value={`${metrics.completion_rate}%`}
              icon={Target}
              color="green"
              description={`${metrics.completed_lessons} lessons completed`}
            />
            <KPICard
              title="Average Score"
              value={`${metrics.average_score}%`}
              icon={Award}
              color="purple"
              description="Performance on completed lessons"
            />
            <KPICard
              title="Average Progress"
              value={`${metrics.average_progress}%`}
              icon={TrendingUp}
              color="orange"
              description={`Level: ${metrics.current_level}`}
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lessons or tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="progress">Progress</option>
              <option value="score">Score</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No lessons found' : t.lessons.noLessons}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Wait for your tutor to assign lessons'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLessons.map((lesson) => {
                const StatusIcon = getStatusIcon(lesson.status);
                
                return (
                  <div
                    key={lesson.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/lesson/${lesson.lesson_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {lesson.lessons.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {lesson.status.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {lesson.lessons.description}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>
                              {lesson.lessons.users.first_name} {lesson.lessons.users.last_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Assigned {new Date(lesson.assigned_at).toLocaleDateString()}
                            </span>
                          </div>

                          {lesson.status === 'completed' && lesson.score && (
                            <div className="flex items-center space-x-1">
                              <Award className="h-4 w-4" />
                              <span>Score: {lesson.score}%</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {lesson.status !== 'assigned' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-300">Progress</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {lesson.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${lesson.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex items-center">
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lesson/${lesson.lesson_id}`);
                          }}
                          variant={lesson.status === 'assigned' ? 'primary' : 'secondary'}
                          size="sm"
                          icon={lesson.status === 'assigned' ? Play : ArrowRight}
                        >
                          {lesson.status === 'assigned' 
                            ? t.lessons.startLesson
                            : lesson.status === 'completed'
                            ? t.lessons.reviewLesson
                            : t.lessons.continueLesson
                          }
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}