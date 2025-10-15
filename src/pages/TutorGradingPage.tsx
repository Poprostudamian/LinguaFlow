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
    points: number;
    score: number;
    feedback: string;
    }>({ 
  points: 0,
  score: 0,
  feedback: '' 
});

  useEffect(() => {
    fetchPendingGradings();
  }, [session]);

 const fetchPendingGradings = async () => {
  if (!session?.user) return;
  
  setIsLoading(true);
  setError(null);

  try {
    console.log('📝 Fetching pending gradings for tutor:', session.user.id);
    
    // Call RPC function
    const { data, error: fetchError } = await supabase
      .rpc('get_tutor_pending_gradings', {
        p_tutor_id: session.user.id
      });

    if (fetchError) {
      console.error('❌ RPC Error:', fetchError);
      throw fetchError;
    }

    console.log('✅ Received data:', data);

    // ✅ ADDED: Filter and validate data to remove any null/invalid entries
    const validGradings = (data || []).filter(item => {
      // Validate required fields
      if (!item) {
        console.warn('⚠️ Null item in gradings');
        return false;
      }
      
      if (!item.answer_id || !item.exercise_id || !item.student_id) {
        console.warn('⚠️ Missing IDs in grading:', item);
        return false;
      }

      if (item.max_points === null || item.max_points === undefined) {
        console.warn('⚠️ Missing max_points for grading:', item);
        // Set default value instead of filtering out
        item.max_points = 5; // Default to 5 points
      }

      return true;
    });

    console.log('✅ Valid gradings:', validGradings.length);
    setPendingGradings(validGradings);
    
  } catch (err: any) {
    console.error('❌ Error fetching pending gradings:', err);
    setError(err.message || 'Failed to load pending gradings');
  } finally {
    setIsLoading(false);
  }
};

  const handleGradeAnswer = async (answerId: string) => {
  if (!session?.user) return;
  
  // ✅ UPDATED: Validate score (percentage) instead of raw points
  if (gradingData.score < 0 || gradingData.score > 100) {
    alert('Score must be between 0 and 100%');
    return;
  }

  try {
    console.log('📝 Grading answer:', {
      answerId,
      points: gradingData.points,
      percentage: gradingData.score,
      feedback: gradingData.feedback
    });

    // ✅ IMPORTANT: Store percentage in database (not points)
    const { error: gradeError } = await supabase
      .from('student_exercise_answers')
      .update({
        tutor_score: gradingData.score,  // Store as percentage (0-100)
        tutor_feedback: gradingData.feedback.trim() || null,
        graded_by: session.user.id,
        graded_at: new Date().toISOString(),
        needs_grading: false,
        is_correct: gradingData.score >= 50 // 50% or more = pass
      })
      .eq('id', answerId);

    if (gradeError) {
      console.error('❌ Error grading:', gradeError);
      throw gradeError;
    }

    console.log('✅ Answer graded successfully');

    // Refresh list
    await fetchPendingGradings();
    
    // Clear form
    setGradingAnswer(null);
    setGradingData({ points: 0, score: 0, feedback: '' });
    
    alert('Answer graded successfully! Student will see the results.');
    
  } catch (err: any) {
    console.error('❌ Error grading answer:', err);
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
  // ✅ ADDED: Defensive checks
  if (!grading) {
    console.warn('⚠️ Null grading in map');
    return null;
  }

  const isExpanded = expandedAnswers.has(grading.answer_id);
  const isGrading = gradingAnswer === grading.answer_id;
  const wordCount = countWords(grading.answer || '');
  const maxPoints = grading.max_points || 5; // Default to 5 if null
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
                  {grading.lesson_title || 'Untitled Lesson'}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>
                      {grading.student_first_name || ''} {grading.student_last_name || ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(grading.submitted_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{maxPoints} points max</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mt-3">
              {grading.question || 'No question text'}
            </p>
          </div>
          {/* Rest of the card... */}
        </div>
      </div>

      {/* Expanded content - Add null checks throughout */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Student's Answer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Student's Answer:
              </label>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`px-2 py-1 rounded-lg ${
                  exceedsLimit 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {wordCount} words
                  {grading.word_limit && ` / ${grading.word_limit} limit`}
                </span>
                {exceedsLimit && (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {grading.answer || 'No answer provided'}
              </p>
            </div>
          </div>

          {/* Sample Answer (if available) */}
          {grading.sample_answer && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Sample/Reference Answer:
              </label>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                  {grading.sample_answer}
                </p>
              </div>
            </div>
          )}

          {/* Grading Form - UPDATE to use maxPoints variable */}
          {!isGrading ? (
            <button
              onClick={() => {
                setGradingAnswer(grading.answer_id);
                setGradingData({ 
                  points: maxPoints * 0.8, // Default to 80%
                  score: 80,
                  feedback: '' 
                });
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Award className="h-5 w-5" />
              <span>Grade This Answer</span>
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-6">
              {/* Grading form - use the new points-based input from previous artifact */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Score
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Max: {maxPoints} points
                  </span>
                </div>
                
                {/* Points input with visual percentage display */}
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    max={maxPoints}
                    step="0.5"
                    value={gradingData.points !== undefined ? gradingData.points : ''}
                    onChange={(e) => {
                      const points = parseFloat(e.target.value) || 0;
                      const percentage = Math.round((points / maxPoints) * 100);
                      setGradingData({ 
                        ...gradingData, 
                        points: points,
                        score: percentage 
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-lg font-semibold"
                    placeholder={`Enter points (0-${maxPoints})`}
                  />
                  
                  {/* Visual percentage indicator */}
                  {gradingData.points !== undefined && gradingData.points >= 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              gradingData.score >= 80 
                                ? 'bg-green-500' 
                                : gradingData.score >= 50 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(gradingData.score, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`ml-4 text-sm font-semibold ${
                        gradingData.score >= 80 
                          ? 'text-green-600 dark:text-green-400' 
                          : gradingData.score >= 50 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {gradingData.score}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-2">
                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Enter the points earned (e.g., 3.5 out of {maxPoints}). 
                      Student will see both points and percentage.
                    </span>
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={gradingData.feedback}
                  onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Provide feedback to help the student improve..."
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setGradingAnswer(null);
                    setGradingData({ points: 0, score: 0, feedback: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGradeAnswer(grading.answer_id)}
                  disabled={gradingData.points === undefined || gradingData.points < 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Submit Grade</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}).filter(Boolean)}

                    {/* Grading Form */}
                    <div className="space-y-6">
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Score
      </label>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Max: {gradingAnswer.max_points} points
      </span>
    </div>
    
    {/* ✅ UPDATED: Points input with visual percentage display */}
    <div className="space-y-2">
      <input
        type="number"
        min="0"
        max={gradingAnswer.max_points}
        step="0.5"
        value={gradingData.points !== undefined ? gradingData.points : ''}
        onChange={(e) => {
          const points = parseFloat(e.target.value) || 0;
          const percentage = Math.round((points / gradingAnswer.max_points) * 100);
          setGradingData({ 
            ...gradingData, 
            points: points,
            score: percentage 
          });
        }}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-lg font-semibold"
        placeholder={`Enter points (0-${gradingAnswer.max_points})`}
      />
      
      {/* Visual percentage indicator */}
      {gradingData.points !== undefined && gradingData.points >= 0 && (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  gradingData.score >= 80 
                    ? 'bg-green-500' 
                    : gradingData.score >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(gradingData.score, 100)}%` }}
              />
            </div>
          </div>
          <span className={`ml-4 text-sm font-semibold ${
            gradingData.score >= 80 
              ? 'text-green-600 dark:text-green-400' 
              : gradingData.score >= 50 
              ? 'text-yellow-600 dark:text-yellow-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {gradingData.score}%
          </span>
        </div>
      )}
    </div>

    {/* ✅ ADDED: Info box explaining points */}
    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-2">
        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
        <span>
          Enter the points earned (e.g., 3.5 out of {gradingAnswer.max_points}). 
          Student will see both points and percentage.
        </span>
      </p>
    </div>
  </div>

  {/* Feedback section stays the same */}
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Feedback (Optional)
    </label>
    <textarea
      value={gradingData.feedback}
      onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
      rows={4}
      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
      placeholder="Provide feedback to help the student improve..."
    />
  </div>

  {/* Submit button */}
  <div className="flex items-center justify-end space-x-3">
    <button
      onClick={() => {
        setGradingAnswer(null);
        setGradingData({ points: 0, score: 0, feedback: '' });
      }}
      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      Cancel
    </button>
    <button
      onClick={() => handleGradeAnswer(gradingAnswer.answer_id)}
      disabled={gradingData.points === undefined || gradingData.points < 0}
      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      <CheckCircle className="h-5 w-5" />
      <span>Submit Grade</span>
    </button>
  </div>
</div>
                  </div>
                )}
              </div>
            );
          })}
      )}
    </div>
  );
}