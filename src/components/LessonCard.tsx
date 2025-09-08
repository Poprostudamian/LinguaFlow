import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { Lesson } from '../types';

interface LessonCardProps {
  lesson: Lesson;
}

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{lesson.title}</h3>
      
      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(lesson.date).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{lesson.time}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>{lesson.tutor}</span>
        </div>
      </div>
      
      <div className="mt-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          lesson.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
          lesson.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        }`}>
          {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
        </span>
      </div>
    </div>
  );
}