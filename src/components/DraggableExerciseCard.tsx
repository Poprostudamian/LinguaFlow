import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';

interface DraggableExerciseCardProps {
  exercise: any; // Użyj swojego typu Exercise
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        {!readOnly && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {/* Exercise Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 
                      rounded-full flex items-center justify-center text-white font-bold text-sm">
          {index + 1}
        </div>

        {/* Exercise Content */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {exercise.title || 'Untitled Exercise'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {exercise.question}
          </p>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}