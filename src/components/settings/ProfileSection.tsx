// src/pages/settings/ProfileSectionTutor.tsx
import React, { useState, useEffect } from 'react';
import { User, Briefcase, GraduationCap, Globe, BookOpen, Sun, Moon, X, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TutorProfile {
  bio?: string;
  expertise?: string[];
  teachingExperience?: string;
  specializations?: string[];
  education?: string;
  languages?: string[];
  hourlyRate?: number;
}

interface ProfileSectionTutorProps {
  profile: TutorProfile;
  onUpdateProfile: (updates: Partial<TutorProfile>) => void;
  theme: 'light' | 'dark';
  onUpdateTheme: (theme: 'light' | 'dark') => void;
}

export function ProfileSectionTutor({
  profile,
  onUpdateProfile,
  theme,
  onUpdateTheme
}: ProfileSectionTutorProps) {
  const { t } = useLanguage();

  // Local state
  const [bio, setBio] = useState(profile.bio || '');
  const [teachingExperience, setTeachingExperience] = useState(profile.teachingExperience || '');
  const [education, setEducation] = useState(profile.education || '');
  const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate?.toString() || '');
  
  // Teaching Interests/Expertise - MAX 8
  const [newExpertise, setNewExpertise] = useState('');
  const [expertise, setExpertise] = useState<string[]>(profile.expertise || []);

  // Specializations
  const [newSpecialization, setNewSpecialization] = useState('');
  const [specializations, setSpecializations] = useState<string[]>(profile.specializations || []);

  // Languages
  const [newLanguage, setNewLanguage] = useState('');
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);

  // Sync with props
  useEffect(() => {
    setBio(profile.bio || '');
    setTeachingExperience(profile.teachingExperience || '');
    setEducation(profile.education || '');
    setHourlyRate(profile.hourlyRate?.toString() || '');
    setExpertise(profile.expertise || []);
    setSpecializations(profile.specializations || []);
    setLanguages(profile.languages || []);
  }, [profile]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBioChange = (value: string) => {
    setBio(value);
    onUpdateProfile({ bio: value });
  };

  const handleTeachingExperienceChange = (value: string) => {
    setTeachingExperience(value);
    onUpdateProfile({ teachingExperience: value });
  };

  const handleEducationChange = (value: string) => {
    setEducation(value);
    onUpdateProfile({ education: value });
  };

  const handleHourlyRateChange = (value: string) => {
    setHourlyRate(value);
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate >= 0) {
      onUpdateProfile({ hourlyRate: rate });
    }
  };

  // ✅ FIXED: Theme Toggle (jak w innych komponentach projektu)
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    onUpdateTheme(newTheme);
  };

  // Teaching Interests (MAX 8)
  const handleAddExpertise = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newExpertise.trim()) {
      e.preventDefault();
      
      if (expertise.length >= 8) {
        return;
      }

      const trimmed = newExpertise.trim();
      if (!expertise.includes(trimmed)) {
        const updated = [...expertise, trimmed];
        setExpertise(updated);
        onUpdateProfile({ expertise: updated });
      }
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (item: string) => {
    const updated = expertise.filter(i => i !== item);
    setExpertise(updated);
    onUpdateProfile({ expertise: updated });
  };

  // Specializations
  const handleAddSpecialization = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSpecialization.trim()) {
      e.preventDefault();
      const trimmed = newSpecialization.trim();
      if (!specializations.includes(trimmed)) {
        const updated = [...specializations, trimmed];
        setSpecializations(updated);
        onUpdateProfile({ specializations: updated });
      }
      setNewSpecialization('');
    }
  };

  const handleRemoveSpecialization = (item: string) => {
    const updated = specializations.filter(i => i !== item);
    setSpecializations(updated);
    onUpdateProfile({ specializations: updated });
  };

  // Languages
  const handleAddLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newLanguage.trim()) {
      e.preventDefault();
      const trimmed = newLanguage.trim();
      if (!languages.includes(trimmed)) {
        const updated = [...languages, trimmed];
        setLanguages(updated);
        onUpdateProfile({ languages: updated });
      }
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (item: string) => {
    const updated = languages.filter(i => i !== item);
    setLanguages(updated);
    onUpdateProfile({ languages: updated });
  };

  return (
    <div className="space-y-6">
      {/* Professional Bio */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <User className="h-4 w-4" />
          <span>{t.settings?.tutorBio || 'Professional Bio'}</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => handleBioChange(e.target.value)}
          placeholder="Tell students about your teaching philosophy and experience..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {bio.length}/500 characters
        </p>
      </div>

      {/* ✅ Teaching Interests & Expertise - MAX 8 */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>{t.settings?.teachingExpertise || 'Teaching Interests & Expertise'}</span>
          </div>
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            ({expertise.length}/8)
          </span>
        </label>
        <input
          type="text"
          value={newExpertise}
          onChange={(e) => setNewExpertise(e.target.value)}
          onKeyDown={handleAddExpertise}
          placeholder="Type and press Enter (max 8)"
          disabled={expertise.length >= 8}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {expertise.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
              >
                {item}
                <button
                  onClick={() => handleRemoveExpertise(item)}
                  className="ml-2 hover:text-purple-900 dark:hover:text-purple-100"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {expertise.length >= 8 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center space-x-1">
            <span>⚠️</span>
            <span>Maximum 8 areas of expertise reached</span>
          </p>
        )}
      </div>

      {/* Teaching Experience */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Briefcase className="h-4 w-4" />
          <span>{t.settings?.teachingExperience || 'Teaching Experience'}</span>
        </label>
        <textarea
          value={teachingExperience}
          onChange={(e) => handleTeachingExperienceChange(e.target.value)}
          placeholder="Describe your teaching background, years of experience..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
      </div>

      {/* Specializations */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <GraduationCap className="h-4 w-4" />
          <span>{t.settings?.specializations || 'Specializations'}</span>
        </label>
        <input
          type="text"
          value={newSpecialization}
          onChange={(e) => setNewSpecialization(e.target.value)}
          onKeyDown={handleAddSpecialization}
          placeholder="e.g., Business English, IELTS Prep (press Enter)"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {specializations.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
              >
                {item}
                <button
                  onClick={() => handleRemoveSpecialization(item)}
                  className="ml-2 hover:text-blue-900 dark:hover:text-blue-100"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <GraduationCap className="h-4 w-4" />
          <span>{t.settings?.education || 'Education'}</span>
        </label>
        <input
          type="text"
          value={education}
          onChange={(e) => handleEducationChange(e.target.value)}
          placeholder="e.g., MA in Education, TEFL Certified, PhD in Linguistics"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Languages Taught */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Globe className="h-4 w-4" />
          <span>{t.settings?.languagesTaught || 'Languages Taught'}</span>
        </label>
        <input
          type="text"
          value={newLanguage}
          onChange={(e) => setNewLanguage(e.target.value)}
          onKeyDown={handleAddLanguage}
          placeholder="e.g., English, Spanish, French (press Enter)"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {languages.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
              >
                {item}
                <button
                  onClick={() => handleRemoveLanguage(item)}
                  className="ml-2 hover:text-green-900 dark:hover:text-green-100"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.settings?.hourlyRate || 'Hourly Rate'} (USD)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => handleHourlyRateChange(e.target.value)}
          placeholder="50.00"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* ✅ FIXED: Theme Toggle - TAK JAK U STUDENTA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.settings?.theme || 'Theme'}
        </label>
        <div className="flex space-x-4">
          {/* Light Button */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <Sun className="h-4 w-4" />
            <span className="font-medium">{t.settings?.light || 'Light'}</span>
          </button>
          
          {/* Dark Button */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <Moon className="h-4 w-4" />
            <span className="font-medium">{t.settings?.dark || 'Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}