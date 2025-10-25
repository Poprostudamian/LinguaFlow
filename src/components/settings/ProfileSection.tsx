// src/components/settings/ProfileSection.tsx
// Profile section component for TutorSettingsPage

import React, { useState } from 'react';
import { User, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  onUpdate: (data: { first_name?: string; last_name?: string; avatar_url?: string }) => void;
  translations: any;
}

export function ProfileSection({
  firstName,
  lastName,
  email,
  avatarUrl,
  onUpdate,
  translations
}: ProfileSectionProps) {
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError(translations.invalidFileType || 'Invalid file type. Only JPG and PNG are allowed.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError(translations.fileTooLarge || 'File is too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setPreviewUrl(data.publicUrl);
      onUpdate({ avatar_url: data.publicUrl });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || translations.uploadFailed || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onUpdate({
      first_name: localFirstName,
      last_name: localLastName
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.profileInfo || 'Profile Information'}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
            )}
            
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg"
            >
              <Camera className="h-4 w-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {translations.profilePhoto || 'Profile Photo'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {translations.photoDescription || 'JPG or PNG. Max size 10MB.'}
            </p>
            {uploadError && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.firstName || 'First Name'}
          </label>
          <input
            type="text"
            value={localFirstName}
            onChange={(e) => setLocalFirstName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder={translations.firstNamePlaceholder || 'Enter your first name'}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.lastName || 'Last Name'}
          </label>
          <input
            type="text"
            value={localLastName}
            onChange={(e) => setLocalLastName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder={translations.lastNamePlaceholder || 'Enter your last name'}
          />
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.email || 'Email Address'}
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {translations.readonly || 'Read-only'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {translations.emailNote || 'Email cannot be changed. Contact support if needed.'}
          </p>
        </div>
      </div>
    </div>
  );
}