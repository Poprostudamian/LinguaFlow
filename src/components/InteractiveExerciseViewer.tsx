// src/components/InteractiveExerciseViewer.tsx
// ✅ FIXED: Naprawiono klikalne fiszki z uproszczoną animacją

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  MessageCircle, 
  Target, 
  Sparkles,
  AlertCircle,
  Send,
  RotateCcw
} from 'lucide-react';

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  correct_answer?: string;
  options?: string[] | Array<{front: string; back: string}> | string;
  explanation?: string;
  order_number: number;
  points: number;
  word_limit?: number;
}

interface ExerciseResult {
  exercise_id: string;
  answer: string;
  is_correct: boolean;
}

interface InteractiveExerciseViewerProps {
  exercises: Exercise[];
  onComplete: (results: ExerciseResult[], score: number) => void;
}

export function InteractiveExerciseViewer({ exercises, onComplete }: InteractiveExerciseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState<Record<string, number>>({});
  const [isFlipped, setIsFlipped] = useState<Record<string, boolean>>({});

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;
  const progress = ((currentIndex + 1) / totalExercises) * 100;

  const parseOptions = (options: any, exerciseType: string): any => {
    if (!options) return null;
    
    if (typeof options !== 'string') {
      return options;
    }
    
    try {
      const parsed = JSON.parse(options);
      console.log(`📋 Parsed options for ${exerciseType}:`, parsed);
      return parsed;
    } catch (error) {
      console.warn('❌ Failed to parse options JSON:', error, options);
      
      if (exerciseType === 'multiple_choice') {
        return ['Option A', 'Option B', 'Option C', 'Option D'];
      } else if (exerciseType === 'flashcard') {
        return [{ front: 'Front', back: 'Back' }];
      }
      return null;
    }
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentExercise.id]: answer
    }));

    if (currentExercise.exercise_type === 'text_answer') {
      setWordCounts(prev => ({
        ...prev,
        [currentExercise.id]: countWords(answer)
      }));
    }
  };

  const canProceed = () => {
    const answer = userAnswers[currentExercise.id];
    
    if (currentExercise.exercise_type === 'text_answer') {
      const wordCount = wordCounts[currentExercise.id] || 0;
      const wordLimit = currentExercise.word_limit || 500;
      return answer && answer.trim().length > 0 && wordCount <= wordLimit;
    }
    
    if (currentExercise.exercise_type === 'flashcard') {
      return true;
    }
    
    return answer && answer.trim().length > 0;
  };

  const nextExercise = () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishExercises();
    }
  };

  const prevExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const finishExercises = () => {
    console.log('🏁 Finishing exercises...');

    const calculatedResults: ExerciseResult[] = exercises.map(exercise => {
      const userAnswer = userAnswers[exercise.id] || '';
      let isCorrect = false;

      if (exercise.exercise_type === 'multiple_choice') {
        isCorrect = userAnswer === exercise.correct_answer;
      } else if (exercise.exercise_type === 'flashcard') {
        isCorrect = true;
      } else if (exercise.exercise_type === 'text_answer') {
        isCorrect = false;
      }

      return {
        exercise_id: exercise.id,
        answer: userAnswer,
        is_correct: isCorrect
      };
    });

    let calculatedScore = 0;
    const hasNonTextAnswers = exercises.some(ex => ex.exercise_type !== 'text_answer');
    
    if (hasNonTextAnswers) {
      const totalPoints = exercises.reduce((sum, ex) => sum + (ex.exercise_type !== 'text_answer' ? ex.points : 0), 0);
      const earnedPoints = calculatedResults.reduce((sum, result, idx) => {
        const exercise = exercises[idx];
        return sum + (result.is_correct && exercise.exercise_type !== 'text_answer' ? exercise.points : 0);
      }, 0);
      calculatedScore = Math.round((earnedPoints / totalPoints) * 100);
    } else {
      calculatedScore = 0;
    }

    console.log('📊 Final score:', calculatedScore);

    setResults(calculatedResults);
    setScore(calculatedScore);
    setShowResults(true);
    
    onComplete(calculatedResults, calculatedScore);
  };

  const renderExerciseInput = () => {
    const userAnswer = userAnswers[currentExercise.id] || '';

    switch (currentExercise.exercise_type) {
      case 'multiple_choice':
        const parsedOptions = parseOptions(currentExercise.options, 'multiple_choice');
        const options = Array.isArray(parsedOptions) 
          ? parsedOptions as string[]
          : ['Option A', 'Option B', 'Option C', 'Option D'];

        console.log('🔤 Multiple choice options:', options);

        return (
          <div className="space-y-3">
            {options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx);
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
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'flashcard':
        const parsedFlashcards = parseOptions(currentExercise.options, 'flashcard');
        const flashcards = Array.isArray(parsedFlashcards)
          ? parsedFlashcards as Array<{front: string; back: string}>
          : [{ front: currentExercise.question, back: currentExercise.correct_answer || 'Answer' }];
        
        console.log('🃏 Flashcards:', flashcards);
        
        const exerciseCardIndex = currentCardIndex[currentExercise.id] || 0;
        const exerciseIsFlipped = isFlipped[currentExercise.id] || false;

        const handleCardIndexChange = (newIndex: number) => {
          setCurrentCardIndex(prev => ({
            ...prev,
            [currentExercise.id]: newIndex
          }));
          // Reset flip when changing cards
          setIsFlipped(prev => ({
            ...prev,
            [currentExercise.id]: false
          }));
        };

        const handleFlipCard = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔄 Flipping card, current state:', exerciseIsFlipped);
          setIsFlipped(prev => ({
            ...prev,
            [currentExercise.id]: !prev[currentExercise.id]
          }));
        };

        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Card {exerciseCardIndex + 1} of {flashcards.length}
              </p>
            </div>
            
            {/* ✅ FIXED: Simplified flashcard with better click handling */}
            <div className="relative h-64 w-full">
              <div
                onClick={handleFlipCard}
                className={`
                  absolute inset-0 w-full h-full cursor-pointer rounded-xl transition-all duration-500 transform
                  ${exerciseIsFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}
                style={{
                  transform: exerciseIsFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Front side */}
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 flex flex-col items-center justify-center text-center relative">
                  <div className="absolute top-3 right-3">
                    <RotateCcw className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-100 dark:bg-blue-800/30 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">FRONT</span>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {flashcards[exerciseCardIndex]?.front || 'Front'}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      ↗️ Click to reveal answer
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={handleFlipCard}
                className={`
                  absolute inset-0 w-full h-full cursor-pointer rounded-xl transition-all duration-500 transform
                  ${exerciseIsFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                style={{
                  transform: exerciseIsFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Back side */}
                <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 flex flex-col items-center justify-center text-center relative">
                  <div className="absolute top-3 right-3">
                    <RotateCcw className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-purple-100 dark:bg-purple-800/30 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">BACK</span>
                    </div>
                    <h4 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                      {flashcards[exerciseCardIndex]?.back || 'Back'}
                    </h4>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      ↗️ Click to flip back
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation between cards */}
            {flashcards.length > 1 && (
              <div className="flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardIndexChange(Math.max(0, exerciseCardIndex - 1));
                  }}
                  disabled={exerciseCardIndex === 0}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  ← Previous Card
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {exerciseCardIndex + 1} / {flashcards.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardIndexChange(Math.min(flashcards.length - 1, exerciseCardIndex + 1));
                  }}
                  disabled={exerciseCardIndex === flashcards.length - 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Next Card →
                </button>
              </div>
            )}

            {/* Completion status */}
            <div className="text-center py-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 dark:text-green-400 font-medium">
                  🎯 Review the flashcards and continue when ready!
                </p>
                {flashcards.length > 1 && (
                  <p className="text-sm text-green-500 dark:text-green-400 mt-1">
                    Navigate through all {flashcards.length} cards using the buttons above
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'text_answer':
        const wordLimit = currentExercise.word_limit || 500;
        const currentWordCount = wordCounts[currentExercise.id] || 0;
        const exceedsLimit = currentWordCount > wordLimit;

        return (
          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className={`w-full h-32 px-4 py-3 border-2 rounded-xl resize-none focus:outline-none transition-colors ${
                exceedsLimit 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
              } dark:bg-gray-700 dark:text-white`}
            />
            
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                exceedsLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {currentWordCount} / {wordLimit} words
              </span>
              <span className="text-xs text-gray-400">
                {currentExercise.points} points available
              </span>
            </div>

            {exceedsLimit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-300 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Your answer exceeds the word limit. Please reduce it to {wordLimit} words or less.
                  </span>
                </p>
              </div>
            )}
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
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>📝 Some answers need to be reviewed by your tutor</span>
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
                    <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                  ) : result.is_correct ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {exercise.question}
                    </h4>
                    {exercise.exercise_type === 'text_answer' ? (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Waiting for tutor review
                      </p>
                    ) : (
                      <p className={`text-sm ${
                        result.is_correct 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {result.is_correct ? 'Correct!' : 'Incorrect'}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {exercise.points} pts
                  </span>
                </div>
                
                {exercise.exercise_type !== 'flashcard' && (
                  <div className="ml-9 space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your answer:</p>
                      <p className="text-gray-900 dark:text-white">
                        {exercise.exercise_type === 'multiple_choice' 
                          ? `${userAnswer}. ${parseOptions(exercise.options, 'multiple_choice')?.[userAnswer?.charCodeAt(0) - 65] || userAnswer}`
                          : userAnswer
                        }
                      </p>
                    </div>
                    {exercise.exercise_type !== 'text_answer' && !result.is_correct && exercise.correct_answer && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct answer:</p>
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          {exercise.exercise_type === 'multiple_choice' 
                            ? `${exercise.correct_answer}. ${parseOptions(exercise.options, 'multiple_choice')?.[exercise.correct_answer?.charCodeAt(0) - 65] || exercise.correct_answer}`
                            : exercise.correct_answer
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main Exercise View
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Exercise {currentIndex + 1} of {totalExercises}
          </span>
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercise Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-start space-x-3 mb-6">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                {currentExercise.exercise_type === 'multiple_choice' && 'Multiple Choice'}
                {currentExercise.exercise_type === 'flashcard' && 'Flashcard'}
                {currentExercise.exercise_type === 'text_answer' && 'Text Answer'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentExercise.points} points
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentExercise.question}
            </h3>
          </div>
        </div>

        {renderExerciseInput()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevExercise}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>

        <button
          onClick={nextExercise}
          disabled={!canProceed()}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>{currentIndex < totalExercises - 1 ? 'Next' : 'Finish'}</span>
          {currentIndex < totalExercises - 1 ? (
            <ArrowRight className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}