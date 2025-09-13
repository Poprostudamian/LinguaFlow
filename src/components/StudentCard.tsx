// src/components/StudentCard.tsx - FIXED EXPORT
import React from 'react';
import { User, BookOpen, Clock, Mail, Calendar } from 'lucide-react';

// Rozszerzone interface dla Student
export interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
  // Opcjonalne nowe pola
  avatar_url?: string;
  joinedDate?: string;
  lastActivity?: string;
}

interface StudentCardProps {
  student: Student;
  showActions?: boolean;
  onSendMessage?: (studentId: string) => void;
  onViewProfile?: (studentId: string) => void;
}

// ✅ MAIN EXPORT - Ensure this is exactly correct
export function StudentCard({ 
  student, 
  showActions = false, 
  onSendMessage, 
  onViewProfile 
}: StudentCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 60) return 'from-blue-500 to-cyan-500';
    if (progress >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            {student.avatar_url ? (
              <img 
                src={student.avatar_url} 
                alt={student.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {student.name}
            </h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              <span className="truncate">{student.email}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Level: {student.level}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {student.progress}%
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Progress
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(student.progress)} transition-all duration-300`}
            style={{ width: `${student.progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {student.lessonsCompleted}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {student.totalHours}h
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
          </div>
        </div>
      </div>
      
      {/* Additional Info */}
      {(student.joinedDate || student.lastActivity) && (
        <div className="mb-4 space-y-1">
          {student.joinedDate && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Joined: {formatDate(student.joinedDate)}</span>
            </div>
          )}
          {student.lastActivity && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Last active: {formatDate(student.lastActivity)}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      {showActions && (onSendMessage || onViewProfile) && (
        <div className="flex space-x-2">
          <button
            onClick={() => onSendMessage?.(student.id)}
            className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <Mail className="h-4 w-4" />
            <span>Message</span>
          </button>
          <button
            onClick={() => onViewProfile?.(student.id)}
            className="flex-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ✅ ALSO ADD DEFAULT EXPORT (Alternative Import Pattern)
export default StudentCard;