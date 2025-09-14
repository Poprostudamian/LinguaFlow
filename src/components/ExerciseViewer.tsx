// src/components/ExerciseViewer.tsx - Komponent do rozwiązywania ćwiczeń
import React, { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, RotateCcw, Star } from 'lucide-react';

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  correct_answer?: string;
  options?: string[];
  explanation?: string;
  order_number: number;
  points: number;
}

export interface StudentAnswer {
  exercise_id: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
}

interface ExerciseViewerProps {
  exercises: Exercise[];
  onComplete: (answers: StudentAnswer[]) => void;
  onProgress?: (progress: number) => void;
}

export function ExerciseViewer({ exercises, onComplete, onProgress }: ExerciseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Flashcard specific state
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [flashcardDifficulty, setFlashcardDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;
  const progress = Math.round(((currentIndex + 1) / totalExercises) * 100);

  // Update progress
  React.useEffect(() => {
    if (onProgress) {
      onProgress(progress);
    }
  }, [progress, onProgress]);

  const handleAnswer = () => {
    if (!currentExercise || currentAnswer.trim() === '') return;

    let isCorrect = false;
    let pointsEarned = 0;

    // Check answer based on exercise type
    if (currentExercise.exercise_type === 'multiple_choice') {
      isCorrect = currentAnswer.toUpperCase() === currentExercise.correct_answer?.toUpperCase();
      pointsEarned = isCorrect ? currentExercise.points : 0;
    } else if (currentExercise.exercise_type === 'text_answer') {
      // For text answers, we'll assume it's correct for now (could add AI checking later)
      isCorrect = currentAnswer.trim().length > 0;
      pointsEarned = isCorrect ? currentExercise.points : 0;
    } else if (currentExercise.exercise_type === 'flashcard') {
      // For flashcards, points based on difficulty self-assessment
      if (flashcardDifficulty === 'easy') pointsEarned = currentExercise.points;
      else if (flashcardDifficulty === 'medium') pointsEarned = Math.round(currentExercise.points * 0.7);
      else if (flashcardDifficulty === 'hard') pointsEarned = Math.round(currentExercise.points * 0.5);
      isCorrect = flashcardDifficulty !== null;
    }

    const studentAnswer: StudentAnswer = {
      exercise_id: currentExercise.id,
      answer: currentAnswer,
      is_correct: isCorrect,
      points_earned: pointsEarned
    };

    const newAnswers = [...answers, studentAnswer];
    setAnswers(newAnswers);

    // Show result briefly before moving to next
    setShowResults(true);
    setTimeout(() => {
      setShowResults(false);
      if (currentIndex < totalExercises - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentAnswer('');
        setShowFlashcardBack(false);
        setFlashcardDifficulty(null);
      } else {
        setIsCompleted(true);
        onComplete(newAnswers);
      }
    }, 2000);
  };

  const goToNext = () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer('');
      setShowFlashcardBack(false);
      setFlashcardDifficulty(null);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentAnswer('');
      setShowFlashcardBack(false);
      setFlashcardDifficulty(null);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No exercises available for this lesson.</p>
      </div>
    );
  }

  if (isCompleted) {
    const totalPoints = answers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const maxPoints = exercises.reduce((sum, exercise) => sum + exercise.points, 0);
    const percentage = Math.round((totalPoints / maxPoints) * 100);

    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Exercises Completed!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You scored {totalPoints} out of {maxPoints} points ({percentage}%)
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Exercise {currentIndex + 1} of {totalExercises}
          </span>
          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === totalExercises - 1}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentExercise.exercise_type === 'multiple_choice' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : currentExercise.exercise_type === 'flashcard'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            }`}>
              {currentExercise.exercise_type === 'multiple_choice' && '📝 ABCD'}
              {currentExercise.exercise_type === 'flashcard' && '🃏 Flashcard'}
              {currentExercise.exercise_type === 'text_answer' && '✍️ Text Answer'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentExercise.points} {currentExercise.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentExercise.title}
          </h3>
        </div>

        {/* Results Display */}
        {showResults && (
          <div className={`p-4 rounded-lg mb-4 ${
            answers[answers.length - 1]?.is_correct
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`h-5 w-5 ${
                answers[answers.length - 1]?.is_correct ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className={`font-medium ${
                answers[answers.length - 1]?.is_correct 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {answers[answers.length - 1]?.is_correct ? 'Correct!' : 'Incorrect'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                +{answers[answers.length - 1]?.points_earned} points
              </span>
            </div>
            {currentExercise.explanation && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {currentExercise.explanation}
              </p>
            )}
          </div>
        )}

        {/* Multiple Choice */}
        {currentExercise.exercise_type === 'multiple_choice' && !showResults && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {currentExercise.question}
            </p>
            <div className="space-y-2">
              {currentExercise.options?.map((option, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentAnswer(letter)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentAnswer === letter
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                  >
                    <span className="font-medium">{letter}. </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flashcard */}
        {currentExercise.exercise_type === 'flashcard' && !showResults && (
          <div className="space-y-4">
            <div 
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-32 flex items-center justify-center cursor-pointer transition-all duration-300"
              onClick={() => setShowFlashcardBack(!showFlashcardBack)}
            >
              <div className="text-center">
                <p className="text-lg text-gray-900 dark:text-white mb-2">
                  {showFlashcardBack ? currentExercise.correct_answer : currentExercise.question}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {showFlashcardBack ? 'Click to see front' : 'Click to reveal answer'}
                </p>
              </div>
            </div>
            
            {showFlashcardBack && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  How difficult was this for you?
                </p>
                <div className="flex justify-center space-x-2">
                  {[
                    { key: 'easy', label: 'Easy', color: 'green' },
                    { key: 'medium', label: 'Medium', color: 'yellow' },
                    { key: 'hard', label: 'Hard', color: 'red' }
                  ].map((diff) => (
                    <button
                      key={diff.key}
                      onClick={() => {
                        setFlashcardDifficulty(diff.key as any);
                        setCurrentAnswer(diff.key);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        flashcardDifficulty === diff.key
                          ? `bg-${diff.color}-100 text-${diff.color}-800 border-${diff.color}-300`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      } border`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Answer */}
        {currentExercise.exercise_type === 'text_answer' && !showResults && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {currentExercise.question}
            </p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              placeholder="Type your answer here..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentAnswer.length} characters
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!showResults && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnswer}
              disabled={
                (currentExercise.exercise_type === 'multiple_choice' && !currentAnswer) ||
                (currentExercise.exercise_type === 'text_answer' && currentAnswer.trim() === '') ||
                (currentExercise.exercise_type === 'flashcard' && !flashcardDifficulty)
              }
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === totalExercises - 1 ? 'Finish Exercise' : 'Next Exercise'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}