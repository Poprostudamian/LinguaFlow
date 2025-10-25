// src/pages/StudentSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StudentProfileSection } from '../components/settings/student/StudentProfileSection';
import { LearningGoalsSection } from '../components/settings/student/LearningGoalsSection';
import { StudentAboutSection } from '../components/settings/student/StudentAboutSection';
import { MyTutorsSection } from '../components/settings/student/MyTutorsSection';
import { StudentAccountSettingsSection } from '../components/settings/student/StudentAccountSettingsSection';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  learningGoals: string[];
  aboutMe: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: 'pl' | 'en';
  theme: 'light' | 'dark';
}

export function StudentSettingsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    learningGoals: [],
    aboutMe: '',
    emailNotifications: true,
    pushNotifications: true,
    language: 'pl',
    theme: 'light',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is okay
        throw settingsError;
      }

      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        avatarUrl: userData.avatar_url || '',
        learningGoals: userData.learning_goals || [],
        aboutMe: userData.about_me || '',
        emailNotifications: settingsData?.email_notifications ?? true,
        pushNotifications: settingsData?.push_notifications ?? true,
        language: settingsData?.language || 'pl',
        theme: settingsData?.theme || 'light',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);
      setSaveMessage('');

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          avatar_url: formData.avatarUrl,
          learning_goals: formData.learningGoals,
          about_me: formData.aboutMe,
        })
        .eq('id', session.user.id);

      if (userError) throw userError;

      // Update or insert user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          email_notifications: formData.emailNotifications,
          push_notifications: formData.pushNotifications,
          language: formData.language,
          theme: formData.theme,
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      setSaveMessage(t.studentSettings.changesSaved);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSaveMessage(t.studentSettings.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-600 dark:text-gray-400">{t.common.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.studentSettings.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile, learning goals, and account preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t.studentSettings.saving}</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{t.studentSettings.saveChanges}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage === t.studentSettings.changesSaved
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {/* 1. Profile Section */}
        <StudentProfileSection
          formData={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            avatarUrl: formData.avatarUrl,
          }}
          onChange={handleChange}
        />

        {/* 2. Learning Goals Section */}
        <LearningGoalsSection
          goals={formData.learningGoals}
          onChange={(goals) => handleChange('learningGoals', goals)}
        />

        {/* 3. About Section */}
        <StudentAboutSection
          aboutMe={formData.aboutMe}
          onChange={(value) => handleChange('aboutMe', value)}
        />

        {/* 4. My Tutors Section */}
        <MyTutorsSection />

        {/* 5. Account Settings Section */}
        <StudentAccountSettingsSection
          settings={{
            emailNotifications: formData.emailNotifications,
            pushNotifications: formData.pushNotifications,
            language: formData.language,
            theme: formData.theme,
          }}
          onChange={handleChange}
        />
      </div>

      {/* Bottom Save Button (for convenience on mobile) */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t.studentSettings.saving}</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{t.studentSettings.saveChanges}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}