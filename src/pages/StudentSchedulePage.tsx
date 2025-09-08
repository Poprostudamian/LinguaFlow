import React, { useState } from 'react';
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { studentMockData } from '../data/mockData';

export function StudentSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const upcomingLessons = studentMockData.allLessons.filter(l => l.status === 'upcoming');
  
  // Group lessons by date
  const lessonsByDate = upcomingLessons.reduce((acc, lesson) => {
    const date = lesson.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(lesson);
    return acc;
  }, {} as Record<string, typeof upcomingLessons>);

  const sortedDates = Object.keys(lessonsByDate).sort();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your upcoming lessons and manage your learning schedule
        </p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {upcomingLessons.filter(l => {
                  const lessonDate = new Date(l.date);
                  const today = new Date();
                  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return lessonDate >= today && lessonDate <= weekFromNow;
                }).length} lessons
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Lesson</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {upcomingLessons.length > 0 ? upcomingLessons[0].time : 'None'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <User className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tutors</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Set(upcomingLessons.map(l => l.tutor)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Lessons by Date */}
      <div className="space-y-6">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                isToday(date) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(date)}
                    {isToday(date) && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full">
                        Today
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {lessonsByDate[date].length} lesson{lessonsByDate[date].length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessonsByDate[date].map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No upcoming lessons
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Schedule a lesson with your tutor to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}