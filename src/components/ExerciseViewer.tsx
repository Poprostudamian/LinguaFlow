// src/components/ExerciseViewer.tsx - NAPRAWIONA WERSJA
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'ABCD' | 'Fiszki' | 'Tekstowe';
  title: string;
  question: string;
  correct_answer: string;
  options?: string[] | any;
  explanation?: string;
  order_number: number;
  points: number;
}

interface ExerciseViewerProps {
  exercises: Exercise[];
  onComplete: (score: number, timeSpent: number) => void;
  onProgress: (currentExercise: number, totalExercises: number) => void;
}

export function ExerciseViewer({ exercises, onComplete, onProgress }: ExerciseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, exercises.length);
    }
  }, [currentIndex, exercises.length, onProgress]);

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentExercise.id]: answer
    }));
    setCurrentAnswer(answer);
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(userAnswers[exercises[currentIndex + 1]?.id] || '');
      setShowExplanation(false);
    } else {
      finishExercises();
    }
  };

  const prevExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentAnswer(userAnswers[exercises[currentIndex - 1]?.id] || '');
      setShowExplanation(false);
    }
  };

  const finishExercises = () => {
    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const earnedPoints = exercises.reduce((sum, ex) => {
      const userAnswer = userAnswers[ex.id];
      let isCorrect = false;
      
      if (ex.exercise_type === 'Fiszki') {
        isCorrect = !!userAnswer;
      } else {
        isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
      }
      
      return sum + (isCorrect ? ex.points : 0);
    }, 0);

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setShowResults(true);
    if (onComplete) {
      onComplete(score, timeSpent);
    }
  };

  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // ✅ NAPRAWIONA funkcja parseFlashcards - zawsze zwraca poprawny array
  const parseFlashcards = (exercise: Exercise): Array<{front: string, back: string}> => {
    try {
      // Jeśli options to string JSON
      if (typeof exercise.options === 'string') {
        const parsed = JSON.parse(exercise.options);
        
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.front && parsed[0]?.back) {
          return parsed;
        }
      } 
      // Jeśli options to już array obiektów
      else if (Array.isArray(exercise.options) && exercise.options.length > 0 && exercise.options[0]?.front && exercise.options[0]?.back) {
        return exercise.options;
      }
      
      // Fallback - użyj question i correct_answer
      return [{
        front: exercise.question || 'No question',
        back: exercise.correct_answer || 'No answer'
      }];
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      return [{
        front: exercise.question || 'No question',
        back: exercise.correct_answer || 'No answer'
      }];
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No exercises available for this lesson.</p>
      </div>
    );
  }

  if (showResults) {
    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const earnedPoints = exercises.reduce((sum, ex) => {
      const userAnswer = userAnswers[ex.id];
      let isCorrect = false;
      
      if (ex.exercise_type === 'Fiszki') {
        isCorrect = !!userAnswer;
      } else {
        isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
      }
      
      return sum + (isCorrect ? ex.points : 0);
    }, 0);

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Exercises Completed!
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Your Score: {score}% ({earnedPoints}/{totalPoints} points)
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Results Summary:</h4>
          {exercises.map((ex, index) => {
            const userAnswer = userAnswers[ex.id];
            let isCorrect = false;
            
            if (ex.exercise_type === 'Fiszki') {
              isCorrect = !!userAnswer;
            } else {
              isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
            }
            
            return (
              <div key={ex.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Exercise {index + 1} ({ex.exercise_type})
                </span>
                {isCorrect ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Exercise {currentIndex + 1} of {exercises.length}</span>
          <span>{currentExercise.exercise_type}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {currentExercise.title}
        </h3>
        
        {/* ✅ ABCD Type */}
        {currentExercise.exercise_type === 'ABCD' && currentExercise.options && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {currentExercise.question}
            </p>
            <div className="space-y-3">
              {Array.isArray(currentExercise.options) && currentExercise.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = currentAnswer === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(optionLetter)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="font-medium text-purple-600 dark:text-purple-400 mr-3">
                      {optionLetter}.
                    </span>
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ✅ NAPRAWIONA Fiszki Type */}
        {currentExercise.exercise_type === 'Fiszki' && (
          <div className="space-y-6">
            {parseFlashcards(currentExercise).map((flashcard, cardIndex) => {
              const cardId = `${currentExercise.id}-${cardIndex}`;
              const isFlipped = flippedCards[cardId];
              
              return (
                <div key={cardIndex} className="space-y-4">
                  <div 
                    className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 min-h-32 cursor-pointer transform transition-all duration-300 hover:scale-105 border-2 border-blue-200 dark:border-blue-700"
                    onClick={() => toggleCardFlip(cardId)}
                  >
                    <div className="text-center">
                      {!isFlipped ? (
                        <>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {String(flashcard.front)}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to reveal answer
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
                            {String(flashcard.back)}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to flip back
                          </p>
                        </>
                      )}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <RotateCcw className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Auto mark as completed */}
            {parseFlashcards(currentExercise).every((_, index) => {
              const cardId = `${currentExercise.id}-${index}`;
              return flippedCards[cardId];
            }) && !currentAnswer && (
              <div className="text-center py-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    You've viewed all flashcards! Ready to continue.
                  </p>
                  <button
                    onClick={() => handleAnswer('completed')}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Studied
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              Click on flashcards to study them. After viewing all cards, you can continue to the next exercise.
            </div>
          </div>
        )}

        {/* ✅ Tekstowe Type */}
        {currentExercise.exercise_type === 'Tekstowe' && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {currentExercise.question}
            </p>
            <div className="space-y-4">
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={4}
              />
            </div>
          </>
        )}

        {/* Explanation */}
        {showExplanation && currentExercise.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Explanation:</h4>
            <p className="text-blue-800 dark:text-blue-200">{currentExercise.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevExercise}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-3">
          {currentExercise.explanation && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-4 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>
          )}

          <button
            onClick={nextExercise}
            disabled={!currentAnswer || (currentExercise.exercise_type === 'Fiszki' && !Object.values(flippedCards).some(flipped => flipped))}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{currentIndex === exercises.length - 1 ? 'Finish' : 'Next'}</span>
            {currentIndex === exercises.length - 1 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}