// src/components/settings/ProfileSectionTutor.tsx

import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  onUpdate: (updates: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }) => void;
  translations: any;
}

export function ProfileSectionTutor({
  firstName,
  lastName,
  email,
  avatarUrl,
  onUpdate,
  translations
}: ProfileSectionProps) {
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when avatarUrl changes
  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  // Update local state when props change
  useEffect(() => {
    setLocalFirstName(firstName);
    setLocalLastName(lastName);
  }, [firstName, lastName]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setUploadError(null);

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setUploadError(translations.invalidFileType || 'Invalid file type. Only JPG, PNG, and WEBP are allowed.');
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename
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

      // Update preview immediately
      setPreviewUrl(publicUrl);

      // Update database through parent component
      onUpdate({ avatar_url: publicUrl });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || translations.uploadFailed || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setPreviewUrl(null);
      onUpdate({ avatar_url: '' });
    } catch (error) {
      console.error('Error removing avatar:', error);
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
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 dark:border-purple-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                {localFirstName?.[0]}{localLastName?.[0]}
              </div>
            )}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-700 rounded-full border-2 border-purple-600 dark:border-purple-400 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 shadow-lg"
              title={translations.uploadAvatar || 'Upload Avatar'}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
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
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {translations.profilePicture || 'Profile Picture'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {translations.profilePictureDesc || 'JPG, PNG or WEBP. Max 10MB.'}
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? (translations.uploading || 'Uploading...') : (previewUrl ? (translations.changePhoto || 'Change Photo') : (translations.uploadPhoto || 'Upload Photo'))}</span>
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {translations.removePhoto || 'Remove'}
                </button>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {uploadError}
              </p>
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={translations.lastNamePlaceholder || 'Enter your last name'}
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.email || 'Email'}
          </label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {translations.emailReadOnly || 'Email cannot be changed'}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {translations.saveChanges || 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 