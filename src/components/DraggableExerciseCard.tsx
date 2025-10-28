// src/components/DraggableExerciseCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, BookOpen } from 'lucide-react';

interface Exercise {
  id: string;
  type: string;
  title: string;
  question: string;
  points: number;
}

interface DraggableExerciseCardProps {
  exercise: Exercise;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function DraggableExerciseCard({
  exercise,
  index,
  onEdit,
  onDelete,
  readOnly = false
}: DraggableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'ABCD Question';
      case 'flashcard': return 'Flashcard';
      case 'text_answer': return 'Text Answer';
      default: return type;
    }
  };

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'flashcard': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'text_answer': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4
        ${isDragging ? 'shadow-2xl ring-2 ring-purple-500 z-50' : 'shadow-sm'}
        transition-shadow
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        {!readOnly && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 
                     dark:text-gray-500 dark:hover:text-gray-300 mt-1 focus:outline-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {/* Exercise Number Badge */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 
                      rounded-full flex items-center justify-center text-white font-bold text-sm">
          {index + 1}
        </div>

        {/* Exercise Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Type Badge */}
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getExerciseTypeColor(exercise.type)}`}>
              {getExerciseTypeLabel(exercise.type)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {exercise.points} {exercise.points === 1 ? 'point' : 'points'}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {exercise.title || 'Untitled Exercise'}
          </h4>

          {/* Question Preview */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {exercise.question}
          </p>

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={onEdit}
                className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 
                         dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 
                         transition-colors flex items-center space-x-1"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-xs px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 
                         dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 
                         transition-colors flex items-center space-x-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}