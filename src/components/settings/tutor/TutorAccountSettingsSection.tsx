// src/components/settings/tutor/TutorAccountSettingsSection.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, Briefcase, Globe, Sun, Moon, Bell, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface TutorAccountSettingsSectionProps {
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: 'pl' | 'en';
    theme: 'light' | 'dark';
  };
  onChange: (field: string, value: any) => void;
}

export function TutorAccountSettingsSection({ settings, onChange }: TutorAccountSettingsSectionProps) {
  const { t, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { session } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLanguageChange = (newLanguage: 'pl' | 'en') => {
    setLanguage(newLanguage);
    onChange('language', newLanguage);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    onChange('theme', isDark ? 'light' : 'dark');
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    try {
      setDeleting(true);

      // Delete user data (cascade will handle related records)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', session.user.id);

      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.tutorSettings?.accountSection?.title || 'Account & Platform Settings'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.accountSection?.description || 'Manage your account preferences and platform settings'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.tutorSettings?.accountSection?.accountType || 'Account Type'}
          </label>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                {t.tutorSettings?.accountSection?.tutorAccount || 'Tutor Account'}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {t.tutorSettings?.accountSection?.tutorAccountDescription || 'You can create lessons and manage students'}
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="h-4 w-4 inline mr-1" />
            {t.tutorSettings?.accountSection?.language || 'Language'}
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value as 'pl' | 'en')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.tutorSettings?.accountSection?.theme || 'Theme'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (isDark) toggleTheme();
                onChange('theme', 'light');
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                !isDark
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span className="font-medium">{t.tutorSettings?.accountSection?.light || 'Light'}</span>
            </button>

            <button
              onClick={() => {
                if (!isDark) toggleTheme();
                onChange('theme', 'dark');
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                isDark
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span className="font-medium">{t.tutorSettings?.accountSection?.dark || 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Bell className="h-4 w-4 inline mr-1" />
            {t.tutorSettings?.accountSection?.notifications || 'Notifications'}
          </label>
          
          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t.tutorSettings?.accountSection?.emailNotifications || 'Email Notifications'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.tutorSettings?.accountSection?.emailNotificationsDesc || 'Receive updates about lessons and student progress'}
                </p>
              </div>
              <button
                onClick={() => onChange('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications
                    ? 'bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t.tutorSettings?.accountSection?.pushNotifications || 'Push Notifications'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.tutorSettings?.accountSection?.pushNotificationsDesc || 'Get notified about new messages and meetings'}
                </p>
              </div>
              <button
                onClick={() => onChange('pushNotifications', !settings.pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications
                    ? 'bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-3">
            {t.tutorSettings?.accountSection?.dangerZone || 'Danger Zone'}
          </label>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                  {t.tutorSettings?.accountSection?.deleteAccount || 'Delete Account'}
                </h4>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t.tutorSettings?.accountSection?.deleteAccountDesc || 'Permanently delete your account and all data'}
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="ml-4 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.tutorSettings?.accountSection?.delete || 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.tutorSettings?.accountSection?.deleteAccountConfirm || 'Are you sure?'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t.tutorSettings?.accountSection?.deleteAccountWarning || 'This action cannot be undone. All your data, lessons, and student connections will be permanently deleted.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t.tutorSettings?.accountSection?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t.tutorSettings?.accountSection?.deleting || 'Deleting...'}
                  </>
                ) : (
                  t.tutorSettings?.accountSection?.deleteConfirm || 'Yes, delete my account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}