// src/components/LessonPreviewTab.tsx
import React from 'react';
import {
  BookOpen,
  Target,
  Users,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  Circle,
  Award
} from 'lucide-react';

interface Exercise {
  id: string;
  type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  flashcards?: Array<{ front: string; back: string }>;
  maxLength?: number;
  wordLimit?: number;
  explanation?: string;
}

interface LessonPreviewTabProps {
  lessonData: {
    title: string;
    description: string;
    content: string;
    status: 'draft' | 'published';
    assignedStudentIds: string[];
  };
  exercises: Exercise[];
  students: Array<{ id: string; first_name: string; last_name: string }>;
}

export function LessonPreviewTab({ lessonData, exercises, students }: LessonPreviewTabProps) {
  const assignedStudents = students.filter(s => lessonData.assignedStudentIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
            Student View Preview
          </span>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          This is how your lesson will appear to students
        </p>
      </div>

      {/* Lesson Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {lessonData.title || 'Untitled Lesson'}
            </h1>
            {lessonData.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {lessonData.description}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              lessonData.status === 'published'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {lessonData.status === 'published' ? '✓ Published' : '○ Draft'}
          </span>
        </div>

        {/* Lesson Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exercises</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {exercises.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Points</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {exercises.reduce((sum, ex) => sum + (ex.points || 1), 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Est. Time</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                ~{Math.max(15, exercises.length * 5)} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      {lessonData.content && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lesson Content
            </h2>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: lessonData.content }}
          />
        </div>
      )}

      {/* Exercises Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Exercises ({exercises.length})
          </h2>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No exercises added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <ExercisePreview key={exercise.id} exercise={exercise} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Assigned Students */}
      {assignedStudents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assigned Students ({assignedStudents.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {student.first_name.charAt(0)}
                  {student.last_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {student.first_name} {student.last_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXERCISE PREVIEW COMPONENT
// ============================================================================

interface ExercisePreviewProps {
  exercise: Exercise;
  index: number;
}

function ExercisePreview({ exercise, index }: ExercisePreviewProps) {
  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'flashcard':
        return 'Flashcard';
      case 'text_answer':
        return 'Text Answer';
      default:
        return type;
    }
  };

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'flashcard':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'text_answer':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getExerciseTypeColor(exercise.type)}`}>
                {getExerciseTypeLabel(exercise.type)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {exercise.points} {exercise.points === 1 ? 'point' : 'points'}
              </span>
            </div>
            {exercise.title && (
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {exercise.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="pl-11">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          {exercise.question}
        </p>

        {/* Multiple Choice Options */}
        {exercise.type === 'multiple_choice' && exercise.options && (
          <div className="space-y-2">
            {exercise.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect = letter === exercise.correctAnswer;
              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    isCorrect
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${
                      isCorrect
                        ? 'border-green-500 text-green-600 dark:text-green-400'
                        : 'border-gray-400 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option || <em className="text-gray-400">Empty option</em>}
                  </span>
                  {isCorrect && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Flashcards */}
        {exercise.type === 'flashcard' && exercise.flashcards && (
          <div className="space-y-2">
            {exercise.flashcards.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No flashcards added yet
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {exercise.flashcards.slice(0, 3).map((card, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Front:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {card.front}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Back:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {card.back}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {exercise.flashcards.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    ... and {exercise.flashcards.length - 3} more card{exercise.flashcards.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text Answer */}
        {exercise.type === 'text_answer' && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Student will type their answer here...
              </p>
              <div className="h-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maximum: {exercise.maxLength || exercise.wordLimit || 2000} characters
              </p>
            </div>
          </div>
        )}

        {/* Explanation */}
        {exercise.explanation && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
              Explanation:
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {exercise.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}