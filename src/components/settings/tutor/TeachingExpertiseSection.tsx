// src/components/settings/tutor/TeachingExpertiseSection.tsx
import React, { useState } from 'react';
import { Award, X, Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TeachingExpertiseSectionProps {
  expertise: string[];
  onChange: (expertise: string[]) => void;
}

export function TeachingExpertiseSection({ expertise, onChange }: TeachingExpertiseSectionProps) {
  const { t } = useLanguage();
  const [newExpertise, setNewExpertise] = useState('');

  const MAX_EXPERTISE = 8;

  const popularExpertise = [
    'Grammar',
    'Conversation',
    'Business English',
    'Exam Preparation',
    'Writing Skills',
    'Pronunciation',
    'Literature',
    'Academic English',
    'IELTS/TOEFL',
    'Cambridge Exams',
    'English for Kids',
    'Advanced Speaking'
  ];

  const handleAddExpertise = (item: string) => {
    if (expertise.length >= MAX_EXPERTISE) return;
    if (expertise.includes(item)) return;
    
    onChange([...expertise, item]);
  };

  const handleAddCustomExpertise = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newExpertise.trim()) {
      e.preventDefault();
      const trimmed = newExpertise.trim();
      
      if (expertise.length >= MAX_EXPERTISE) {
        setNewExpertise('');
        return;
      }
      
      if (expertise.some(exp => exp.toLowerCase() === trimmed.toLowerCase())) {
        setNewExpertise('');
        return;
      }
      
      handleAddExpertise(trimmed);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (item: string) => {
    onChange(expertise.filter(exp => exp !== item));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center">
          <Award className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.tutorSettings?.expertiseSection?.title || 'Teaching Expertise & Specializations'}
            </h3>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              ({expertise.length}/{MAX_EXPERTISE})
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.expertiseSection?.description || 'Your areas of specialization and teaching strengths'}
          </p>
        </div>
      </div>

      {/* Add Custom Expertise */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.tutorSettings?.expertiseSection?.addExpertise || 'Add Expertise Area'}
        </label>
        <div className="relative">
          <input
            type="text"
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            onKeyDown={handleAddCustomExpertise}
            placeholder={t.tutorSettings?.expertiseSection?.expertisePlaceholder || 'Type and press Enter (max 8)'}
            disabled={expertise.length >= MAX_EXPERTISE}
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Plus className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Popular Expertise */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.tutorSettings?.expertiseSection?.popularExpertise || 'Popular Specializations'}
        </label>
        <div className="flex flex-wrap gap-2">
          {popularExpertise
            .filter(item => !expertise.includes(item))
            .map((item) => (
              <button
                key={item}
                onClick={() => handleAddExpertise(item)}
                disabled={expertise.length >= MAX_EXPERTISE}
                className="px-3 py-1.5 text-sm rounded-full border-2 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {item}
              </button>
            ))}
        </div>
      </div>

      {/* Selected Expertise */}
      {expertise.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.tutorSettings?.expertiseSection?.yourExpertise || 'Your Expertise Areas'}
          </label>
          <div className="flex flex-wrap gap-2">
            {expertise.map((item) => (
              <div
                key={item}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800 rounded-full"
              >
                <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {item}
                </span>
                <button
                  onClick={() => handleRemoveExpertise(item)}
                  className="ml-1 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.expertiseSection?.noExpertise || 'No expertise areas added yet'}
          </p>
        </div>
      )}
    </div>
  );
}