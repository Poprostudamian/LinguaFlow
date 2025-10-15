// src/components/PendingGradingsWidget.tsx
// ✅ UPDATED: Używa funkcji RPC zamiast widoku
// Widget dla dashboard tutora pokazujący pending gradings

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Award, 
  Clock, 
  User, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface PendingGradingSummary {
  answer_id: string;
  student_name: string;
  lesson_title: string;
  question: string;
  submitted_at: string;
  max_points: number;
}

export function PendingGradingsWidget() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [pendingGradings, setPendingGradings] = useState<PendingGradingSummary[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingGradings();
    
    // Refresh co 2 minuty
    const interval = setInterval(fetchPendingGradings, 120000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchPendingGradings = async () => {
    if (!session?.user) return;

    try {
      // ✅ ZMIENIONE: Używamy funkcji RPC
      const { data, error } = await supabase
        .rpc('get_tutor_pending_gradings', {
          p_tutor_id: session.user.id
        });

      if (error) throw error;

      const summaries: PendingGradingSummary[] = (data || []).slice(0, 5).map(item => ({
        answer_id: item.answer_id,
        student_name: `${item.student_first_name} ${item.student_last_name}`,
        lesson_title: item.lesson_title,
        question: item.question,
        submitted_at: item.submitted_at,
        max_points: item.max_points
      }));

      setPendingGradings(summaries);
      setTotalPending(data?.length || 0);
    } catch (err) {
      console.error('Error fetching pending gradings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (totalPending === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border-2 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              All Caught Up! 🎉
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No pending text answers to grade at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pending Gradings
            </h2>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-red-700 dark:text-red-300">
              {totalPending} waiting
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Student text answers requiring your review
        </p>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {pendingGradings.map((grading, idx) => (
          <div
            key={grading.answer_id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={() => navigate('/tutor/grading')}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {grading.lesson_title}
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    {grading.max_points} pts
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                  {grading.question}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{grading.student_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(grading.submitted_at)}</span>
                  </div>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/tutor/grading')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <span>View All Pending Gradings</span>
          <TrendingUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION - dla sidebar/małych przestrzeni
// ============================================================================

export function PendingGradingsCompact() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      if (!session?.user) return;
      
      try {
        // ✅ ZMIENIONE: Używamy funkcji RPC do liczenia
        const { data, error } = await supabase
          .rpc('count_tutor_pending_gradings', {
            p_tutor_id: session.user.id
          });
        
        if (!error) {
          setCount(data || 0);
        }
      } catch (err) {
        console.error('Error fetching pending count:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [session]);

  if (isLoading) return null;
  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate('/tutor/grading')}
      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        <Award className="h-5 w-5" />
        <span>Grade Answers</span>
      </div>
      <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
        {count}
      </span>
    </button>
  );
}