// src/components/settings/student/LearningGoalsSection.tsx
import React, { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LearningGoalsSectionProps {
  goals: string[];
  onChange: (goals: string[]) => void;
}

const POPULAR_GOALS = [
  'English Matura Preparation',
  'Spanish A2 Level',
  'Mathematics - Functions',
  'Physics - Mechanics',
  'IELTS Preparation',
  'Business English',
  'German B1 Level',
  'Italian Conversation',
];

const POPULAR_GOALS_PL = [
  'Przygotowanie do matury z Angielskiego',
  'Język Hiszpański A2',
  'Matematyka - Funkcje',
  'Fizyka - Mechanika',
  'Przygotowanie do IELTS',
  'Angielski Biznesowy',
  'Język Niemiecki B1',
  'Konwersacje Włoskie',
];

const GOAL_COLORS = [
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
];

export function LearningGoalsSection({ goals, onChange }: LearningGoalsSectionProps) {
  const { t, language } = useLanguage();
  const [newGoal, setNewGoal] = useState('');
  const [showInput, setShowInput] = useState(false);

  const popularGoals = language === 'pl' ? POPULAR_GOALS_PL : POPULAR_GOALS;

  const addGoal = (goal: string) => {
    if (goal.trim() && goals.length < 8 && !goals.includes(goal.trim())) {
      onChange([...goals, goal.trim()]);
      setNewGoal('');
      setShowInput(false);
    }
  };

  const removeGoal = (goalToRemove: string) => {
    onChange(goals.filter(g => g !== goalToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addGoal(newGoal);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.studentSettings.learningGoalsSection.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.learningGoalsSection.description}
          </p>
        </div>
      </div>

      {/* Your Goals */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.studentSettings.learningGoalsSection.yourGoals}
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {goals.length}/8 {t.studentSettings.learningGoalsSection.maxGoals}
          </span>
        </div>

        {/* Goals Display */}
        {goals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Target className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.studentSettings.learningGoalsSection.noGoals}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {goals.map((goal, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${GOAL_COLORS[index % GOAL_COLORS.length]}`}
              >
                {goal}
                <button
                  type="button"
                  onClick={() => removeGoal(goal)}
                  className="ml-2 hover:opacity-70 transition-opacity"
                  title={t.studentSettings.learningGoalsSection.removeGoal}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Goal Input */}
        {showInput ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.studentSettings.learningGoalsSection.goalPlaceholder}
              maxLength={50}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => addGoal(newGoal)}
              disabled={!newGoal.trim() || goals.length >= 8}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.studentSettings.learningGoalsSection.addGoal}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setNewGoal('');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {t.studentSettings.accountSettingsSection.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            disabled={goals.length >= 8}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t.studentSettings.learningGoalsSection.addGoal}</span>
          </button>
        )}
      </div>

      {/* Popular Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.studentSettings.learningGoalsSection.popularGoals}
        </label>
        <div className="flex flex-wrap gap-2">
          {popularGoals
            .filter(goal => !goals.includes(goal))
            .slice(0, 6)
            .map((goal, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addGoal(goal)}
                disabled={goals.length >= 8}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {goal}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}