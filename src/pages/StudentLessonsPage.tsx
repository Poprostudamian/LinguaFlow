// src/pages/StudentLessonsPage.tsx - Wersja z debugowaniem

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  User,
  FileText,
  Zap
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
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    console.log('🔍 StudentLessonsPage: session changed', session?.user?.id);
    if (session?.user?.id) {
      loadStudentLessons();
    }
  }, [session?.user?.id]);

  const loadStudentLessons = async () => {
    if (!session?.user?.id) {
      console.log('❌ No user session');
      return;
    }

    try {
      console.log('📚 Loading lessons for student:', session.user.id);
      setIsLoading(true);
      setError(null);
      
      const data = await getStudentLessons(session.user.id);
      console.log('✅ Loaded lessons:', data);
      setLessons(data);
      
    } catch (err: any) {
      console.error('❌ Error loading student lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const tutorName = `${lesson.lessons.users.first_name} ${lesson.lessons.users.last_name}`;
    const matchesSearch = lesson.lessons.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingLessons = filteredLessons.filter(l => l.status === 'assigned');
  const inProgressLessons = filteredLessons.filter(l => l.status === 'in_progress');
  const completedLessons = filteredLessons.filter(l => l.status === 'completed');

  console.log('📊 Lessons summary:', {
    total: lessons.length,
    filtered: filteredLessons.length,
    upcoming: upcomingLessons.length,
    inProgress: inProgressLessons.length,
    completed: completedLessons.length
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning journey and upcoming sessions
          </p>
        </div>
        
        <button
          onClick={loadStudentLessons}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Debug Info:</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>User ID: {session?.user?.id || 'None'}</p>
            <p>User Role: {session?.user?.role || 'None'}</p>
            <p>Total Lessons: {lessons.length}</p>
            <p>Filtered Lessons: {filteredLessons.length}</p>
          </div>
        </div>
      )}

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
          <button
            onClick={loadStudentLessons}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{lessons.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{inProgressLessons.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{completedLessons.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{upcomingLessons.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search lessons or tutors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="assigned">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {lessons.length === 0 ? 'No lessons assigned yet' : 'No lessons match your search'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {lessons.length === 0 
              ? 'Your tutors will assign lessons to you soon!'
              : 'Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lessonData) => (
            <div
              key={lessonData.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {lessonData.lessons.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lessonData.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : lessonData.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {lessonData.status === 'assigned' ? 'Not Started' : 
                       lessonData.status === 'in_progress' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>

                  {lessonData.lessons.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {lessonData.lessons.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>
                        {lessonData.lessons.users.first_name} {lessonData.lessons.users.last_name}
                      </span>
                    </span>
                    
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Assigned {new Date(lessonData.assigned_at).toLocaleDateString()}
                      </span>
                    </span>
                    
                    {lessonData.progress > 0 && (
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{lessonData.progress}% complete</span>
                      </span>
                    )}
                    
                    {lessonData.score !== null && (
                      <span className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Score: {lessonData.score}%</span>
                      </span>
                    )}
                    
                    {lessonData.time_spent > 0 && (
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(lessonData.time_spent / 60)} min</span>
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {lessonData.progress > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          lessonData.status === 'completed' 
                            ? 'bg-green-500' 
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${lessonData.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => {
                      console.log('🎯 Navigating to lesson:', lessonData.lesson_id);
                      navigate(`/student/lessons/${lessonData.lesson_id}`);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      lessonData.status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                        : lessonData.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                        : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
                    }`}
                  >
                    {lessonData.status === 'assigned' ? (
                      <span className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4" />
                        <span>Start Lesson</span>
                      </span>
                    ) : lessonData.status === 'in_progress' ? (
                      <span className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>Continue</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Review</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}