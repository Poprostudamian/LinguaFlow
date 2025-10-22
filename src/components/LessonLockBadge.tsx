// src/components/LessonLockBadge.tsx
import React from 'react';
import { 
  Lock, 
  LockOpen, 
  Shield, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ============================================================================
// TYPES
// ============================================================================

export type LockStatus = 'locked' | 'unlocked' | 'partial';
export type BadgeVariant = 'badge' | 'banner' | 'inline' | 'tooltip';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface LessonLockBadgeProps {
  /** Lock status of the lesson */
  status: LockStatus;
  
  /** Visual variant */
  variant?: BadgeVariant;
  
  /** Size of the badge */
  size?: BadgeSize;
  
  /** Total number of assigned students */
  totalAssigned?: number;
  
  /** Number of students who completed */
  totalCompleted?: number;
  
  /** Reason for lock (optional custom message) */
  lockReason?: string;
  
  /** Show detailed info (for banner variant) */
  showDetails?: boolean;
  
  /** Callback when clicking the info button */
  onInfoClick?: () => void;
  
  /** Custom className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LessonLockBadge({
  status,
  variant = 'badge',
  size = 'md',
  totalAssigned = 0,
  totalCompleted = 0,
  lockReason,
  showDetails = false,
  onInfoClick,
  className = ''
}: LessonLockBadgeProps) {
  const { t } = useLanguage();

  // ============================================================================
  // STATUS CONFIGURATION
  // ============================================================================

  const statusConfig = {
    locked: {
      icon: Lock,
      label: t.tutorLessonManagementPage?.lessonLocked || 'Lesson Locked',
      color: 'red',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-800 dark:text-red-300',
      borderClass: 'border-red-200 dark:border-red-800',
      iconClass: 'text-red-600 dark:text-red-400',
      description: lockReason || t.tutorLessonManagementPage?.lessonLockedAllCompleted?.replace('{count}', String(totalAssigned)) || 'All students have completed this lesson'
    },
    unlocked: {
      icon: LockOpen,
      label: t.tutorLessonManagementPage?.lessonUnlocked || 'Lesson Unlocked',
      color: 'green',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-800 dark:text-green-300',
      borderClass: 'border-green-200 dark:border-green-800',
      iconClass: 'text-green-600 dark:text-green-400',
      description: t.tutorLessonManagementPage?.canEditLesson || 'You can edit this lesson'
    },
    partial: {
      icon: Clock,
      label: t.tutorLessonManagementPage?.lessonInProgress || 'In Progress',
      color: 'yellow',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-800 dark:text-yellow-300',
      borderClass: 'border-yellow-200 dark:border-yellow-800',
      iconClass: 'text-yellow-600 dark:text-yellow-400',
      description: `${totalCompleted} of ${totalAssigned} students completed`
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // ============================================================================
  // SIZE CONFIGURATION
  // ============================================================================

  const sizeConfig = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-xs',
      padding: 'px-2 py-1',
      gap: 'space-x-1'
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'space-x-2'
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-base',
      padding: 'px-4 py-2',
      gap: 'space-x-2'
    }
  };

  const sizeClasses = sizeConfig[size];

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  // VARIANT 1: BADGE (compact, rounded pill)
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center ${sizeClasses.gap} ${sizeClasses.padding}
          ${config.bgClass} ${config.textClass}
          rounded-full font-medium
          transition-all duration-200
          ${className}
        `}
        role="status"
        aria-label={config.label}
      >
        <Icon className={`${sizeClasses.icon} ${config.iconClass}`} />
        <span className={sizeClasses.text}>{config.label}</span>
      </span>
    );
  }

  // VARIANT 2: BANNER (full-width with border)
  if (variant === 'banner') {
    return (
      <div
        className={`
          ${config.bgClass} 
          border ${config.borderClass}
          rounded-lg ${sizeClasses.padding}
          transition-all duration-200
          ${className}
        `}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Icon className={`${sizeClasses.icon} ${config.iconClass} mt-0.5`} />
            <div className="flex-1">
              <p className={`font-semibold ${config.textClass} ${sizeClasses.text}`}>
                {config.label}
              </p>
              {showDetails && (
                <p className={`mt-1 ${config.textClass} opacity-90 text-xs`}>
                  {config.description}
                </p>
              )}
              {status === 'locked' && showDetails && (
                <p className="mt-2 text-xs opacity-75 flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>
                    {t.tutorLessonManagementPage?.unlockHint || 'Unassign a student to unlock'}
                  </span>
                </p>
              )}
            </div>
          </div>
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className={`
                ${config.iconClass} hover:opacity-75
                transition-opacity p-1 rounded
              `}
              aria-label="More information"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress Bar (for partial status) */}
        {status === 'partial' && totalAssigned > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1 opacity-75">
              <span>Progress</span>
              <span>{Math.round((totalCompleted / totalAssigned) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  status === 'locked' 
                    ? 'bg-red-500' 
                    : status === 'partial' 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                } transition-all duration-300`}
                style={{ width: `${(totalCompleted / totalAssigned) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // VARIANT 3: INLINE (text with icon, no background)
  if (variant === 'inline') {
    return (
      <span
        className={`
          inline-flex items-center ${sizeClasses.gap}
          ${config.textClass} font-medium
          ${className}
        `}
        role="status"
      >
        <Icon className={`${sizeClasses.icon}`} />
        <span className={sizeClasses.text}>{config.label}</span>
      </span>
    );
  }

  // VARIANT 4: TOOLTIP (icon only with hover tooltip)
  if (variant === 'tooltip') {
    return (
      <div className={`relative group ${className}`}>
        <button
          className={`
            ${config.iconClass}
            hover:opacity-75 transition-opacity
            p-1 rounded
          `}
          aria-label={config.label}
          onClick={onInfoClick}
        >
          <Icon className={sizeClasses.icon} />
        </button>

        {/* Tooltip */}
        <div
          className={`
            absolute z-50 invisible group-hover:visible
            ${config.bgClass} ${config.textClass}
            border ${config.borderClass}
            rounded-lg px-3 py-2 text-xs font-medium
            whitespace-nowrap shadow-lg
            bottom-full left-1/2 -translate-x-1/2 mb-2
            transition-all duration-200
            pointer-events-none
          `}
          role="tooltip"
        >
          <div className="space-y-1">
            <div className="font-semibold">{config.label}</div>
            {showDetails && (
              <div className="opacity-90 text-xs max-w-xs whitespace-normal">
                {config.description}
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div
            className={`
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent
              ${config.bgClass === 'bg-red-100 dark:bg-red-900/30' ? 'border-t-red-100 dark:border-t-red-900/30' : ''}
              ${config.bgClass === 'bg-green-100 dark:bg-green-900/30' ? 'border-t-green-100 dark:border-t-green-900/30' : ''}
              ${config.bgClass === 'bg-yellow-100 dark:bg-yellow-900/30' ? 'border-t-yellow-100 dark:border-t-yellow-900/30' : ''}
            `}
          />
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// HELPER HOOK: Determine lock status from lesson data
// ============================================================================

export function useLessonLockStatus(
  totalAssigned: number,
  totalCompleted: number
): LockStatus {
  if (totalAssigned === 0) return 'unlocked';
  if (totalCompleted === totalAssigned) return 'locked';
  if (totalCompleted > 0) return 'partial';
  return 'unlocked';
}