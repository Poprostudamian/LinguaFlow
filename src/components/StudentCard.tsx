import React from 'react';
import { Student } from '../types';
import { User, BookOpen, Clock } from 'lucide-react';

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.level}</p>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {student.progress}%
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{student.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <BookOpen className="h-4 w-4" />
          <span>{student.lessonsCompleted} lessons</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{student.totalHours}h</span>
        </div>
      </div>
    </div>
  );
}