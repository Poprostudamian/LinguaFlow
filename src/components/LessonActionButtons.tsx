// src/components/LessonActionButtons.tsx - Fixed with consistent routing

import React from 'react';
import { PlayCircle, Zap, CheckCircle, History } from 'lucide-react';

interface LessonActionButtonsProps {
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
  onPrimaryAction: () => void;
  onHistoryAction?: () => void;
  className?: string;
}

interface CompactActionButtonsProps {
  status: 'assigned' | 'in_progress' | 'completed';
  onPrimaryAction: () => void;
  onHistoryAction?: () => void;
}

export function LessonActionButtons({ 
  status, 
  progress, 
  onPrimaryAction, 
  onHistoryAction,
  className = ""
}: LessonActionButtonsProps) {
  
  const buttonConfigs = {
    assigned: {
      icon: PlayCircle,
      label: 'Start Lesson',
      bgColor: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
      textColor: 'text-white',
      description: 'Begin your learning journey'
    },
    in_progress: {
      icon: Zap,
      label: 'Continue Lesson',
      bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      textColor: 'text-white',
      description: `${progress}% complete`
    },
    completed: {
      icon: CheckCircle,
      label: 'Review Lesson',
      bgColor: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
      textColor: 'text-white',
      description: 'View your results'
    }
  };

  const config = buttonConfigs[status];
  const Icon = config.icon;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Action Button */}
      <button
        onClick={onPrimaryAction}
        className={`
          w-full flex items-center justify-center gap-3 
          px-6 py-4 rounded-xl font-semibold text-lg
          ${config.bgColor} ${config.textColor}
          shadow-lg hover:shadow-xl
          transform transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus:ring-4 focus:ring-purple-500/30
        `}
      >
        <Icon className="h-6 w-6" />
        <span>{config.label}</span>
      </button>

      {/* Progress Bar for in-progress lessons */}
      {status === 'in_progress' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-gray-900 dark:text-white font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* History Button for completed lessons */}
      {status === 'completed' && onHistoryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistoryAction();
          }}
          className="
            w-full flex items-center justify-center gap-3 
            px-6 py-3 rounded-xl font-medium
            bg-gray-100 dark:bg-gray-700 
            text-gray-700 dark:text-gray-300
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-200 dark:hover:bg-gray-600
            shadow-md hover:shadow-lg
            transform transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99]
          "
        >
          <History className="h-5 w-5" />
          <span>View History & Results</span>
        </button>
      )}

      {/* Description */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {config.description}
      </p>
    </div>
  );
}

export function CompactLessonActionButtons({ 
  status, 
  onPrimaryAction, 
  onHistoryAction 
}: CompactActionButtonsProps) {
  
  const buttonConfigs = {
    assigned: {
      icon: PlayCircle,
      label: 'Start',
      bgColor: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-white',
    },
    in_progress: {
      icon: Zap,
      label: 'Continue',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
    },
    completed: {
      icon: CheckCircle,
      label: 'Review',
      bgColor: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
    }
  };

  const config = buttonConfigs[status];
  const Icon = config.icon;

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={onPrimaryAction}
        className={`
          flex-1 flex items-center justify-center gap-2 
          px-4 py-2.5 rounded-lg font-semibold text-sm
          ${config.bgColor} ${config.textColor}
          shadow-md hover:shadow-lg
          transform transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
        `}
      >
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </button>

      {status === 'completed' && onHistoryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistoryAction();
          }}
          className="
            flex items-center justify-center gap-2 
            px-4 py-2.5 rounded-lg font-semibold text-sm
            bg-gray-200 dark:bg-gray-700 
            text-gray-700 dark:text-gray-300
            hover:bg-gray-300 dark:hover:bg-gray-600
            border border-gray-300 dark:border-gray-600
            shadow-md hover:shadow-lg
            transform transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
          "
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </button>
      )}
    </div>
  );
}