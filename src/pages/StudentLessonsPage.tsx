// src/pages/StudentLessonsPage.tsx - BEZ HOOKA, proste rozwiązanie
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle,
  BarChart3,
  Flame,
  Star,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StudentLessonCard } from '../components/StudentLessonCard';
import { KPICard } from '../components/KPICard';
import { DebugDataChecker } from '../components/DebugDataChecker';

interface SimpleStudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  score: number | null;
  time_spent: number;
  progress: number;
  updated_at: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    created_at: string;
    tutor_id: string;
    tutor: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface SimpleStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  assignedLessons: number;
  averageScore: number;
  totalStudyTime: number;
  averageProgress: number;
}

export function StudentLessonsPage() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State dla danych
  const [lessons, setLessons] = useState<SimpleStudentLesson[]>([]);
  const [stats, setStats] = useState<SimpleStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funkcja ładowania danych
  const loadLessons = async () => {
    if (!session.user?.id) {
      console.log('⚠️ No user ID available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading lessons for student:', session.user.id);

      // Proste zapytanie do bazy danych
      const { data, error: queryError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          student_id,
          lesson_id,
          assigned_at,
          started_at,
          completed_at,
          status,
          score,
          time_spent,
          progress,
          updated_at,
          lessons!inner (
            id,
            title,
            description,
            content,
            created_at,
            tutor_id,
            users!lessons_tutor_id_fkey (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('student_id', session.user.id)
        .order('assigned_at', { ascending: false });

      if (queryError) {
        console.error('❌ Query error:', queryError);
        throw queryError;
      }

      console.log('📚 Raw data from database:', data);

      // Przekształć dane
      const transformedLessons: SimpleStudentLesson[] = (data || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id,
        lesson_id: item.lesson_id,
        assigned_at: item.assigned_at,
        started_at: item.started_at,
        completed_at: item.completed_at,
        status: item.status,
        score: item.score,
        time_spent: item.time_spent || 0,
        progress: item.progress || 0,
        updated_at: item.updated_at,
        lesson: {
          id: item.lessons.id,
          title: item.lessons.title,
          description: item.lessons.description,
          content: item.lessons.content || '',
          created_at: item.lessons.created_at,
          tutor_id: item.lessons.tutor_id,
          tutor: {
            first_name: item.lessons.users?.first_name || 'Unknown',
            last_name: item.lessons.users?.last_name || 'Tutor',
            email: item.lessons.users?.email || ''
          }
        }
      }));

      console.log('✅ Transformed lessons:', transformedLessons);

      // Oblicz statystyki
      const totalLessons = transformedLessons.length;
      const completedLessons = transformedLessons.filter(l => l.status === 'completed').length;
      const inProgressLessons = transformedLessons.filter(l => l.status === 'in_progress').length;
      const assignedLessons = transformedLessons.filter(l => l.status === 'assigned').length;
      
      const completedWithScores = transformedLessons.filter(l => l.status === 'completed' && l.score !== null);
      const averageScore = completedWithScores.length > 0 
        ? Math.round(completedWithScores.reduce((sum, l) => sum + (l.score || 0), 0) / completedWithScores.length)
        : 0;
      
      const totalStudyTime = transformedLessons.reduce((sum, l) => sum + l.time_spent, 0);
      const averageProgress = totalLessons > 0 
        ? Math.round(transformedLessons.reduce((sum, l) => sum + l.progress, 0) / totalLessons)
        : 0;

      const calculatedStats: SimpleStats = {
        totalLessons,
        completedLessons,
        inProgressLessons,
        assignedLessons,
        averageScore,
        totalStudyTime,
        averageProgress
      };

      console.log('📊 Calculated stats:', calculatedStats);

      setLessons(transformedLessons);
      setStats(calculatedStats);

    } catch (err: any) {
      console.error('💥 Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Załaduj dane przy starcie
  useEffect(() => {
    loadLessons();
  }, [session.user?.id]);

  // Filtruj lekcje
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Filtruj po statusie
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.status === statusFilter);
    }

    // Filtruj po wyszukiwanym terminie
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lesson => 
        lesson.lesson.title.toLowerCase().includes(searchLower) ||
        lesson.lesson.description?.toLowerCase().includes(searchLower) ||
        `${lesson.lesson.tutor.first_name} ${lesson.lesson.tutor.last_name}`.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [lessons, statusFilter, searchTerm]);

  // Pogrupuj lekcje
  const upcomingLessons = filteredLessons.filter(l => l.status === 'assigned');
  const inProgressLessons = filteredLessons.filter(l => l.status === 'in_progress');
  const completedLessons = filteredLessons.filter(l => l.status === 'completed');

  // Obsługa akcji
  const handleStartLesson = async (lessonId: string) => {
    console.log('🚀 Starting lesson:', lessonId);
    // TODO: Implementuj logikę rozpoczynania lekcji
  };

  const handleContinueLesson = async (lessonId: string) => {
    console.log('▶️ Continuing lesson:', lessonId);
    // TODO: Implementuj logikę kontynuowania lekcji
  };

  const handleViewLesson = async (lessonId: string) => {
    console.log('👁️ Viewing lesson:', lessonId);
    // TODO: Implementuj logikę przeglądania ukończonej lekcji
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
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
            My Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning journey and upcoming sessions
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error Loading Lessons
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={loadLessons}
            className="mt-3 inline-flex items-center space-x-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Lessons
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning journey and upcoming sessions
        </p>
      </div>

      {/* Debug info - usuń to w produkcji */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <strong>Debug:</strong> Found {lessons.length} lessons for user {session.user?.id}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Lessons"
            value={stats.totalLessons.toString()}
            icon={BookOpen}
            color="purple"
          />
          <KPICard
            title="Completed"
            value={stats.completedLessons.toString()}
            icon={CheckCircle}
            color="green"
            subtitle={stats.totalLessons > 0 ? `${Math.round((stats.completedLessons / stats.totalLessons) * 100)}% completed` : undefined}
          />
          <KPICard
            title="Study Time"
            value={`${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m`}
            icon={Clock}
            color="blue"
          />
          <KPICard
            title="Average Score"
            value={stats.averageScore > 0 ? `${stats.averageScore}/100` : 'N/A'}
            icon={Star}
            color="orange"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search lessons, tutors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="assigned">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            onClick={loadLessons}
            className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* New/Assigned Lessons */}
      {upcomingLessons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>New Lessons ({upcomingLessons.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLessons.map((lesson) => (
              <StudentLessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onStartLesson={handleStartLesson}
                onContinueLesson={handleContinueLesson}
                onViewLesson={handleViewLesson}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Lessons */}
      {inProgressLessons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span>In Progress ({inProgressLessons.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressLessons.map((lesson) => (
              <StudentLessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onStartLesson={handleStartLesson}
                onContinueLesson={handleContinueLesson}
                onViewLesson={handleViewLesson}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Lessons */}
      {completedLessons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Completed Lessons ({completedLessons.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedLessons.map((lesson) => (
              <StudentLessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onStartLesson={handleStartLesson}
                onContinueLesson={handleContinueLesson}
                onViewLesson={handleViewLesson}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLessons.length === 0 && !isLoading && (
        <div className="text-center py-12">
          {lessons.length === 0 ? (
            <div>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No lessons assigned yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Your tutor hasn't assigned any lessons yet. Check back later or contact your tutor.
              </p>
              <button
                onClick={loadLessons}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Check for New Lessons</span>
              </button>
            </div>
          ) : (
            <div>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No lessons found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}