// src/components/settings/student/StudentAccountSettingsSection.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, GraduationCap, Globe, Sun, Moon, Bell, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface StudentAccountSettingsSectionProps {
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: 'pl' | 'en';
    theme: 'light' | 'dark';
  };
  onChange: (field: string, value: any) => void;
}

export function StudentAccountSettingsSection({ settings, onChange }: StudentAccountSettingsSectionProps) {
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
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.studentSettings.accountSettingsSection.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.accountSettingsSection.description}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.studentSettings.accountSettingsSection.accountType}
          </label>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                {t.studentSettings.accountSettingsSection.studentAccount}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Globe className="inline h-4 w-4 mr-2" />
            {t.studentSettings.accountSettingsSection.language}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleLanguageChange('pl')}
              className={`p-3 border-2 rounded-lg transition-all ${
                settings.language === 'pl'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              <span className="text-2xl mb-1 block">🇵🇱</span>
              <span className="text-sm font-medium">{t.studentSettings.accountSettingsSection.polish}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`p-3 border-2 rounded-lg transition-all ${
                settings.language === 'en'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              <span className="text-2xl mb-1 block">🇬🇧</span>
              <span className="text-sm font-medium">{t.studentSettings.accountSettingsSection.english}</span>
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {isDark ? <Moon className="inline h-4 w-4 mr-2" /> : <Sun className="inline h-4 w-4 mr-2" />}
            {t.studentSettings.accountSettingsSection.theme}
          </label>
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
              isDark ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                isDark ? 'translate-x-11' : 'translate-x-1'
              }`}
            >
              {isDark ? (
                <Moon className="h-5 w-5 text-purple-600 m-1.5" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 m-1.5" />
              )}
            </span>
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isDark ? t.studentSettings.accountSettingsSection.darkMode : t.studentSettings.accountSettingsSection.lightMode}
          </p>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Bell className="inline h-4 w-4 mr-2" />
            {t.studentSettings.accountSettingsSection.notifications}
          </label>
          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t.studentSettings.accountSettingsSection.emailNotifications}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.studentSettings.accountSettingsSection.emailNotificationsDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
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
                  {t.studentSettings.accountSettingsSection.pushNotifications}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.studentSettings.accountSettingsSection.pushNotificationsDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('pushNotifications', !settings.pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
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

        {/* Timezone (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.studentSettings.accountSettingsSection.timezone}
          </label>
          <input
            type="text"
            value="Europe/Warsaw"
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-3">
            {t.studentSettings.accountSettingsSection.dangerZone}
          </label>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-300">
                  {t.studentSettings.accountSettingsSection.deleteAccount}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  {t.studentSettings.accountSettingsSection.deleteAccountDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.studentSettings.accountSettingsSection.deleteAccount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.studentSettings.accountSettingsSection.deleteAccount}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t.studentSettings.accountSettingsSection.deleteAccountConfirm}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {t.studentSettings.accountSettingsSection.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{t.studentSettings.accountSettingsSection.confirmDelete}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}