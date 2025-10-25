// src/pages/TutorSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ProfileSectionTutor } from '../settings/ProfileSection';

interface TutorProfile {
  bio?: string;
  expertise?: string[];
  teachingExperience?: string;
  specializations?: string[];
  education?: string;
  languages?: string[];
  hourlyRate?: number;
}

interface UserSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'pl';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export function TutorSettingsPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ FIXED: Inicjalizacja z domyślnymi wartościami
  const [tutorProfile, setTutorProfile] = useState<TutorProfile>({
    bio: '',
    expertise: [],
    teachingExperience: '',
    specializations: [],
    education: '',
    languages: [],
    hourlyRate: 0
  });

  const [settings, setSettings] = useState<UserSettings>({
    theme: isDark ? 'dark' : 'light',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true
  });

  // ============================================================================
  // LOAD DATA
  // ============================================================================
  
  useEffect(() => {
    if (session?.user?.id) {
      loadSettings();
    }
  }, [session?.user?.id]);

  const loadSettings = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);

      // Load user settings from database
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (settingsError) {
        console.error('Error loading settings:', settingsError);
      } else if (userSettings) {
        setSettings({
          theme: userSettings.theme || 'light',
          language: userSettings.language || 'en',
          emailNotifications: userSettings.email_notifications ?? true,
          pushNotifications: userSettings.push_notifications ?? true
        });
      }

      // ✅ Load tutor profile (może być w users lub osobnej tabeli)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('Error loading user data:', userError);
      } else if (userData) {
        // ✅ Jeśli masz dodatkowe pola w tabeli users lub osobnej tabeli tutor_profiles
        setTutorProfile({
          bio: userData.bio || '',
          expertise: userData.expertise || [],
          teachingExperience: userData.teaching_experience || '',
          specializations: userData.specializations || [],
          education: userData.education || '',
          languages: userData.languages || [],
          hourlyRate: userData.hourly_rate || 0
        });
      }

    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleUpdateProfile = async (updates: Partial<TutorProfile>) => {
    if (!session?.user?.id) return;

    try {
      setTutorProfile(prev => ({ ...prev, ...updates }));

      // ✅ Save to database
      const { error } = await supabase
        .from('users')
        .update({
          bio: updates.bio,
          expertise: updates.expertise,
          teaching_experience: updates.teachingExperience,
          specializations: updates.specializations,
          education: updates.education,
          languages: updates.languages,
          hourly_rate: updates.hourlyRate
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating profile:', error);
      } else {
        showSuccess('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error in handleUpdateProfile:', error);
    }
  };

  const handleUpdateTheme = async (newTheme: 'light' | 'dark') => {
    if (!session?.user?.id) return;

    try {
      setSettings(prev => ({ ...prev, theme: newTheme }));

      // Toggle global theme
      if ((newTheme === 'dark' && !isDark) || (newTheme === 'light' && isDark)) {
        toggleTheme();
      }

      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .update({ theme: newTheme })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating theme:', error);
      }
    } catch (error) {
      console.error('Error in handleUpdateTheme:', error);
    }
  };

  const handleUpdateNotifications = async (updates: Partial<Pick<UserSettings, 'emailNotifications' | 'pushNotifications'>>) => {
    if (!session?.user?.id) return;

    try {
      setSettings(prev => ({ ...prev, ...updates }));

      const { error } = await supabase
        .from('user_settings')
        .update({
          email_notifications: updates.emailNotifications ?? settings.emailNotifications,
          push_notifications: updates.pushNotifications ?? settings.pushNotifications
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating notifications:', error);
      } else {
        showSuccess('Notification settings updated!');
      }
    } catch (error) {
      console.error('Error in handleUpdateNotifications:', error);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.settings?.title || 'Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and preferences
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{t.settings?.profile || 'Profile'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'account'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>{t.settings?.account || 'Account'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notifications'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>{t.settings?.notifications || 'Notifications'}</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'profile' && (
          <ProfileSectionTutor
            profile={tutorProfile}
            onUpdateProfile={handleUpdateProfile}
            theme={settings.theme}
            onUpdateTheme={handleUpdateTheme}
          />
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {/* Email Notifications */}
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Email Notifications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleUpdateNotifications({ emailNotifications: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0"
                  />
                </label>

                {/* Push Notifications */}
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Push Notifications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive push notifications
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleUpdateNotifications({ pushNotifications: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}