// ============================================================================
// EXERCISE DURATION SELECTOR COMPONENT
// ============================================================================
// Input component for setting estimated exercise completion time
// File: src/components/ExerciseDurationSelector.tsx
// ============================================================================

import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';

interface ExerciseDurationSelectorProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
  disabled?: boolean;
  label?: string;
  showPresets?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

const DURATION_PRESETS = [
  { value: 2, label: '2 min', icon: '⚡' },
  { value: 5, label: '5 min', icon: '🏃' },
  { value: 10, label: '10 min', icon: '⏱️' },
  { value: 15, label: '15 min', icon: '📝' },
  { value: 20, label: '20 min', icon: '📚' },
  { value: 30, label: '30 min', icon: '🎯' }
];

export function ExerciseDurationSelector({
  value,
  onChange,
  disabled = false,
  label = 'Estimated Duration',
  showPresets = true,
  min = 1,
  max = 120,
  className = ''
}: ExerciseDurationSelectorProps) {
  const [customMode, setCustomMode] = useState(!DURATION_PRESETS.some(p => p.value === value));

  const handlePresetClick = (minutes: number) => {
    onChange(minutes);
    setCustomMode(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.min(Math.max(newValue, min), max);
    onChange(clampedValue);
  };

  const handleCustomModeToggle = () => {
    setCustomMode(!customMode);
    if (customMode && !DURATION_PRESETS.some(p => p.value === value)) {
      onChange(5); // Reset to default preset
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{label} <span className="text-red-500">*</span></span>
            </div>
          </label>
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Info className="h-3 w-3" />
            <span>How long will this take?</span>
          </div>
        </div>
      )}

      {/* Preset Duration Buttons */}
      {showPresets && !customMode && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                ${value === preset.value
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
              `}
            >
              <span className="text-lg mb-1">{preset.icon}</span>
              <span className={`text-xs font-medium ${
                value === preset.value 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Custom Duration Input */}
      {customMode && (
        <div className="mb-3">
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={handleCustomChange}
              disabled={disabled}
              min={min}
              max={max}
              className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              placeholder="Enter minutes..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Enter a value between {min} and {max} minutes
          </p>
        </div>
      )}

      {/* Toggle Custom Mode Button */}
      {showPresets && (
        <button
          type="button"
          onClick={handleCustomModeToggle}
          disabled={disabled}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 
                     font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {customMode ? '← Back to presets' : 'Enter custom duration →'}
        </button>
      )}

      {/* Duration Summary */}
      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Selected duration:</span>
          <span className="font-semibold text-gray-900 dark:text-white flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{value} {value === 1 ? 'minute' : 'minutes'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DURATION BADGE COMPONENT (for displaying duration in lists/cards)
// ============================================================================

interface DurationBadgeProps {
  minutes: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function DurationBadge({
  minutes,
  size = 'md',
  showIcon = true,
  className = ''
}: DurationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  const formattedDuration = formatDuration(minutes);

  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-full font-medium
      bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && <Clock className={iconSizes[size]} />}
      <span>{formattedDuration}</span>
    </span>
  );
}

// ============================================================================
// TOTAL DURATION DISPLAY (for showing cumulative lesson duration)
// ============================================================================

interface TotalDurationDisplayProps {
  minutes: number;
  exerciseCount?: number;
  showBreakdown?: boolean;
  className?: string;
}

export function TotalDurationDisplay({
  minutes,
  exerciseCount,
  showBreakdown = false,
  className = ''
}: TotalDurationDisplayProps) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return (
    <div className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                     rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Duration
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {hours > 0 ? (
              <>
                {hours}h {remainingMinutes > 0 && `${remainingMinutes}m`}
              </>
            ) : (
              `${minutes} min`
            )}
          </div>
        </div>

        {exerciseCount !== undefined && (
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Exercises
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {exerciseCount}
            </div>
          </div>
        )}
      </div>

      {showBreakdown && exerciseCount && exerciseCount > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Average per exercise: <span className="font-semibold text-gray-900 dark:text-white">
              {Math.round(minutes / exerciseCount)} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function calculateTotalDuration(exercises: Array<{ estimated_duration_minutes: number }>): number {
  return exercises.reduce((total, ex) => total + (ex.estimated_duration_minutes || 0), 0);
}

export function getDurationPreset(minutes: number): typeof DURATION_PRESETS[0] | null {
  return DURATION_PRESETS.find(p => p.value === minutes) || null;
}