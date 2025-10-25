// src/pages/TutorSettingsPage.tsx
// Main settings page for Tutor with all sections

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { ProfileSection } from '../components/settings/ProfileSection';
import { InterestsSection } from '../components/settings/InterestsSection';
import { AboutSection } from '../components/settings/AboutSection';
import { AccountSettingsSection } from '../components/settings/AccountSettingsSection';

interface UserSettings {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  interests: string[];
  about_me: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export function TutorSettingsPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState<UserSettings>({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: null,
    interests: [],
    about_me: '',
    email_notifications: true,
    push_notifications: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Translations object for Settings page
  const settingsT = {
    // Page
    title: t.language === 'pl' ? 'Ustawienia' : 'Settings',
    subtitle: t.language === 'pl' ? 'Zarządzaj swoim profilem i preferencjami' : 'Manage your profile and preferences',
    saveChanges: t.language === 'pl' ? 'Zapisz zmiany' : 'Save Changes',
    saving: t.language === 'pl' ? 'Zapisywanie...' : 'Saving...',
    refresh: t.language === 'pl' ? 'Odśwież' : 'Refresh',
    loading: t.language === 'pl' ? 'Ładowanie ustawień...' : 'Loading settings...',
    
    // Success/Error
    saveSuccess: t.language === 'pl' ? 'Zmiany zostały zapisane pomyślnie!' : 'Changes saved successfully!',
    saveError: t.language === 'pl' ? 'Błąd podczas zapisywania zmian' : 'Error saving changes',
    loadError: t.language === 'pl' ? 'Błąd podczas ładowania ustawień' : 'Error loading settings',
    
    // Profile Section
    profileInfo: t.language === 'pl' ? 'Informacje profilowe' : 'Profile Information',
    profilePhoto: t.language === 'pl' ? 'Zdjęcie profilowe' : 'Profile Photo',
    photoDescription: t.language === 'pl' ? 'JPG lub PNG. Maksymalny rozmiar 10MB.' : 'JPG or PNG. Max size 10MB.',
    firstName: t.language === 'pl' ? 'Imię' : 'First Name',
    lastName: t.language === 'pl' ? 'Nazwisko' : 'Last Name',
    email: t.language === 'pl' ? 'Adres email' : 'Email Address',
    readonly: t.language === 'pl' ? 'Tylko do odczytu' : 'Read-only',
    emailNote: t.language === 'pl' ? 'Email nie może być zmieniony. Skontaktuj się z supportem jeśli potrzebne.' : 'Email cannot be changed. Contact support if needed.',
    firstNamePlaceholder: t.language === 'pl' ? 'Wpisz swoje imię' : 'Enter your first name',
    lastNamePlaceholder: t.language === 'pl' ? 'Wpisz swoje nazwisko' : 'Enter your last name',
    invalidFileType: t.language === 'pl' ? 'Nieprawidłowy typ pliku. Dozwolone tylko JPG i PNG.' : 'Invalid file type. Only JPG and PNG are allowed.',
    fileTooLarge: t.language === 'pl' ? 'Plik jest za duży. Maksymalny rozmiar to 10MB.' : 'File is too large. Maximum size is 10MB.',
    uploadFailed: t.language === 'pl' ? 'Nie udało się przesłać zdjęcia.' : 'Failed to upload image.',
    
    // Interests Section
    interestsTitle: t.language === 'pl' ? 'Zainteresowania i Specjalizacje' : 'Interests & Specializations',
    interestsDescription: t.language === 'pl' ? 'Dodaj maksymalnie 3 przedmioty lub umiejętności w których się specjalizujesz.' : 'Add up to 3 subjects or skills you specialize in.',
    noInterestsYet: t.language === 'pl' ? 'Nie dodano jeszcze żadnych zainteresowań' : 'No interests added yet',
    addInterest: t.language === 'pl' ? 'Dodaj zainteresowanie' : 'Add Interest',
    maxInterestsReached: t.language === 'pl' ? 'Maksymalnie 3 zainteresowania. Usuń jedno aby dodać kolejne.' : 'Maximum 3 interests reached. Remove one to add another.',
    addInterestTitle: t.language === 'pl' ? 'Dodaj zainteresowanie lub specjalizację' : 'Add Interest or Specialization',
    customInterest: t.language === 'pl' ? 'Własne zainteresowanie' : 'Custom Interest',
    customInterestPlaceholder: t.language === 'pl' ? 'Wpisz własne zainteresowanie...' : 'Enter custom interest...',
    add: t.language === 'pl' ? 'Dodaj' : 'Add',
    popularInterests: t.language === 'pl' ? 'Popularne zainteresowania' : 'Popular Interests',
    
    // About Section
    aboutTitle: t.language === 'pl' ? 'O mnie' : 'About Me',
    optional: t.language === 'pl' ? 'Opcjonalne' : 'Optional',
    aboutDescription: t.language === 'pl' ? 'Napisz krótki opis o sobie, swoim doświadczeniu nauczania lub podejściu do korepetycji.' : 'Write a brief description about yourself, your teaching experience, or your approach to tutoring.',
    aboutPlaceholder: t.language === 'pl' ? 'Opowiedz uczniom trochę o sobie...' : 'Tell students a bit about yourself...',
    charactersUsed: t.language === 'pl' ? 'Użyte znaki' : 'Characters used',
    remaining: t.language === 'pl' ? 'pozostało' : 'remaining',
    preview: t.language === 'pl' ? 'Podgląd' : 'Preview',
    
    // Account Settings Section
    accountSettingsTitle: t.language === 'pl' ? 'Ustawienia konta i platformy' : 'Account & Platform Settings',
    accountType: t.language === 'pl' ? 'Typ konta' : 'Account Type',
    tutorAccount: t.language === 'pl' ? 'Konto korepetytora' : 'Tutor Account',
    studentAccount: t.language === 'pl' ? 'Konto ucznia' : 'Student Account',
    tutorAccountDescription: t.language === 'pl' ? 'Możesz tworzyć lekcje i zarządzać uczniami' : 'You can create lessons and manage students',
    studentAccountDescription: t.language === 'pl' ? 'Możesz uzyskać dostęp do lekcji przypisanych przez korepetytorów' : 'You can access lessons assigned by your tutors',
    language: t.language === 'pl' ? 'Język' : 'Language',
    theme: t.language === 'pl' ? 'Motyw' : 'Theme',
    light: t.language === 'pl' ? 'Jasny' : 'Light',
    dark: t.language === 'pl' ? 'Ciemny' : 'Dark',
    notifications: t.language === 'pl' ? 'Powiadomienia' : 'Notifications',
    emailNotifications: t.language === 'pl' ? 'Powiadomienia Email' : 'Email Notifications',
    emailNotificationsDesc: t.language === 'pl' ? 'Otrzymuj aktualizacje przez email' : 'Receive updates via email',
    pushNotifications: t.language === 'pl' ? 'Powiadomienia Push' : 'Push Notifications',
    pushNotificationsDesc: t.language === 'pl' ? 'Otrzymuj powiadomienia push w przeglądarce' : 'Receive push notifications in browser',
    dangerZone: t.language === 'pl' ? 'Strefa niebezpieczna' : 'Danger Zone',
    deleteAccount: t.language === 'pl' ? 'Usuń konto' : 'Delete Account',
    deleteAccountWarning: t.language === 'pl' ? 'Ta akcja nie może być cofnięta. Wszystkie Twoje dane zostaną trwale usunięte.' : 'This action cannot be undone. All your data will be permanently deleted.',
    deleteAccountConfirm: t.language === 'pl' ? 'Czy na pewno chcesz usunąć swoje konto?' : 'Are you sure you want to delete your account?',
    cancel: t.language === 'pl' ? 'Anuluj' : 'Cancel',
    confirmDelete: t.language === 'pl' ? 'Tak, usuń konto' : 'Yes, Delete Account',
  };

  // Load user settings
  useEffect(() => {
    loadSettings();
  }, [session]);

  const loadSettings = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      // Get user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // If no settings exist, create default ones
      if (settingsError && settingsError.code === 'PGRST116') {
        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            email_notifications: true,
            push_notifications: true,
            theme: 'light',
            language: 'pl'
          })
          .select()
          .single();

        settingsData = newSettings;
      }

      setSettings({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        avatar_url: userData.avatar_url || null,
        interests: userData.interests || [],
        about_me: userData.about_me || '',
        email_notifications: settingsData?.email_notifications ?? true,
        push_notifications: settingsData?.push_notifications ?? true
      });

    } catch (error: any) {
      console.error('Error loading settings:', error);
      setToast({ type: 'error', message: settingsT.loadError });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: settings.first_name,
          last_name: settings.last_name,
          avatar_url: settings.avatar_url,
          interests: settings.interests,
          about_me: settings.about_me
        })
        .eq('id', session.user.id);

      if (userError) throw userError;

      // Update user_settings table
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications
        })
        .eq('user_id', session.user.id);

      if (settingsError) throw settingsError;

      setToast({ type: 'success', message: settingsT.saveSuccess });
      setHasChanges(false);

    } catch (error: any) {
      console.error('Error saving settings:', error);
      setToast({ type: 'error', message: `${settingsT.saveError}: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // In production, this should be handled by a secure backend endpoint
    console.warn('Delete account requested');
    setShowDeleteModal(false);
    // TODO: Implement secure account deletion
  };

  // Update handlers
  const updateProfile = (data: any) => {
    setSettings(prev => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const updateInterests = (interests: string[]) => {
    setSettings(prev => ({ ...prev, interests }));
    setHasChanges(true);
  };

  const updateAbout = (about_me: string) => {
    setSettings(prev => ({ ...prev, about_me }));
    setHasChanges(true);
  };

  const updateNotifications = (notifSettings: any) => {
    setSettings(prev => ({ ...prev, ...notifSettings }));
    setHasChanges(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{settingsT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {settingsT.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {settingsT.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{settingsT.refresh}</span>
          </button>

          <button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? settingsT.saving : settingsT.saveChanges}</span>
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Section */}
        <ProfileSection
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {settingsT.deleteAccount}
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {settingsT.deleteAccountConfirm}
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {settingsT.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {settingsT.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}