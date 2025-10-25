// src/components/settings/student/StudentAboutSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface StudentAboutSectionProps {
  aboutMe: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 500;

export function StudentAboutSection({ aboutMe, onChange }: StudentAboutSectionProps) {
  const { t } = useLanguage();
  const remainingChars = MAX_LENGTH - aboutMe.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.studentSettings.aboutSection.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.aboutSection.description}
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div>
        <div className="relative">
          <textarea
            value={aboutMe}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={t.studentSettings.aboutSection.placeholder}
            rows={6}
            maxLength={MAX_LENGTH}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded">
            {remainingChars} {t.studentSettings.aboutSection.charactersLeft.replace('{count}', remainingChars.toString())}
          </div>
        </div>
        
        {/* Character Count */}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t.studentSettings.aboutSection.maxLength}
        </p>

        {/* Preview */}
        {aboutMe && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {aboutMe}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}