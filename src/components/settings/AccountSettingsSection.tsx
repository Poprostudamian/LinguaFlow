// src/components/settings/AccountSettingsSection.tsx
// Account & Platform Settings section

import React from 'react';
import { Settings, User, Globe, Moon, Sun, Mail, Bell, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AccountSettingsSectionProps {
  accountType: 'student' | 'tutor';
  emailNotifications: boolean;
  pushNotifications: boolean;
  onUpdateNotifications: (settings: { emailNotifications?: boolean; pushNotifications?: boolean }) => void;
  onDeleteAccount: () => void;
  translations: any;
}

export function AccountSettingsSection({
  accountType,
  emailNotifications,
  pushNotifications,
  onUpdateNotifications,
  onDeleteAccount,
  translations
}: AccountSettingsSectionProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.accountSettingsTitle || 'Account & Platform Settings'}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.accountType || 'Account Type'}
          </label>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 capitalize">
                {accountType === 'tutor' 
                  ? (translations.tutorAccount || 'Tutor Account')
                  : (translations.studentAccount || 'Student Account')
                }
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {accountType === 'tutor'
                  ? (translations.tutorAccountDescription || 'You can create lessons and manage students')
                  : (translations.studentAccountDescription || 'You can access lessons assigned by your tutors')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="h-4 w-4 inline mr-1" />
            {translations.language || 'Language'}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'pl')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {translations.theme || 'Theme'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span className="font-medium">{translations.light || 'Light'}</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span className="font-medium">{translations.dark || 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {translations.notifications || 'Notifications'}
          </label>
          <div className="space-y-3">
            {/* Email Notifications */}
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {translations.emailNotifications || 'Email Notifications'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.emailNotificationsDesc || 'Receive updates via email'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => onUpdateNotifications({ emailNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0"
              />
            </label>

            {/* Push Notifications */}
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {translations.pushNotifications || 'Push Notifications'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.pushNotificationsDesc || 'Receive push notifications in browser'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => onUpdateNotifications({ pushNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
            {translations.dangerZone || 'Danger Zone'}
          </h3>
          <button
            onClick={onDeleteAccount}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>{translations.deleteAccount || 'Delete Account'}</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {translations.deleteAccountWarning || 'This action cannot be undone. All your data will be permanently deleted.'}
          </p>
        </div>
      </div>
    </div>
  );
}