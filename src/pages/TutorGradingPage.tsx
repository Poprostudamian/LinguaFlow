// src/pages/TutorGradingPage.tsx
// Panel dla tutora do oceniania zadań tekstowych studentów
// ✅ UPDATED: Używa funkcji RPC zamiast widoku

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  Clock, 
  User, 
  Check, 
  X, 
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PendingGrading {
  answer_id: string;
  student_id: string;
  exercise_id: string;
  answer: string;
  submitted_at: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  question: string;
  sample_answer: string | null;
  max_points: number;
  word_limit: number | null;
  lesson_id: string;
  lesson_title: string;
  tutor_id: string;
}

export function TutorGradingPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [pendingGradings, setPendingGradings] = useState<PendingGrading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [gradingAnswer, setGradingAnswer] = useState<string | null>(null);
  const [gradingData, setGradingData] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: '' });

  useEffect(() => {
    fetchPendingGradings();
  }, [session]);

  const fetchPendingGradings = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // ✅ ZMIENIONE: Używamy funkcji RPC zamiast SELECT FROM view
      const { data, error: fetchError } = await supabase
        .rpc('get_tutor_pending_gradings', {
          p_tutor_id: session.user.id
        });

      if (fetchError) throw fetchError;

      setPendingGradings(data || []);
    } catch (err: any) {
      console.error('Error fetching pending gradings:', err);
      setError(err.message || 'Failed to load pending gradings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeAnswer = async (answerId: string) => {
    if (!session?.user) return;
    if (gradingData.score < 0 || gradingData.score > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    try {
      const { error: gradeError } = await supabase
        .from('student_exercise_answers')
        .update({
          tutor_score: gradingData.score,
          tutor_feedback: gradingData.feedback.trim() || null,
          graded_by: session.user.id,
          graded_at: new Date().toISOString(),
          needs_grading: false,
          is_correct: gradingData.score >= 50 // 50% lub więcej = zaliczone
        })
        .eq('id', answerId);

      if (gradeError) throw gradeError;

      // Odśwież listę
      await fetchPendingGradings();
      
      // Wyczyść formularz
      setGradingAnswer(null);
      setGradingData({ score: 0, feedback: '' });
      
      alert('Answer graded successfully!');
    } catch (err: any) {
      console.error('Error grading answer:', err);
      alert('Failed to grade answer: ' + err.message);
    }
  };

  const toggleExpanded = (answerId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending gradings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
          <h3 className="text-red-800 dark:text-red-200 font-medium">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Award className="h-8 w-8 text-purple-600" />
            <span>Student Answers to Grade</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and grade text answers submitted by your students
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 px-6 py-3 rounded-xl">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Pending
          </p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {pendingGradings.length}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {pendingGradings.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border-2 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no pending text answers to grade at this time.
          </p>
        </div>
      ) : (
        /* Pending Gradings List */
        <div className="space-y-4">
          {pendingGradings.map((grading) => {
            const isExpanded = expandedAnswers.has(grading.answer_id);
            const isGrading = gradingAnswer === grading.answer_id;
            const wordCount = countWords(grading.answer);
            const exceedsLimit = grading.word_limit && wordCount > grading.word_limit;

            return (
              <div
                key={grading.answer_id}
                className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {grading.lesson_title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{grading.student_first_name} {grading.student_last_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(grading.submitted_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{grading.max_points} points max</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mt-3">
                        {grading.question}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpanded(grading.answer_id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-5 space-y-4">
                    {/* Student Answer */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Student's Answer:
                        </label>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`px-2 py-1 rounded-lg ${
                            exceedsLimit 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {wordCount} words
                          </span>
                          {grading.word_limit && (
                            <span className="text-gray-500 dark:text-gray-400">
                              (limit: {grading.word_limit})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {grading.answer}
                        </p>
                      </div>
                      {exceedsLimit && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>This answer exceeds the word limit</span>
                        </p>
                      )}
                    </div>

                    {/* Sample Answer (if provided by tutor) */}
                    {grading.sample_answer && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Sample Answer (Reference):
                        </label>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                            {grading.sample_answer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Grading Form */}
                    {!isGrading ? (
                      <button
                        onClick={() => {
                          setGradingAnswer(grading.answer_id);
                          setGradingData({ 
                            score: Math.round(grading.max_points * 0.8), // Domyślnie 80% punktów
                            feedback: '' 
                          });
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Award className="h-5 w-5" />
                        <span>Grade This Answer</span>
                      </button>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Score (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={gradingData.score}
                            onChange={(e) => setGradingData({
                              ...gradingData,
                              score: parseInt(e.target.value) || 0
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Max points for this exercise: {grading.max_points}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Feedback for Student (Optional)
                          </label>
                          <textarea
                            value={gradingData.feedback}
                            onChange={(e) => setGradingData({
                              ...gradingData,
                              feedback: e.target.value
                            })}
                            placeholder="Provide constructive feedback about their answer..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none"
                          />
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleGradeAnswer(grading.answer_id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Submit Grade</span>
                          </button>
                          <button
                            onClick={() => {
                              setGradingAnswer(null);
                              setGradingData({ score: 0, feedback: '' });
                            }}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}