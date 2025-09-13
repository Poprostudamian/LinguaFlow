// src/components/StudentLessonCard.tsx
import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  PlayCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StudentLessonCardProps {
  lesson: {
    lesson_id: string;
    student_id: string;
    status: 'assigned' | 'in_progress' | 'completed';
    progress: number;
    assigned_at: string;
    completed_at?: string | null;
    updated_at: string;
    title: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_duration_minutes: number;
  };
  onStart?: (lessonId: string) => void;
  onContinue?: (lessonId: string) => void;
}

export function StudentLessonCard({ lesson, onStart, onContinue }: StudentLessonCardProps) {
  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (lesson.status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getDifficultyColor = () => {
    switch (lesson.difficulty) {
      case 'advanced':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAction = () => {
    if (lesson.status === 'assigned') {
      onStart?.(lesson.lesson_id);
    } else if (lesson.status === 'in_progress') {
      onContinue?.(lesson.lesson_id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {lesson.title}
            </h3>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor()}`}>
            {lesson.status.replace('_', ' ')}
          </div>
        </div>

        {/* Description */}
        {lesson.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {lesson.description}
          </p>
        )}

        {/* Progress bar for in-progress lessons */}
        {lesson.status === 'in_progress' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {lesson.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${lesson.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta information */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{lesson.estimated_duration_minutes}min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Assigned {formatDate(lesson.assigned_at)}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs capitalize ${getDifficultyColor()}`}>
            {lesson.difficulty}
          </div>
        </div>

        {/* Action button */}
        {lesson.status !== 'completed' && (
          <button
            onClick={handleAction}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <PlayCircle className="h-4 w-4" />
            <span>
              {lesson.status === 'assigned' ? 'Start Lesson' : 'Continue'}
            </span>
          </button>
        )}

        {/* Completion info */}
        {lesson.status === 'completed' && lesson.completed_at && (
          <div className="flex items-center justify-center text-sm text-green-600 dark:text-green-400 font-medium">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed on {formatDate(lesson.completed_at)}
          </div>
        )}
      </div>
    </div>
  );
}