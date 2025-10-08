// src/components/InteractiveExerciseViewer.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface Exercise {
  id: string;
  exercise_type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  correct_answer: string;
  options?: string[] | { front: string; back: string }[] | null;
  explanation?: string;
  points: number;
}

interface ExerciseAnswer {
  exercise_id: string;
  answer: string;
  is_correct: boolean;
}

interface Props {
  exercises: Exercise[];
  onComplete: (answers: ExerciseAnswer[], score: number) => void;
}

export function InteractiveExerciseViewer({ exercises, onComplete }: Props) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ExerciseAnswer[]>([]);
  const [score, setScore] = useState(0);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  const handleAnswerChange = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentExercise.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Oblicz wyniki
    const calculatedResults: ExerciseAnswer[] = exercises.map(exercise => {
      const userAnswer = userAnswers[exercise.id] || '';
      let isCorrect = false;

      if (exercise.exercise_type === 'multiple_choice') {
        isCorrect = userAnswer.trim() === exercise.correct_answer?.trim();
      } else if (exercise.exercise_type === 'text_answer') {
        // Porównanie case-insensitive
        isCorrect = userAnswer.toLowerCase().trim() === 
                    exercise.correct_answer?.toLowerCase().trim();
      } else if (exercise.exercise_type === 'flashcard') {
        // Dla fiszek sprawdzamy czy użytkownik odpowiedział
        isCorrect = userAnswer.trim().length > 0;
      }

      return {
        exercise_id: exercise.id,
        answer: userAnswer,
        is_correct: isCorrect
      };
    });

    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const earnedPoints = calculatedResults.reduce((sum, result, idx) => 
      sum + (result.is_correct ? exercises[idx].points : 0), 0
    );
    const calculatedScore = Math.round((earnedPoints / totalPoints) * 100);

    setResults(calculatedResults);
    setScore(calculatedScore);
    setShowResults(true);
    onComplete(calculatedResults, calculatedScore);
  };

  const renderExerciseInput = () => {
    const userAnswer = userAnswers[currentExercise.id] || '';

    switch (currentExercise.exercise_type) {
      case 'multiple_choice':
        const options = Array.isArray(currentExercise.options) 
          ? currentExercise.options as string[]
          : ['A', 'B', 'C', 'D'];

        return (
          <div className="space-y-3">
            {options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = userAnswer === optionLetter;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerChange(optionLetter)}
                  className={`
                    w-full p-4 text-left rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${isSelected 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {optionLetter}
                    </div>
                    <span className="flex-1 text-gray-900 dark:text-white">
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'text_answer':
        return (
          <textarea
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-800 dark:text-white resize-none"
            rows={4}
          />
        );

      case 'flashcard':
        const flashcards = currentExercise.options as { front: string; back: string }[];
        
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                Flashcards to learn:
              </p>
              <div className="space-y-3">
                {flashcards?.map((card, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {card.front}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {card.back}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Write what you learned:
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Summarize what you learned from these flashcards..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:bg-gray-800 dark:text-white resize-none"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showResults) {
    return (
      <div className="space-y-6">
        {/* Score Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Results
            </h3>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {score}%
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span>
              {results.filter(r => r.is_correct).length} / {totalExercises} correct
            </span>
          </div>
        </div>

        {/* Exercise Results */}
        <div className="space-y-4">
          {exercises.map((exercise, idx) => {
            const result = results[idx];
            const userAnswer = result.answer;
            
            return (
              <div
                key={exercise.id}
                className={`
                  p-5 rounded-xl border-2 
                  ${result.is_correct 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }
                `}
              >
                <div className="flex items-start space-x-3 mb-3">
                  {result.is_correct ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Exercise {idx + 1}: {exercise.title}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {exercise.question}
                    </p>
                  </div>
                </div>

                {exercise.exercise_type === 'multiple_choice' && (
                  <div className="ml-9 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Your answer: </span>
                      <span className={`font-semibold ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer || 'No answer'}
                      </span>
                    </div>
                    {!result.is_correct && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Correct answer: </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {exercise.correct_answer}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {exercise.exercise_type === 'text_answer' && (
                  <div className="ml-9 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Your answer: </span>
                      <div className={`mt-1 p-2 rounded ${result.is_correct ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {userAnswer || 'No answer'}
                      </div>
                    </div>
                    {!result.is_correct && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Expected answer: </span>
                        <div className="mt-1 p-2 rounded bg-green-100 dark:bg-green-900/30">
                          {exercise.correct_answer}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {exercise.explanation && (
                  <div className="ml-9 mt-3 flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                        Explanation:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        {exercise.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Exercise */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentExercise.title}
            </h3>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              {currentExercise.points} {currentExercise.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {currentExercise.question}
          </p>
        </div>

        {renderExerciseInput()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentExerciseIndex === 0}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>

        {currentExerciseIndex === totalExercises - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Submit Answers
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all"
          >
            Next
          </button>
        )}
      </div>

      {/* Answer Status Indicator */}
      {!userAnswers[currentExercise.id] && (
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Please provide an answer before moving forward</span>
        </div>
      )}
    </div>
  );
}