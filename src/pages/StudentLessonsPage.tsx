// src/pages/StudentLessonsPage.tsx - ULEPSZONA WERSJA 2.0

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  User,
  Zap,
  Trophy,
  TrendingUp,
  History,
  ChevronRight,
  Star
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

export function StudentLessonsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

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
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const tutorName = `${lesson.lessons.users.first_name} ${lesson.lessons.users.last_name}`;
    const matchesSearch = lesson.lessons.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || lesson.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: lessons.length,
    assigned: lessons.filter(l => l.status === 'assigned').length,
    inProgress: lessons.filter(l => l.status === 'in_progress').length,
    completed: lessons.filter(l => l.status === 'completed').length,
    totalTime: Math.round(lessons.reduce((sum, l) => sum + l.time_spent, 0) / 60),
    avgScore: lessons.filter(l => l.score !== null).length > 0 
      ? Math.round(lessons.filter(l => l.score !== null).reduce((sum, l) => sum + (l.score || 0), 0) / lessons.filter(l => l.score !== null).length)
      : 0
  };

  const handleLessonClick = (lesson: StudentLessonData) => {
    if (lesson.status === 'completed') {
      navigate(`/student/lessons/${lesson.lesson_id}`);
    } else {
      navigate(`/student/lessons/${lesson.lesson_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
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
            Track your learning progress and continue where you left off
          </p>
        </div>
        
        <button
          onClick={loadStudentLessons}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">Error loading lessons</p>
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="h-6 w-6 opacity-80" />
            <span className="text-3xl font-bold">{stats.total}</span>
          </div>
          <p className="text-purple-100 text-sm font-medium">Total Lessons</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-6 w-6 opacity-80" />
            <span className="text-3xl font-bold">{stats.inProgress}</span>
          </div>
          <p className="text-blue-100 text-sm font-medium">In Progress</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-6 w-6 opacity-80" />
            <span className="text-3xl font-bold">{stats.completed}</span>
          </div>
          <p className="text-green-100 text-sm font-medium">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="h-6 w-6 opacity-80" />
            <span className="text-3xl font-bold">{stats.avgScore}%</span>
          </div>
          <p className="text-amber-100 text-sm font-medium">Avg Score</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search lessons or tutors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1 shadow-sm">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'assigned', label: 'New', count: stats.assigned },
            { key: 'in_progress', label: 'Active', count: stats.inProgress },
            { key: 'completed', label: 'Done', count: stats.completed }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                activeFilter === filter.key
                  ? 'bg-purple-700 text-purple-100'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No lessons found' : 'No lessons yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm 
              ? 'Try adjusting your search or filters'
              : 'Your tutor will assign lessons soon'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLessons.map((lesson) => (
            <LessonCard 
              key={lesson.id} 
              lesson={lesson} 
              onClick={() => handleLessonClick(lesson)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Lesson Card Component
interface LessonCardProps {
  lesson: StudentLessonData;
  onClick: () => void;
}

function LessonCard({ lesson, onClick }: LessonCardProps) {
  const statusConfig = {
    assigned: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: PlayCircle,
      label: 'New',
      action: 'Start Lesson'
    },
    in_progress: {
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: Zap,
      label: 'In Progress',
      action: 'Continue'
    },
    completed: {
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      label: 'Completed',
      action: 'Review'
    }
  };

  const config = statusConfig[lesson.status];
  const StatusIcon = config.icon;

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Status Bar */}
      <div className={`h-2 ${config.color}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {lesson.lessons.title}
            </h3>
            {lesson.lessons.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {lesson.lessons.description}
              </p>
            )}
          </div>
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 ${config.bgColor} ${config.borderColor} border rounded-full`}>
            <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
            <span className={`text-xs font-semibold ${config.textColor}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {lesson.progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Progress</span>
              <span className="font-bold">{lesson.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  lesson.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${lesson.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {lesson.lessons.users.first_name} {lesson.lessons.users.last_name}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {new Date(lesson.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {lesson.time_spent > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{Math.round(lesson.time_spent / 60)} min</span>
            </div>
          )}

          {lesson.score !== null && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Star className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="font-semibold">{lesson.score}%</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          <button 
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-sm group-hover:shadow-md"
          >
            <StatusIcon className="h-5 w-5" />
            <span>{config.action}</span>
          </button>

          {lesson.status === 'completed' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/student/lessons/${lesson.lesson_id}/history`;
              }}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors border border-gray-300 dark:border-gray-600 flex items-center space-x-2"
            >
              <History className="h-5 w-5" />
              <span>History</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}