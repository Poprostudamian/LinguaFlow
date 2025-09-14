// src/components/StudentLessonCard.tsx
import React from 'react';
import { 
  BookOpen, 
  Clock, 
  User, 
  Calendar, 
  Play, 
  CheckCircle, 
  BarChart3,
  Star
} from 'lucide-react';
import { StudentLesson } from '../lib/studentLessons';

interface StudentLessonCardProps {
  lesson: StudentLesson;
  onStartLesson?: (lessonId: string) => void;
  onContinueLesson?: (lessonId: string) => void;
  onViewLesson?: (lessonId: string) => void;
}

export function StudentLessonCard({ 
  lesson, 
  onStartLesson, 
  onContinueLesson, 
  onViewLesson 
}: StudentLessonCardProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          label: 'New',
          icon: BookOpen
        };
      case 'in_progress':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          label: 'In Progress',
          icon: Clock
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          label: 'Completed',
          icon: CheckCircle
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          label: 'Unknown',
          icon: BookOpen
        };
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 60) return 'from-blue-500 to-cyan-500';
    if (progress >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const statusConfig = getStatusConfig(lesson.status);
  const StatusIcon = statusConfig.icon;

  const handleAction = () => {
    switch (lesson.status) {
      case 'assigned':
        onStartLesson?.(lesson.lesson_id);
        break;
      case 'in_progress':
        onContinueLesson?.(lesson.lesson_id);
        break;
      case 'completed':
        onViewLesson?.(lesson.lesson_id);
        break;
    }
  };

  const getActionLabel = () => {
    switch (lesson.status) {
      case 'assigned':
        return 'Start Lesson';
      case 'in_progress':
        return 'Continue';
      case 'completed':
        return 'Review';
    }
  };

  const getActionIcon = () => {
    switch (lesson.status) {
      case 'assigned':
        return Play;
      case 'in_progress':
        return Play;
      case 'completed':
        return BookOpen;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Header */}
      console.log('Lesson data:', lesson);
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
  {lesson.lesson?.title || 'Loading lesson...'}
</h3>
            {lesson.lesson.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {lesson.lesson.description}
              </p>
            )}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center space-x-1 ml-3`}>
            <StatusIcon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Tutor Info */}
        <div className="flex items-center space-x-2 mb-3">
  <User className="h-4 w-4 text-gray-400" />
  <span className="text-sm text-gray-600 dark:text-gray-400">
  {lesson.lesson?.users?.first_name && lesson.lesson?.users?.last_name 
    ? `${lesson.lesson.users.first_name} ${lesson.lesson.users.last_name}`
    : 'Loading tutor...'}
</span>
</div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {lesson.progress}%
            </span>
            {lesson.status === 'completed' && lesson.score && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {lesson.score}/100
                </span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(lesson.progress)} transition-all duration-300`}
              style={{ width: `${lesson.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(lesson.time_spent)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Study Time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(lesson.assigned_at)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
            </div>
          </div>
        </div>

        {/* Completion Info */}
        {lesson.status === 'completed' && lesson.completed_at && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-300">
                Completed on {formatDate(lesson.completed_at)}
              </p>
              {lesson.score && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Score: {lesson.score}/100
                </p>
              )}
            </div>
          </div>
        )}

        {/* In Progress Info */}
        {lesson.status === 'in_progress' && lesson.started_at && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Started on {formatDate(lesson.started_at)}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAction}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <ActionIcon className="h-4 w-4" />
          <span>{getActionLabel()}</span>
        </button>
      </div>
    </div>
  );
}

export default StudentLessonCard;