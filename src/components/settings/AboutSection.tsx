// src/components/settings/AboutSection.tsx
// About Me section with character counter (max 500 characters)

import React, { useState } from 'react';
import { FileText } from 'lucide-react';

interface AboutSectionProps {
  aboutMe: string;
  onUpdate: (aboutMe: string) => void;
  translations: any;
}

const MAX_CHARACTERS = 500;

export function AboutSection({
  aboutMe,
  onUpdate,
  translations
}: AboutSectionProps) {
  const [localAboutMe, setLocalAboutMe] = useState(aboutMe);
  const remainingChars = MAX_CHARACTERS - localAboutMe.length;

  const handleChange = (value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      setLocalAboutMe(value);
      onUpdate(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.aboutTitle || 'About Me'}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({translations.optional || 'Optional'})
          </span>
        </h2>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {translations.aboutDescription || 'Write a brief description about yourself, your teaching experience, or your approach to tutoring.'}
      </p>

      <div className="space-y-2">
        <textarea
          value={localAboutMe}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={translations.aboutPlaceholder || 'Tell students a bit about yourself...'}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
          rows={6}
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {translations.charactersUsed || 'Characters used'}: {localAboutMe.length}/{MAX_CHARACTERS}
          </span>
          <span className={`font-medium ${
            remainingChars < 50 
              ? 'text-orange-600 dark:text-orange-400' 
              : remainingChars === 0 
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            {remainingChars} {translations.remaining || 'remaining'}
          </span>
        </div>

        {/* Preview */}
        {localAboutMe.trim() && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              {translations.preview || 'Preview'}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {localAboutMe}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}