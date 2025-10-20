// src/components/ExerciseViewer.tsx - Complete file

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Eye, EyeOff, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  lessonId?: string;
}

export function ExerciseViewer({ exercises, onComplete, onProgress, lessonId }: ExerciseViewerProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

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
    onComplete(score, timeSpent);
  };

  const toggleExplanation = () => {
    setShowExplanation(!showExplanation);
  };

  const toggleCardFlip = (cardIndex: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardIndex]: !prev[cardIndex]
    }));
  };

  const toggleResultExpansion = (index: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // RESULTS VIEW
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Header */}
        <div className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Exercises Completed!
          </h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            Your Score: {score}%
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {earnedPoints} out of {totalPoints} points
          </p>

          {/* View Full History Button */}
          {lessonId && (
            <button
              onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              <History className="h-5 w-5" />
              <span>View Full Lesson History</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Summary Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-800 dark:text-blue-200 text-center">
            💡 <strong>Tip:</strong> You can review your answers below or visit the full lesson history page to see all past attempts.
          </p>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Your Answers Review
          </h4>
          
          {exercises.map((ex, index) => {
            const userAnswer = userAnswers[ex.id];
            let isCorrect = false;
            
            if (ex.exercise_type === 'Fiszki') {
              isCorrect = !!userAnswer;
            } else {
              isCorrect = userAnswer?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
            }

            const isExpanded = expandedResults[index];
            
            return (
              <div 
                key={ex.id} 
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isCorrect 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleResultExpansion(index)}
                  className="w-full p-4 text-left hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          Exercise {index + 1}: {ex.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isCorrect ? 'Correct' : 'Incorrect'} • {ex.points} point{ex.points !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="pt-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Question:</p>
                        <p className="text-gray-900 dark:text-white">{ex.question}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Your Answer:</p>
                          <p className={`font-medium ${
                            isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {userAnswer || 'No answer provided'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Correct Answer:</p>
                          <p className="font-medium text-green-700 dark:text-green-300">
                            {ex.correct_answer}
                          </p>
                        </div>
                      </div>

                      {ex.explanation && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            💡 Explanation:
                          </p>
                          <p className="text-blue-800 dark:text-blue-200">
                            {ex.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom History Link */}
        {lessonId && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => navigate(`/student/lessons/${lessonId}/history`)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              <History className="h-6 w-6" />
              <span>View Complete Lesson History</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // EXERCISE SOLVING VIEW
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
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

      {/* Exercise Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {currentExercise.title}
        </h3>
        
        {/* Multiple Choice */}
        {currentExercise.exercise_type === 'ABCD' && currentExercise.options && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{currentExercise.question}</p>
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
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    <span className="font-medium text-purple-600 dark:text-purple-400 mr-3">
                      {optionLetter}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Flashcards */}
        {currentExercise.exercise_type === 'Fiszki' && currentExercise.options && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{currentExercise.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(currentExercise.options) && currentExercise.options.map((card: any, index) => {
                const isFlipped = flippedCards[index];
                
                return (
                  <div
                    key={index}
                    onClick={() => toggleCardFlip(index)}
                    className="relative h-32 cursor-pointer"
                    style={{ perspective: '1000px' }}
                  >
                    <div 
                      className={`absolute inset-0 w-full h-full transition-transform duration-500 ${
                        isFlipped ? 'transform rotateY-180' : ''
                      }`}
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front */}
                      <div 
                        className="absolute inset-0 w-full h-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center p-4"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <p className="text-center font-medium text-gray-900 dark:text-white">
                          {card.front}
                        </p>
                      </div>
                      
                      {/* Back */}
                      <div 
                        className="absolute inset-0 w-full h-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-600 rounded-lg flex items-center justify-center p-4"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <p className="text-center font-medium text-purple-900 dark:text-purple-100">
                          {card.back}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => handleAnswer('completed')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Mark as Studied
              </button>
            </div>
          </>
        )}

        {/* Text Answer */}
        {currentExercise.exercise_type === 'Tekstowe' && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{currentExercise.question}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </>
        )}

        {/* Explanation Toggle */}
        {currentExercise.explanation && (
          <div className="mt-6">
            <button
              onClick={toggleExplanation}
              className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
            >
              {showExplanation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showExplanation ? 'Hide' : 'Show'} Explanation</span>
            </button>
            
            {showExplanation && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200">
                  {currentExercise.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevExercise}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2">
          {exercises.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-purple-600'
                  : index < currentIndex
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextExercise}
          disabled={!currentAnswer}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span>{currentIndex === exercises.length - 1 ? 'Finish' : 'Next'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}