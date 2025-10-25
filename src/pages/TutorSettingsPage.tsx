// src/pages/TutorSettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Save, 
  Bell, 
  Sun, 
  Moon, 
  Globe,
  Mail,
  Smartphone,
  AlertCircle,
  Check,
  Tag,
  FileText,
  Trash2
} from 'lucide-react';
import { ProfileSectionTutor } from '../components/settings/ProfileSection';
import { supabase } from '../lib/supabase';

// Import or create other sections (they can be similar to student version)
interface InterestsSectionProps {
  interests: string[];
  onUpdate: (interests: string[]) => void;
  translations: any;
}

function InterestsSection({ interests, onUpdate, translations }: InterestsSectionProps) {
  const [localInterests, setLocalInterests] = useState<string[]>(interests);
  const [newInterest, setNewInterest] = useState('');

  const predefinedInterests = [
    'Languages', 'Mathematics', 'Science', 'History', 'Literature',
    'Programming', 'Music', 'Art', 'Sports', 'Business'
  ];

  const addInterest = (interest: string) => {
    if (!localInterests.includes(interest) && localInterests.length < 10) {
      const updated = [...localInterests, interest];
      setLocalInterests(updated);
      onUpdate(updated);
    }
    setNewInterest('');
  };

  const removeInterest = (interest: string) => {
    const updated = localInterests.filter(i => i !== interest);
    setLocalInterests(updated);
    onUpdate(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Tag className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.interestsTitle || 'Teaching Interests & Expertise'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Current Interests */}
        {localInterests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {localInterests.map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center space-x-2"
              >
                <span>{interest}</span>
                <button
                  onClick={() => removeInterest(interest)}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Predefined Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.selectInterests || 'Select Your Expertise Areas'}
          </label>
          <div className="flex flex-wrap gap-2">
            {predefinedInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => addInterest(interest)}
                disabled={localInterests.includes(interest) || localInterests.length >= 10}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  localInterests.includes(interest)
                    ? 'bg-purple-600 text-white cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                } disabled:opacity-50`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Interest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.addCustom || 'Add Custom Interest'}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
              placeholder={translations.customInterestPlaceholder || 'E.g., Web Development'}
              maxLength={30}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => addInterest(newInterest)}
              disabled={!newInterest.trim() || localInterests.length >= 10}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {translations.add || 'Add'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {translations.interestsLimit || `Max 10 interests (${localInterests.length}/10)`}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AboutSectionProps {
  aboutMe: string;
  onUpdate: (about: string) => void;
  translations: any;
}

function AboutSection({ aboutMe, onUpdate, translations }: AboutSectionProps) {
  const [localAbout, setLocalAbout] = useState(aboutMe);
  const maxLength = 500;

  const handleSave = () => {
    onUpdate(localAbout);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.aboutTitle || 'About Me'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.aboutDescription || 'Tell your students about yourself'}
          </label>
          <textarea
            value={localAbout}
            onChange={(e) => setLocalAbout(e.target.value.slice(0, maxLength))}
            placeholder={translations.aboutPlaceholder || 'Share your teaching experience, qualifications, and approach...'}
            rows={6}
            maxLength={maxLength}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {translations.aboutHint || 'This will be visible to your students'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {localAbout.length}/{maxLength}
            </p>
          </div>
        </div>

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

interface AccountSettingsSectionProps {
  accountType: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  onUpdateNotifications: (updates: { emailNotifications?: boolean; pushNotifications?: boolean }) => void;
  onDeleteAccount: () => void;
  translations: any;
}

function AccountSettingsSection({
  accountType,
  emailNotifications,
  pushNotifications,
  onUpdateNotifications,
  onDeleteAccount,
  translations
}: AccountSettingsSectionProps) {
  const { theme, setTheme, language, setLanguage } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {translations.accountSettings || 'Account & Platform Settings'}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translations.accountType || 'Account Type'}
          </label>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {accountType === 'tutor' ? (translations.tutor || 'Tutor') : (translations.student || 'Student')}
            </p>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {translations.language || 'Language'}
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setLanguage('pl')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                language === 'pl'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">Polski</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">English</span>
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
                <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {translations.pushNotifications || 'Push Notifications'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.pushNotificationsDesc || 'Get notified on your device'}
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
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{translations.dangerZone || 'Danger Zone'}</span>
          </h3>
          <button
            onClick={onDeleteAccount}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="font-medium">{translations.deleteAccount || 'Delete Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main TutorSettingsPage Component
export function TutorSettingsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [settings, setSettings] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: '',
    interests: [] as string[],
    about_me: '',
    email_notifications: true,
    push_notifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const settingsT = t.settings || {};

  // Load user settings
  useEffect(() => {
    loadSettings();
  }, [session.user?.id]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Get user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.warn('Settings not found, using defaults');
      }

      setSettings({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        avatar_url: userData.avatar_url || '',
        interests: userData.interests || [],
        about_me: userData.about_me || '',
        email_notifications: settingsData?.email_notifications ?? true,
        push_notifications: settingsData?.push_notifications ?? true
      });

    } catch (error) {
      console.error('Error loading settings:', error);
      showSaveMessage('error', settingsT.loadError || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      showSaveMessage('success', settingsT.changesSaved || 'Profile updated successfully');

    } catch (error) {
      console.error('Error updating profile:', error);
      showSaveMessage('error', settingsT.saveError || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const updateInterests = async (interests: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ interests })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, interests }));
      showSaveMessage('success', settingsT.changesSaved || 'Interests updated successfully');

    } catch (error) {
      console.error('Error updating interests:', error);
      showSaveMessage('error', settingsT.saveError || 'Failed to save interests');
    }
  };

  const updateAbout = async (about_me: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ about_me })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, about_me }));
      showSaveMessage('success', settingsT.changesSaved || 'About section updated successfully');

    } catch (error) {
      console.error('Error updating about:', error);
      showSaveMessage('error', settingsT.saveError || 'Failed to save about section');
    }
  };

  const updateNotifications = async (updates: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: updates.emailNotifications ?? settings.email_notifications,
          push_notifications: updates.pushNotifications ?? settings.push_notifications
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        email_notifications: updates.emailNotifications ?? prev.email_notifications,
        push_notifications: updates.pushNotifications ?? prev.push_notifications
      }));
      showSaveMessage('success', settingsT.changesSaved || 'Notifications updated successfully');

    } catch (error) {
      console.error('Error updating notifications:', error);
      showSaveMessage('error', settingsT.saveError || 'Failed to save notification settings');
    }
  };

  const showSaveMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{settingsT.loading || 'Loading settings...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{settingsT.title || 'Settings'}</h1>
          <p className="text-purple-100">{settingsT.description || 'Manage your account and preferences'}</p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {saveMessage.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="font-medium">{saveMessage.text}</p>
          </div>
        )}
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Section */}
        <ProfileSectionTutor
          firstName={settings.first_name}
          lastName={settings.last_name}
          email={settings.email}
          avatarUrl={settings.avatar_url}
          onUpdate={updateProfile}
          translations={settingsT}
        />

        {/* Interests Section */}
        <InterestsSection
          interests={settings.interests}
          onUpdate={updateInterests}
          translations={settingsT}
        />

        {/* About Section */}
        <AboutSection
          aboutMe={settings.about_me}
          onUpdate={updateAbout}
          translations={settingsT}
        />

        {/* Account Settings Section */}
        <AccountSettingsSection
          accountType={session?.user?.role || 'tutor'}
          emailNotifications={settings.email_notifications}
          pushNotifications={settings.push_notifications}
          onUpdateNotifications={updateNotifications}
          onDeleteAccount={() => setShowDeleteModal(true)}
          translations={settingsT}
        />
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {settingsT.deleteAccount || 'Delete Account'}
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {settingsT.deleteAccountConfirm || 'Are you sure you want to delete your account? This action cannot be undone.'}
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                {settingsT.cancel || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  // Implement delete account logic here
                  console.log('Delete account');
                  setShowDeleteModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                {settingsT.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}