// ============================================================================
// EXERCISE DIFFICULTY SELECTOR COMPONENT
// ============================================================================
// Visual selector for exercise difficulty with color-coded badges
// File: src/components/ExerciseDifficultySelector.tsx
// ============================================================================

import React from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';
import type { ExerciseDifficulty } from '../types/lesson.types';

interface ExerciseDifficultySelectorProps {
  value: ExerciseDifficulty;
  onChange: (difficulty: ExerciseDifficulty) => void;
  disabled?: boolean;
  label?: string;
  showDescription?: boolean;
  className?: string;
}

const DIFFICULTY_OPTIONS: Array<{
  value: ExerciseDifficulty;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Easy exercises for new learners',
    icon: Star,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Moderate difficulty for regular practice',
    icon: TrendingUp,
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700 hover:border-yellow-500 dark:hover:border-yellow-500'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Challenging exercises for mastery',
    icon: Award,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700 hover:border-red-500 dark:hover:border-red-500'
  }
];

export function ExerciseDifficultySelector({
  value,
  onChange,
  disabled = false,
  label = 'Difficulty Level',
  showDescription = true,
  className = ''
}: ExerciseDifficultySelectorProps) {
  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      {/* Difficulty Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DIFFICULTY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? `${option.bgColor} ${option.borderColor.replace('hover:', '')} shadow-md` 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
              `}
            >
              {/* Checkmark indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded-full ${option.color.replace('text-', 'bg-')} flex items-center justify-center`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon and Label */}
              <div className="flex items-center space-x-3 mb-2">
                <Icon className={`h-5 w-5 ${isSelected ? option.color : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={`font-semibold ${isSelected ? option.color : 'text-gray-700 dark:text-gray-300'}`}>
                  {option.label}
                </span>
              </div>

              {/* Description */}
              {showDescription && (
                <p className={`text-xs ${isSelected ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  {option.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DIFFICULTY BADGE COMPONENT (for displaying difficulty in lists/cards)
// ============================================================================

interface DifficultyBadgeProps {
  difficulty: ExerciseDifficulty;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function DifficultyBadge({
  difficulty,
  size = 'md',
  showIcon = true,
  className = ''
}: DifficultyBadgeProps) {
  const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
  if (!option) return null;

  const Icon = option.icon;

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

  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-full font-medium
      ${option.bgColor} ${option.color}
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{option.label}</span>
    </span>
  );
}

// ============================================================================
// DIFFICULTY FILTER COMPONENT (for filtering lists by difficulty)
// ============================================================================

interface DifficultyFilterProps {
  selected: ExerciseDifficulty[];
  onChange: (difficulties: ExerciseDifficulty[]) => void;
  label?: string;
  allowMultiple?: boolean;
}

export function DifficultyFilter({
  selected,
  onChange,
  label = 'Filter by Difficulty',
  allowMultiple = true
}: DifficultyFilterProps) {
  const handleToggle = (difficulty: ExerciseDifficulty) => {
    if (!allowMultiple) {
      onChange([difficulty]);
      return;
    }

    if (selected.includes(difficulty)) {
      onChange(selected.filter(d => d !== difficulty));
    } else {
      onChange([...selected, difficulty]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Label and Clear Button */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {DIFFICULTY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={`
                inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200
                ${isSelected 
                  ? `${option.bgColor} ${option.color} ring-2 ring-offset-1 ${option.borderColor.replace('border-', 'ring-').replace('hover:', '')} dark:ring-offset-gray-900` 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDifficultyColor(difficulty: ExerciseDifficulty) {
  const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
  return {
    text: option?.color || 'text-gray-600',
    bg: option?.bgColor || 'bg-gray-100',
    border: option?.borderColor || 'border-gray-300'
  };
}

export function getDifficultyLabel(difficulty: ExerciseDifficulty): string {
  const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
  return option?.label || difficulty;
}