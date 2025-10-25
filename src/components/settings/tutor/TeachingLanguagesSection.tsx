// src/components/settings/tutor/TeachingLanguagesSection.tsx
import React, { useState } from 'react';
import { Globe, X, Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TeachingLanguagesSectionProps {
  languages: string[];
  onChange: (languages: string[]) => void;
}

export function TeachingLanguagesSection({ languages, onChange }: TeachingLanguagesSectionProps) {
  const { t } = useLanguage();
  const [newLanguage, setNewLanguage] = useState('');

  const MAX_LANGUAGES = 5;

  const popularLanguages = [
    'English',
    'Polish',
    'Spanish',
    'German',
    'French',
    'Italian',
    'Russian',
    'Chinese',
    'Japanese',
    'Korean'
  ];

  const handleAddLanguage = (lang: string) => {
    if (languages.length >= MAX_LANGUAGES) return;
    if (languages.includes(lang)) return;
    
    onChange([...languages, lang]);
  };

  const handleAddCustomLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newLanguage.trim()) {
      e.preventDefault();
      const trimmed = newLanguage.trim();
      
      if (languages.length >= MAX_LANGUAGES) {
        setNewLanguage('');
        return;
      }
      
      if (languages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
        setNewLanguage('');
        return;
      }
      
      handleAddLanguage(trimmed);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    onChange(languages.filter(l => l !== lang));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.tutorSettings?.languagesSection?.title || 'Teaching Languages'}
            </h3>
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
              ({languages.length}/{MAX_LANGUAGES})
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.languagesSection?.description || 'Languages you teach or offer lessons in'}
          </p>
        </div>
      </div>

      {/* Add Custom Language */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.tutorSettings?.languagesSection?.addLanguage || 'Add Language'}
        </label>
        <div className="relative">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyDown={handleAddCustomLanguage}
            placeholder={t.tutorSettings?.languagesSection?.languagePlaceholder || 'Type and press Enter'}
            disabled={languages.length >= MAX_LANGUAGES}
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Plus className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Popular Languages */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.tutorSettings?.languagesSection?.popularLanguages || 'Popular Languages'}
        </label>
        <div className="flex flex-wrap gap-2">
          {popularLanguages
            .filter(lang => !languages.includes(lang))
            .map((lang) => (
              <button
                key={lang}
                onClick={() => handleAddLanguage(lang)}
                disabled={languages.length >= MAX_LANGUAGES}
                className="px-3 py-1.5 text-sm rounded-full border-2 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {lang}
              </button>
            ))}
        </div>
      </div>

      {/* Selected Languages */}
      {languages.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.tutorSettings?.languagesSection?.yourLanguages || 'Your Teaching Languages'}
          </label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <div
                key={lang}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800 rounded-full"
              >
                <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-teal-800 dark:text-teal-200">
                  {lang}
                </span>
                <button
                  onClick={() => handleRemoveLanguage(lang)}
                  className="ml-1 text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.languagesSection?.noLanguages || 'No teaching languages added yet'}
          </p>
        </div>
      )}
    </div>
  );
}