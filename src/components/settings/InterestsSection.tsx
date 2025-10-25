// src/components/settings/InterestsSection.tsx
// Interests & Specializations section with badge system (max 3)

import React, { useState } from 'react';
import { Award, Plus, X } from 'lucide-react';

interface InterestsSectionProps {
  interests: string[];
  onUpdate: (interests: string[]) => void;
  translations: any;
}

// Predefined popular interests/specializations
const POPULAR_INTERESTS = [
  'Spanish Language',
  'English Language',
  'German Language',
  'French Language',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'Programming',
  'Literature',
  'Art',
  'Music',
  'Economics',
  'Psychology',
  'Philosophy'
];

// Badge color variants
const BADGE_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-300 dark:border-pink-700',
];

export function InterestsSection({
  interests,
  onUpdate,
  translations
}: InterestsSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  const MAX_INTERESTS = 3;

  const addInterest = (interest: string) => {
    if (interests.length >= MAX_INTERESTS) {
      return;
    }
    if (!interests.includes(interest)) {
      onUpdate([...interests, interest]);
    }
    setShowAddModal(false);
    setCustomInterest('');
  };

  const removeInterest = (interest: string) => {
    onUpdate(interests.filter(i => i !== interest));
  };

  const handleCustomAdd = () => {
    if (customInterest.trim() && customInterest.trim().length >= 2) {
      addInterest(customInterest.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {translations.interestsTitle || 'Interests & Specializations'}
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {interests.length}/{MAX_INTERESTS}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {translations.interestsDescription || 'Add up to 3 subjects or skills you specialize in.'}
      </p>

      {/* Current Interests */}
      <div className="space-y-3 mb-6">
        {interests.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {translations.noInterestsYet || 'No interests added yet'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {interests.map((interest, index) => (
              <div
                key={interest}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${
                  BADGE_COLORS[index % BADGE_COLORS.length]
                } transition-all duration-200 hover:scale-105`}
              >
                <span className="font-medium">{interest}</span>
                <button
                  onClick={() => removeInterest(interest)}
                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-colors"
                  aria-label="Remove interest"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      {interests.length < MAX_INTERESTS && (
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">
            {translations.addInterest || 'Add Interest'}
          </span>
        </button>
      )}

      {interests.length >= MAX_INTERESTS && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          {translations.maxInterestsReached || 'Maximum 3 interests reached. Remove one to add another.'}
        </p>
      )}

      {/* Add Interest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {translations.addInterestTitle || 'Add Interest or Specialization'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setCustomInterest('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Custom Interest Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translations.customInterest || 'Custom Interest'}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomAdd()}
                    placeholder={translations.customInterestPlaceholder || 'Enter custom interest...'}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={50}
                  />
                  <button
                    onClick={handleCustomAdd}
                    disabled={!customInterest.trim() || customInterest.trim().length < 2}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {translations.add || 'Add'}
                  </button>
                </div>
              </div>

              {/* Popular Interests */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {translations.popularInterests || 'Popular Interests'}
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {POPULAR_INTERESTS.filter(pi => !interests.includes(pi)).map(interest => (
                    <button
                      key={interest}
                      onClick={() => addInterest(interest)}
                      className="text-left px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}