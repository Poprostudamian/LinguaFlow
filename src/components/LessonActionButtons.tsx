// src/components/LessonActionButtons.tsx
// Komponent z ulepszonymi przyciskami akcji dla lekcji studenta

import React from 'react';
import { 
  PlayCircle, 
  Zap, 
  CheckCircle, 
  History,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface LessonActionButtonsProps {
  status: 'assigned' | 'in_progress' | 'completed';
  onPrimaryAction: () => void;
  onHistoryAction?: () => void;
  progress?: number;
}

export function LessonActionButtons({ 
  status, 
  onPrimaryAction, 
  onHistoryAction,
  progress = 0 
}: LessonActionButtonsProps) {
  
  const buttonConfigs = {
    assigned: {
      icon: PlayCircle,
      label: 'Start Lesson',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      hoverGradient: 'hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700',
      shadow: 'shadow-purple-500/50',
      hoverShadow: 'hover:shadow-purple-600/60',
      secondaryIcon: Sparkles,
      description: 'Begin your learning journey'
    },
    in_progress: {
      icon: Zap,
      label: 'Continue',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      hoverGradient: 'hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700',
      shadow: 'shadow-blue-500/50',
      hoverShadow: 'hover:shadow-blue-600/60',
      secondaryIcon: ArrowRight,
      description: `${progress}% completed - keep going!`
    },
    completed: {
      icon: CheckCircle,
      label: 'Review',
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      hoverGradient: 'hover:from-green-600 hover:via-emerald-700 hover:to-teal-700',
      shadow: 'shadow-green-500/50',
      hoverShadow: 'hover:shadow-green-600/60',
      secondaryIcon: RotateCcw,
      description: 'Refresh your knowledge'
    }
  };

  const config = buttonConfigs[status];
  const PrimaryIcon = config.icon;
  const SecondaryIcon = config.secondaryIcon;

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Primary Action Button */}
      <button
        onClick={onPrimaryAction}
        className={`
          group relative flex-1 flex items-center justify-center gap-3 
          px-6 py-4 rounded-xl font-bold text-white text-base
          bg-gradient-to-r ${config.gradient} ${config.hoverGradient}
          shadow-lg ${config.shadow} ${config.hoverShadow}
          transform transition-all duration-300 
          hover:scale-[1.02] hover:shadow-2xl
          active:scale-[0.98]
          overflow-hidden
        `}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                      translate-x-[-100%] group-hover:translate-x-[100%] 
                      transition-transform duration-1000" />
        
        {/* Icon with animation */}
        <PrimaryIcon className="h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Label */}
        <span className="relative z-10 flex items-center gap-2">
          {config.label}
          <SecondaryIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </button>

      {/* History Button (only for completed lessons) */}
      {status === 'completed' && onHistoryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistoryAction();
          }}
          className={`
            group flex items-center justify-center gap-3 
            px-6 py-4 rounded-xl font-bold text-base
            bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900
            dark:from-gray-600 dark:via-gray-700 dark:to-gray-800
            text-white
            border-2 border-gray-600 dark:border-gray-500
            shadow-lg shadow-gray-500/30
            transform transition-all duration-300 
            hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-600/40
            active:scale-[0.98]
            sm:flex-none sm:min-w-[180px]
          `}
        >
          <History className="h-5 w-5 group-hover:rotate-[-15deg] transition-transform duration-300" />
          <span className="flex items-center gap-2">
            View History
          </span>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VERSION - dla małych kart lub mobile
// ============================================================================

interface CompactActionButtonsProps {
  status: 'assigned' | 'in_progress' | 'completed';
  onPrimaryAction: () => void;
  onHistoryAction?: () => void;
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

// ============================================================================
// USAGE EXAMPLES - jak używać w StudentLessonsPage
// ============================================================================

/*
// PRZYKŁAD 1: Pełnowymiarowe przyciski (w kartach lekcji)
import { LessonActionButtons } from '../components/LessonActionButtons';

<LessonActionButtons
  status={lesson.status}
  progress={lesson.progress}
  onPrimaryAction={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
  onHistoryAction={
    lesson.status === 'completed' 
      ? () => navigate(`/student/lessons/${lesson.lesson_id}/history`)
      : undefined
  }
/>

// PRZYKŁAD 2: Kompaktowe przyciski (w małych kartach)
import { CompactLessonActionButtons } from '../components/LessonActionButtons';

<CompactLessonActionButtons
  status={lesson.status}
  onPrimaryAction={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
  onHistoryAction={
    lesson.status === 'completed' 
      ? () => navigate(`/student/lessons/${lesson.lesson_id}/history`)
      : undefined
  }
/>
*/