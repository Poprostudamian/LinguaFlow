// src/components/settings/tutor/TutorProfileSection.tsx
import React, { useState, useRef } from 'react';
import { Camera, User, Briefcase, GraduationCap, DollarSign } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { supabase } from '../../../lib/supabase';

interface TutorProfileSectionProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl: string;
    bio: string;
    teachingExperience: string;
    education: string;
    hourlyRate: string;
  };
  onChange: (field: string, value: string) => void;
}

export function TutorProfileSection({ formData, onChange }: TutorProfileSectionProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onChange('avatarUrl', publicUrl);
      setUploadError('');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      onChange('avatarUrl', '');
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.tutorSettings?.profileSection?.title || 'Professional Profile'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.profileSection?.description || 'Showcase your teaching expertise and experience'}
          </p>
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.tutorSettings?.profileSection?.profilePhoto || 'Profile Photo'}
        </label>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-900"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center ring-4 ring-purple-100 dark:ring-purple-900">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {uploading
                ? t.tutorSettings?.profileSection?.uploading || 'Uploading...'
                : t.tutorSettings?.profileSection?.uploadHint || 'JPG, PNG or WEBP (max 5MB)'}
            </p>
            {formData.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                {t.tutorSettings?.profileSection?.removePhoto || 'Remove photo'}
              </button>
            )}
            {uploadError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.tutorSettings?.profileSection?.firstName || 'First Name'}
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.tutorSettings?.profileSection?.lastName || 'Last Name'}
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Email (readonly) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.tutorSettings?.profileSection?.email || 'Email Address'}
        </label>
        <input
          type="email"
          value={formData.email}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t.tutorSettings?.profileSection?.emailReadonly || 'Email cannot be changed'}
        </p>
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.tutorSettings?.profileSection?.phone || 'Phone Number (Optional)'}
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+48 123 456 789"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Professional Bio */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <User className="h-4 w-4" />
          <span>{t.tutorSettings?.profileSection?.bio || 'Professional Bio'}</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder={t.tutorSettings?.profileSection?.bioPlaceholder || 'Tell students about your teaching philosophy and experience...'}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.bio.length}/500 {t.tutorSettings?.profileSection?.characters || 'characters'}
        </p>
      </div>

      {/* Teaching Experience */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Briefcase className="h-4 w-4" />
          <span>{t.tutorSettings?.profileSection?.teachingExperience || 'Teaching Experience'}</span>
        </label>
        <textarea
          value={formData.teachingExperience}
          onChange={(e) => onChange('teachingExperience', e.target.value)}
          placeholder={t.tutorSettings?.profileSection?.experiencePlaceholder || 'e.g., 5 years of teaching English to high school students...'}
          rows={3}
          maxLength={300}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.teachingExperience.length}/300 {t.tutorSettings?.profileSection?.characters || 'characters'}
        </p>
      </div>

      {/* Education */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <GraduationCap className="h-4 w-4" />
          <span>{t.tutorSettings?.profileSection?.education || 'Education'}</span>
        </label>
        <input
          type="text"
          value={formData.education}
          onChange={(e) => onChange('education', e.target.value)}
          placeholder={t.tutorSettings?.profileSection?.educationPlaceholder || 'e.g., M.A. in English Literature, University of Warsaw'}
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.education.length}/200 {t.tutorSettings?.profileSection?.characters || 'characters'}
        </p>
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <DollarSign className="h-4 w-4" />
          <span>{t.tutorSettings?.profileSection?.hourlyRate || 'Hourly Rate (PLN)'}</span>
        </label>
        <input
          type="number"
          value={formData.hourlyRate}
          onChange={(e) => onChange('hourlyRate', e.target.value)}
          placeholder="100"
          min="0"
          step="10"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t.tutorSettings?.profileSection?.rateHint || 'Your suggested hourly rate for lessons (optional)'}
        </p>
      </div>
    </div>
  );
}