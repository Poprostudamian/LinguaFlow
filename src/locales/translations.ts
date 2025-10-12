// src/locales/translations.ts
export const translations = {
  en: {
    // Common
    common: {
      welcome: 'Welcome',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      error: 'Error',
    },
    
    // Header
    header: {
      appName: 'LinguaFlow',
      welcomeBack: 'Welcome back',
      toggleTheme: 'Toggle theme',
      toggleLanguage: 'Toggle language',
    },
    
    // Login Page
    login: {
      title: 'Sign in to LinguaFlow',
      email: 'Email address',
      password: 'Password',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      invalidCredentials: 'Invalid email or password',
    },
    
    // Sign Up Page
    signup: {
      title: 'Create your account',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password',
      role: 'I am a',
      student: 'Student',
      tutor: 'Tutor',
      createAccount: 'Create Account',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      passwordMismatch: 'Passwords do not match',
    },
    
    // Student Dashboard
    studentDashboard: {
      title: 'Student Dashboard',
      upcomingLessons: 'Upcoming Lessons',
      recentActivity: 'Recent Activity',
      progress: 'Progress',
      viewAll: 'View All',
      noLessons: 'No lessons assigned yet',
    },
    
    // Tutor Dashboard
    tutorDashboard: {
      title: 'Tutor Dashboard',
      myStudents: 'My Students',
      lessonsManagement: 'Lessons Management',
      recentActivity: 'Recent Activity',
      stats: 'Statistics',
    },
    
    // Lessons
    lessons: {
      title: 'Lessons',
      myLessons: 'My Lessons',
      createLesson: 'Create Lesson',
      editLesson: 'Edit Lesson',
      deleteLesson: 'Delete Lesson',
      assignLesson: 'Assign Lesson',
      status: 'Status',
      published: 'Published',
      draft: 'Draft',
      assigned: 'Assigned',
      inProgress: 'In Progress',
      completed: 'Completed',
    },
    
    // Messages
    messages: {
      title: 'Messages',
      newMessage: 'New Message',
      typeMessage: 'Type your message...',
      send: 'Send',
      noMessages: 'No messages yet',
    },
    
    // Schedule
    schedule: {
      title: 'Schedule',
      upcomingMeetings: 'Upcoming Meetings',
      scheduleMeeting: 'Schedule Meeting',
      noMeetings: 'No scheduled meetings',
    },
  },
  
  pl: {
    // Common
    common: {
      welcome: 'Witaj',
      logout: 'Wyloguj',
      save: 'Zapisz',
      cancel: 'Anuluj',
      edit: 'Edytuj',
      delete: 'Usuń',
      search: 'Szukaj',
      filter: 'Filtruj',
      loading: 'Ładowanie...',
      error: 'Błąd',
    },
    
    // Header
    header: {
      appName: 'LinguaFlow',
      welcomeBack: 'Witaj ponownie',
      toggleTheme: 'Przełącz motyw',
      toggleLanguage: 'Zmień język',
    },
    
    // Login Page
    login: {
      title: 'Zaloguj się do LinguaFlow',
      email: 'Adres email',
      password: 'Hasło',
      signIn: 'Zaloguj się',
      noAccount: 'Nie masz konta?',
      signUp: 'Zarejestruj się',
      invalidCredentials: 'Nieprawidłowy email lub hasło',
    },
    
    // Sign Up Page
    signup: {
      title: 'Stwórz swoje konto',
      firstName: 'Imię',
      lastName: 'Nazwisko',
      email: 'Adres email',
      password: 'Hasło',
      confirmPassword: 'Potwierdź hasło',
      role: 'Jestem',
      student: 'Uczniem',
      tutor: 'Nauczycielem',
      createAccount: 'Utwórz konto',
      haveAccount: 'Masz już konto?',
      signIn: 'Zaloguj się',
      passwordMismatch: 'Hasła nie są zgodne',
    },
    
    // Student Dashboard
    studentDashboard: {
      title: 'Panel Ucznia',
      upcomingLessons: 'Nadchodzące Lekcje',
      recentActivity: 'Ostatnia Aktywność',
      progress: 'Postęp',
      viewAll: 'Zobacz Wszystkie',
      noLessons: 'Nie przypisano jeszcze żadnych lekcji',
    },
    
    // Tutor Dashboard
    tutorDashboard: {
      title: 'Panel Nauczyciela',
      myStudents: 'Moi Uczniowie',
      lessonsManagement: 'Zarządzanie Lekcjami',
      recentActivity: 'Ostatnia Aktywność',
      stats: 'Statystyki',
    },
    
    // Lessons
    lessons: {
      title: 'Lekcje',
      myLessons: 'Moje Lekcje',
      createLesson: 'Utwórz Lekcję',
      editLesson: 'Edytuj Lekcję',
      deleteLesson: 'Usuń Lekcję',
      assignLesson: 'Przypisz Lekcję',
      status: 'Status',
      published: 'Opublikowana',
      draft: 'Szkic',
      assigned: 'Przypisana',
      inProgress: 'W Trakcie',
      completed: 'Ukończona',
    },
    
    // Messages
    messages: {
      title: 'Wiadomości',
      newMessage: 'Nowa Wiadomość',
      typeMessage: 'Wpisz wiadomość...',
      send: 'Wyślij',
      noMessages: 'Brak wiadomości',
    },
    
    // Schedule
    schedule: {
      title: 'Terminarz',
      upcomingMeetings: 'Nadchodzące Spotkania',
      scheduleMeeting: 'Zaplanuj Spotkanie',
      noMeetings: 'Brak zaplanowanych spotkań',
    },
  },
} as const;

export type Language = 'en' | 'pl';
export type TranslationKeys = typeof translations.en;