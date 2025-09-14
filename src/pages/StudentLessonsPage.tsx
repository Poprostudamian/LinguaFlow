// src/pages/StudentLessonsPage.tsx - UPDATED VERSION WITH REAL DATABASE DATA
import React, { useState } from 'react';
import { Search, Filter, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, Play, FileText } from 'lucide-react';
import { useStudentLessons } from '../contexts/StudentLessonsContext';

export function StudentLessonsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { 
    lessons, 
    stats, 
    isLoading, 
    error, 
    refreshLessons, 
    getLessonsByStatus, 
    searchLessons,
    startLesson
  } = useStudentLessons();

  // Apply filters
  const filteredByStatus = getLessonsByStatus(statusFilter);
  const finalFilteredLessons = searchTerm 
    ? searchLessons(searchTerm).filter(lesson => 
        statusFilter === 'all' || lesson.status === statusFilter
      )
    : filteredByStatus;

  const handleStartLesson = async (lessonId: string) => {
    try {
      await startLesson(lessonId);
    } catch (error) {
      console.error('Error starting lesson:', error);
      alert('Failed to start lesson. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your lessons...
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lessons...</span>
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
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Lessons</h3>
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
          onClick={refreshLessons}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Real Data Indicator */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            Live Database Connection
          </span>
        </div>
        <div className="text-green-600 dark:text-green-300 text-sm mt-1">
          Showing {lessons.length} lessons from database
        </div>
      </div>

      {/* Stats Overview - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalLessons}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.upcomingLessons}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.completedLessons}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Study Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {Math.round(stats.totalStudyTime / 60)}h
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search lessons or tutors..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none min-w-[120px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="assigned">Upcoming</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Lessons List - REAL DATA */}
      {finalFilteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No matching lessons found' : 'No lessons assigned yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Your tutor will assign lessons for you to complete.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {finalFilteredLessons.map((lessonData) => (
            <div
              key={lessonData.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {lessonData.lessons.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {lessonData.lessons.users.first_name} {lessonData.lessons.users.last_name}
                      </p>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lessonData.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : lessonData.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {lessonData.status === 'assigned' ? 'Upcoming' : 
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
                    
                    {lessonData.score && (
                      <span className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Score: {lessonData.score}/100</span>
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
                        className={`h-2 rounded-full ${
                          lessonData.status === 'completed' 
                            ? 'bg-green-600' 
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${lessonData.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="ml-4">
                  {lessonData.status === 'assigned' && (
                    <button
                      onClick={() => handleStartLesson(lessonData.lesson_id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Lesson</span>
                    </button>
                  )}
                  
                  {lessonData.status === 'in_progress' && (
                    <button
                      onClick={() => handleStartLesson(lessonData.lesson_id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Continue</span>
                    </button>
                  )}
                  
                  {lessonData.status === 'completed' && (
                    <button
                      onClick={() => handleStartLesson(lessonData.lesson_id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}