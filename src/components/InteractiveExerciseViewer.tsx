// src/components/InteractiveExerciseViewer.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Lightbulb, RotateCw } from 'lucide-react';

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
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  const handleAnswerChange = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentExercise.id]: answer
    }));
  };

  const toggleCardFlip = (cardIndex: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardIndex]: !prev[cardIndex]
    }));
  };

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setFlippedCards({}); // Reset flipped cards for next exercise
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setFlippedCards({}); // Reset flipped cards
    }
  };

  const handleSubmit = () => {
    // Oblicz wyniki
    const calculatedResults: ExerciseAnswer[] = exercises.map(exercise => {
      const userAnswer = userAnswers[exercise.id] || '';
      let isCorrect = false;

      if (exercise.exercise_type === 'multiple_choice') {
        // ABCD - sprawdzamy poprawność
        isCorrect = userAnswer.trim() === exercise.correct_answer?.trim();
      } else if (exercise.exercise_type === 'text_answer') {
        // ✅ ZMIANA: Text answer idzie do sprawdzenia przez tutora
        // Zawsze ustawiamy is_correct = true (pending review)
        // Tutor później oceni
        isCorrect = true; // Tymczasowo "zaliczone" - czeka na ocenę tutora
      } else if (exercise.exercise_type === 'flashcard') {
        // Fiszki - sprawdzamy czy użytkownik coś napisał
        isCorrect = userAnswer.trim().length > 0;
      }

      return {
        exercise_id: exercise.id,
        answer: userAnswer,
        is_correct: isCorrect
      };
    });

    // Oblicz score tylko z multiple_choice (text_answer nie wliczamy bo czeka na ocenę)
    const gradableExercises = exercises.filter(ex => ex.exercise_type !== 'text_answer');
    const gradableResults = calculatedResults.filter((_, idx) => 
      exercises[idx].exercise_type !== 'text_answer'
    );

    if (gradableExercises.length > 0) {
      const totalPoints = gradableExercises.reduce((sum, ex) => sum + ex.points, 0);
      const earnedPoints = gradableResults.reduce((sum, result, idx) => {
        const exercise = gradableExercises[idx];
        return sum + (result.is_correct ? exercise.points : 0);
      }, 0);
      const calculatedScore = Math.round((earnedPoints / totalPoints) * 100);
      setScore(calculatedScore);
    } else {
      // Jeśli wszystkie ćwiczenia to text_answer, ustaw 100% (czeka na ocenę)
      setScore(100);
    }

    setResults(calculatedResults);
    setShowResults(true);
    onComplete(calculatedResults, score);
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
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  This is an open-ended question. Your answer will be reviewed by your tutor.
                </p>
              </div>
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here... (minimum 10 characters)"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-800 dark:text-white resize-none"
              rows={6}
            />
            {userAnswer.length > 0 && userAnswer.length < 10 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Please write at least 10 characters ({userAnswer.length}/10)
              </p>
            )}
          </div>
        );

      case 'flashcard':
        const flashcards = currentExercise.options as { front: string; back: string }[];
        
        return (
          <div className="space-y-4">
            {/* Flipable Flashcards */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <RotateCw className="h-4 w-4" />
                <span>Click on any card to flip it and see the answer</span>
              </div>
              
              {flashcards?.map((card, idx) => {
                const isFlipped = flippedCards[idx] || false;
                
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCardFlip(idx)}
                    className="relative h-48 cursor-pointer group"
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className={`
                        relative w-full h-full transition-transform duration-500 transform-gpu
                        ${isFlipped ? 'rotate-y-180' : ''}
                      `}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front of card */}
                      <div
                        className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-xl border-4 border-white dark:border-gray-800"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                      >
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2 opacity-80">Front</p>
                          <p className="text-2xl font-bold">{card.front}</p>
                          <p className="text-sm mt-4 opacity-60">Click to flip</p>
                        </div>
                      </div>

                      {/* Back of card */}
                      <div
                        className="absolute w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-xl border-4 border-white dark:border-gray-800"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2 opacity-80">Back</p>
                          <p className="text-2xl font-bold">{card.back}</p>
                          <p className="text-sm mt-4 opacity-60">Click to flip</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary input */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What did you learn from these flashcards?
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Write a brief summary of what you learned..."
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
              {results.filter(r => r.is_correct).length} / {totalExercises} completed
            </span>
          </div>
          {exercises.some(ex => ex.exercise_type === 'text_answer') && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                📝 Some answers need to be reviewed by your tutor
              </p>
            </div>
          )}
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
                  ${exercise.exercise_type === 'text_answer'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : result.is_correct 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }
                `}
              >
                <div className="flex items-start space-x-3 mb-3">
                  {exercise.exercise_type === 'text_answer' ? (
                    <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  ) : result.is_correct ? (
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
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your answer:</p>
                      <p className="text-gray-900 dark:text-white">
                        {userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ⏳ Waiting for tutor review
                    </p>
                  </div>
                )}

                {exercise.exercise_type === 'flashcard' && userAnswer && (
                  <div className="ml-9 space-y-2">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your summary:</p>
                      <p className="text-gray-900 dark:text-white">
                        {userAnswer}
                      </p>
                    </div>
                  </div>
                )}

                {exercise.explanation && exercise.exercise_type !== 'text_answer' && (
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
            disabled={
              // ✅ NOWA LOGIKA: Tylko multiple_choice i text_answer wymagają odpowiedzi
              currentExercise.exercise_type === 'multiple_choice' 
                ? !userAnswers[currentExercise.id]
                : currentExercise.exercise_type === 'text_answer'
                  ? !userAnswers[currentExercise.id] || userAnswers[currentExercise.id]?.length < 10
                  : false // Flashcard NIE wymaga odpowiedzi (komentarz opcjonalny)
            }
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
      {currentExercise.exercise_type !== 'flashcard' && !userAnswers[currentExercise.id] && (
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Please provide an answer before moving forward</span>
        </div>
      )}
    </div>
  );
}