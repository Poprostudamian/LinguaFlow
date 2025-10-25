// src/pages/TutorSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TutorProfileSection } from '../components/settings/tutor/TutorProfileSection';
import { TeachingLanguagesSection } from '../components/settings/tutor/TeachingLanguagesSection';
import { TeachingExpertiseSection } from '../components/settings/tutor/TeachingExpertiseSection';
import { MyStudentsSection } from '../components/settings/tutor/MyStudentsSection';
import { TutorAccountSettingsSection } from '../components/settings/tutor/TutorAccountSettingsSection';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  teachingExperience: string;
  education: string;
  hourlyRate: string;
  teachingLanguages: string[];
  expertise: string[];
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: 'pl' | 'en';
  theme: 'light' | 'dark';
}

export function TutorSettingsPage() {
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
    bio: '',
    teachingExperience: '',
    education: '',
    hourlyRate: '',
    teachingLanguages: [],
    expertise: [],
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
        throw settingsError;
      }

      // Parse interests and learning_goals as teaching data
      const teachingLanguages = Array.isArray(userData.interests) 
        ? userData.interests.filter((item: string) => item && typeof item === 'string')
        : [];
      
      const expertise = Array.isArray(userData.learning_goals) 
        ? userData.learning_goals.filter((item: string) => item && typeof item === 'string')
        : [];

      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        avatarUrl: userData.avatar_url || '',
        bio: userData.about_me || '',
        teachingExperience: '', // You can add this field to users table if needed
        education: '', // You can add this field to users table if needed
        hourlyRate: '', // You can add this field to users table if needed
        teachingLanguages: teachingLanguages,
        expertise: expertise,
        emailNotifications: settingsData?.email_notifications ?? true,
        pushNotifications: settingsData?.push_notifications ?? true,
        language: settingsData?.language || 'pl',
        theme: settingsData?.theme || 'light',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSaveMessage(t.tutorSettings?.errorLoading || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          about_me: formData.bio,
          interests: formData.teachingLanguages, // Store teaching languages in interests
          learning_goals: formData.expertise, // Store expertise in learning_goals
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

      setSaveMessage(t.tutorSettings?.changesSaved || 'Settings saved successfully!');
      
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage(t.tutorSettings?.errorSaving || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.tutorSettings?.title || 'Tutor Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.tutorSettings?.subtitle || 'Manage your professional profile and teaching preferences'}
        </p>
      </div>

      {/* Save Button (Top) */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t.tutorSettings?.saving || 'Saving...'}</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{t.tutorSettings?.saveChanges || 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Success/Error Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('success') || saveMessage.includes('saved')
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {/* 1. Profile Section */}
        <TutorProfileSection
          formData={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            avatarUrl: formData.avatarUrl,
            bio: formData.bio,
            teachingExperience: formData.teachingExperience,
            education: formData.education,
            hourlyRate: formData.hourlyRate,
          }}
          onChange={handleChange}
        />

        {/* 2. Teaching Languages Section */}
        <TeachingLanguagesSection
          languages={formData.teachingLanguages}
          onChange={(languages) => handleChange('teachingLanguages', languages)}
        />

        {/* 3. Teaching Expertise Section */}
        <TeachingExpertiseSection
          expertise={formData.expertise}
          onChange={(expertise) => handleChange('expertise', expertise)}
        />

        {/* 4. My Students Section */}
        <MyStudentsSection />

        {/* 5. Account Settings Section */}
        <TutorAccountSettingsSection
          settings={{
            emailNotifications: formData.emailNotifications,
            pushNotifications: formData.pushNotifications,
            language: formData.language,
            theme: formData.theme,
          }}
          onChange={handleChange}
        />
      </div>

      {/* Bottom Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t.tutorSettings?.saving || 'Saving...'}</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{t.tutorSettings?.saveChanges || 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}