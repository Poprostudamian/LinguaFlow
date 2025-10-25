// src/components/settings/student/StudentProfileSection.tsx
import React, { useState, useRef } from 'react';
import { Camera, User, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { supabase } from '../../../lib/supabase';

interface StudentProfileSectionProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  onChange: (field: string, value: string) => void;
}

export function StudentProfileSection({ formData, onChange }: StudentProfileSectionProps) {
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

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update form data
      onChange('avatarUrl', publicUrl);

      // Update user record in database
      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

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

      onChange('avatarUrl', '');

      await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', user.id);

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
            {t.studentSettings.profileSection.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.profileSection.description}
          </p>
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.studentSettings.profileSection.uploadAvatar}
        </label>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Camera className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : formData.avatarUrl ? t.studentSettings.profileSection.changeAvatar : t.studentSettings.profileSection.uploadAvatar}
            </button>
            {formData.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="ml-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {t.studentSettings.profileSection.removeAvatar}
              </button>
            )}
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.studentSettings.profileSection.firstName}
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.studentSettings.profileSection.lastName}
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.studentSettings.profileSection.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t.studentSettings.profileSection.emailReadonly}
          </p>
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.studentSettings.profileSection.phone}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder={t.studentSettings.profileSection.phonePlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}