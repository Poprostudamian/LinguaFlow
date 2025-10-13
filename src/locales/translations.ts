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
      success: 'Success',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      confirm: 'Confirm',
      remove: 'Remove',
      add: 'Add',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      yes: 'Yes',
      no: 'No',
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
      subtitle: 'Sign in to continue learning',
      email: 'Email Address',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      noAccount: "Don't have an account?",
      signUp: 'Sign up here',
      invalidCredentials: 'Invalid email or password. Please check your credentials and try again.',
      emailNotConfirmed: 'Please check your email and click the confirmation link before signing in.',
      tooManyRequests: 'Too many login attempts. Please wait a moment before trying again.',
      needHelp: 'Need help getting started?',
      helpText: 'Create a new account or contact support if you need assistance.',
    },
    
    // Sign Up Page
    signup: {
      title: 'Create your account to start learning',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      role: 'I am a',
      student: 'Student',
      tutor: 'Tutor',
      createAccount: 'Create Account',
      creatingAccount: 'Creating Account...',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in here',
      passwordMismatch: 'Passwords do not match',
      accountCreated: 'Account created successfully! Redirecting to login...',
      // Validation errors
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 6 characters long',
      confirmPasswordRequired: 'Please confirm your password',
      firstNameRequired: 'First name is required',
      firstNameTooShort: 'First name must be at least 2 characters long',
      lastNameRequired: 'Last name is required',
      lastNameTooShort: 'Last name must be at least 2 characters long',
      roleRequired: 'Please select a valid role',
      userExists: 'An account with this email already exists',
    },
    
    // Student Dashboard
    studentDashboard: {
      title: 'Student Dashboard',
      welcome: 'Welcome back',
      upcomingLessons: 'Upcoming Lessons',
      recentActivity: 'Recent Activity',
      progress: 'Progress',
      viewAll: 'View All',
      noLessons: 'No lessons assigned yet',
      completedLessons: 'Completed Lessons',
      hoursLearned: 'Hours Learned',
      averageScore: 'Average Score',
      currentStreak: 'Current Streak',
      days: 'days',
    },
    
    // Tutor Dashboard
    tutorDashboard: {
      title: 'Tutor Dashboard',
      welcome: 'Welcome back',
      myStudents: 'My Students',
      activeStudents: 'Active Students',
      totalLessons: 'Total Lessons',
      lessonsThisWeek: 'Lessons This Week',
      upcomingMeetings: 'Upcoming Meetings',
      recentActivity: 'Recent Activity',
      stats: 'Statistics',
      noStudents: 'No students yet',
      noMeetings: 'No upcoming meetings',
    },
    
    // Lessons
    lessons: {
      title: 'Lessons',
      myLessons: 'My Lessons',
      assignedLessons: 'Assigned Lessons',
      availableLessons: 'Available Lessons',
      createLesson: 'Create Lesson',
      editLesson: 'Edit Lesson',
      deleteLesson: 'Delete Lesson',
      assignLesson: 'Assign Lesson',
      unassignLesson: 'Unassign Lesson',
      viewLesson: 'View Lesson',
      startLesson: 'Start Lesson',
      continueLesson: 'Continue Lesson',
      reviewLesson: 'Review Lesson',
      lessonDetails: 'Lesson Details',
      lessonContent: 'Lesson Content',
      exercises: 'Exercises',
      duration: 'Duration',
      difficulty: 'Difficulty',
      status: 'Status',
      published: 'Published',
      draft: 'Draft',
      assigned: 'Assigned',
      inProgress: 'In Progress',
      completed: 'Completed',
      notStarted: 'Not Started',
      lessonHistory: 'Lesson History',
      completedOn: 'Completed on',
      score: 'Score',
      timeSpent: 'Time Spent',
      minutes: 'minutes',
      noLessons: 'No lessons available',
      confirmDelete: 'Are you sure you want to delete this lesson?',
    },
    
    // Lesson Viewer
    lessonViewer: {
      backToLessons: 'Back to Lessons',
      lessonOverview: 'Lesson Overview',
      exercises: 'Exercises',
      progress: 'Progress',
      complete: 'Complete',
      checkAnswer: 'Check Answer',
      nextExercise: 'Next Exercise',
      previousExercise: 'Previous Exercise',
      submitAnswers: 'Submit Answers',
      yourAnswer: 'Your Answer',
      correctAnswer: 'Correct Answer',
      explanation: 'Explanation',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      completed: 'Lesson Completed!',
      finalScore: 'Final Score',
      timeSpent: 'Time Spent',
      backToDashboard: 'Back to Dashboard',
      viewHistory: 'View History',
    },
    
    // Students (for Tutors)
    students: {
      title: 'Students',
      myStudents: 'My Students',
      addStudent: 'Add Student',
      inviteStudent: 'Invite Student',
      studentDetails: 'Student Details',
      studentProgress: 'Student Progress',
      assignedLessons: 'Assigned Lessons',
      completedLessons: 'Completed Lessons',
      averageScore: 'Average Score',
      totalHours: 'Total Hours',
      lastActive: 'Last Active',
      level: 'Level',
      email: 'Email',
      noStudents: 'No students yet',
      searchStudents: 'Search students...',
      filterByLevel: 'Filter by level',
      allLevels: 'All Levels',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    
    // Invitations
    invitations: {
      title: 'Invitations',
      sendInvitation: 'Send Invitation',
      pendingInvitations: 'Pending Invitations',
      studentEmail: 'Student Email',
      invitationSent: 'Invitation sent successfully',
      invitationExpired: 'Invitation expired',
      invitationAccepted: 'Invitation accepted',
      invitationDeclined: 'Invitation declined',
      resendInvitation: 'Resend Invitation',
      cancelInvitation: 'Cancel Invitation',
      expiresOn: 'Expires on',
      sentOn: 'Sent on',
    },
    
    // Messages
    messages: {
      title: 'Messages',
      conversations: 'Conversations',
      newMessage: 'New Message',
      newConversation: 'New Conversation',
      selectConversation: 'Select a conversation',
      typeMessage: 'Type your message...',
      send: 'Send',
      noMessages: 'No messages yet',
      startConversation: 'Start a conversation',
      searchMessages: 'Search messages...',
      today: 'Today',
      yesterday: 'Yesterday',
      lastSeen: 'Last seen',
      online: 'Online',
      offline: 'Offline',
    },
    
    // Schedule/Calendar
    schedule: {
      title: 'Schedule',
      calendar: 'Calendar',
      upcomingMeetings: 'Upcoming Meetings',
      scheduleMeeting: 'Schedule Meeting',
      editMeeting: 'Edit Meeting',
      cancelMeeting: 'Cancel Meeting',
      meetingDetails: 'Meeting Details',
      noMeetings: 'No scheduled meetings',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      date: 'Date',
      time: 'Time',
      duration: 'Duration',
      with: 'With',
      topic: 'Topic',
      description: 'Description',
      joinMeeting: 'Join Meeting',
      meetingLink: 'Meeting Link',
      addToCalendar: 'Add to Calendar',
    },
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      lessons: 'Lessons',
      students: 'Students',
      schedule: 'Schedule',
      messages: 'Messages',
      settings: 'Settings',
      profile: 'Profile',
      tutor: 'Tutor',
    },
    
    // Settings
    settings: {
      title: 'Settings',
      profile: 'Profile',
      account: 'Account',
      notifications: 'Notifications',
      preferences: 'Preferences',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      saveChanges: 'Save Changes',
      changesSaved: 'Changes saved successfully',
    },

    studentLessonViewer: {
      // Loading & Errors
      loading: 'Loading lesson...',
      error: 'Error',
      lessonNotFound: 'Lesson not found',
      backToLessons: 'Back to Lessons',
      
      // Header
      byTutor: 'by',
      exercises: 'exercises',
      
      // Status labels
      statusNotStarted: 'Not Started',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      
      // Start Lesson Card
      readyToStart: 'Ready to start this lesson?',
      beginJourney: 'Begin your learning journey now',
      startLesson: 'Start Lesson',
      starting: 'Starting...',
      
      // Progress Stats
      yourProgress: 'Your Progress',
      timeSpent: 'Time Spent',
      minutes: 'min',
      startedOn: 'Started on',
      
      // Lesson Content
      lessonContent: 'Lesson Content',
      
      // Interactive Exercises
      exercises: 'Interactive Exercises',
      exercisesDescription: 'Complete all exercises to finish the lesson',
      noExercises: 'No exercises available',
      noExercisesDescription: 'This lesson doesn\'t have any exercises yet',
      
      // Completion
      completing: 'Completing lesson...',
      
      // Completed Lesson
      lessonCompleted: 'Lesson Completed!',
      completedMessage: 'You\'ve already completed this lesson with a score of',
      viewDetailsHistory: 'View your detailed results and answers in the lesson history',
      viewHistory: 'View History & Results',
      viewLessonHistory: 'View Lesson History',
      
      // Errors
      errorLoadingLesson: 'Failed to load lesson details. Please try again.',
      errorStartingLesson: 'Failed to start lesson. Please try again.',
      errorCompletingLesson: 'Failed to complete lesson. Please try again.',
    },

    // Student Messages Page
    studentMessagesPage: {
      // Page Title
      title: 'Messages',
      
      // Loading
      loading: 'Loading messages...',
      
      // Search
      searchPlaceholder: 'Search conversations...',
      
      // Conversations List
      conversations: 'Conversations',
      noConversations: 'No conversations yet',
      noConversationsDescription: 'Start chatting with your tutor',
      startConversation: 'Start Conversation',
      newChat: 'New Chat',
      
      // Empty Selection
      selectConversation: 'Select a conversation',
      selectConversationDescription: 'Choose a conversation from the list to start messaging',
      
      // Chat Header
      online: 'Online',
      typing: 'typing...',
      
      // Messages
      today: 'Today',
      yesterday: 'Yesterday',
      justNow: 'Just now',
      you: 'You',
      
      // Message Input
      typeMessage: 'Type a message...',
      sendMessage: 'Send message',
      sending: 'Sending...',
      
      // New Chat Modal
      startNewConversation: 'Start New Conversation',
      selectTutor: 'Select a tutor to start chatting',
      noTutorsAvailable: 'No tutors available',
      noTutorsDescription: 'You need to be assigned to a tutor first',
      cancel: 'Cancel',
      start: 'Start',
      
      // Errors
      errorLoading: 'Failed to load conversations',
      errorSending: 'Failed to send message',
      tryAgain: 'Please try again',
      
      // Unread
      unread: 'unread',
      newMessage: 'New message',
      
      // Time formatting
      minutes: 'min',
      hours: 'h',
      days: 'd',
      weeks: 'w',
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
      success: 'Sukces',
      close: 'Zamknij',
      back: 'Wstecz',
      next: 'Dalej',
      previous: 'Poprzedni',
      confirm: 'Potwierdź',
      remove: 'Usuń',
      add: 'Dodaj',
      view: 'Zobacz',
      download: 'Pobierz',
      upload: 'Prześlij',
      yes: 'Tak',
      no: 'Nie',
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
      subtitle: 'Zaloguj się, aby kontynuować naukę',
      email: 'Adres email',
      password: 'Hasło',
      signIn: 'Zaloguj się',
      signingIn: 'Logowanie...',
      noAccount: 'Nie masz konta?',
      signUp: 'Zarejestruj się tutaj',
      invalidCredentials: 'Nieprawidłowy email lub hasło. Sprawdź swoje dane i spróbuj ponownie.',
      emailNotConfirmed: 'Sprawdź swoją skrzynkę email i kliknij link potwierdzający przed zalogowaniem.',
      tooManyRequests: 'Zbyt wiele prób logowania. Poczekaj chwilę przed ponowną próbą.',
      needHelp: 'Potrzebujesz pomocy?',
      helpText: 'Utwórz nowe konto lub skontaktuj się z pomocą techniczną.',
    },
    
    // Sign Up Page
    signup: {
      title: 'Utwórz konto, aby rozpocząć naukę',
      firstName: 'Imię',
      lastName: 'Nazwisko',
      email: 'Adres email',
      password: 'Hasło',
      confirmPassword: 'Potwierdź hasło',
      role: 'Jestem',
      student: 'Uczniem',
      tutor: 'Nauczycielem',
      createAccount: 'Utwórz konto',
      creatingAccount: 'Tworzenie konta...',
      haveAccount: 'Masz już konto?',
      signIn: 'Zaloguj się tutaj',
      passwordMismatch: 'Hasła nie są zgodne',
      accountCreated: 'Konto zostało utworzone! Przekierowywanie do logowania...',
      // Validation errors
      emailRequired: 'Email jest wymagany',
      emailInvalid: 'Wprowadź prawidłowy adres email',
      passwordRequired: 'Hasło jest wymagane',
      passwordTooShort: 'Hasło musi mieć co najmniej 6 znaków',
      confirmPasswordRequired: 'Potwierdź hasło',
      firstNameRequired: 'Imię jest wymagane',
      firstNameTooShort: 'Imię musi mieć co najmniej 2 znaki',
      lastNameRequired: 'Nazwisko jest wymagane',
      lastNameTooShort: 'Nazwisko musi mieć co najmniej 2 znaki',
      roleRequired: 'Wybierz rolę',
      userExists: 'Konto z tym adresem email już istnieje',
    },
    
    // Student Dashboard
    studentDashboard: {
      title: 'Panel Ucznia',
      welcome: 'Witaj ponownie',
      upcomingLessons: 'Nadchodzące Lekcje',
      recentActivity: 'Ostatnia Aktywność',
      progress: 'Postęp',
      viewAll: 'Zobacz Wszystkie',
      noLessons: 'Nie przypisano jeszcze żadnych lekcji',
      completedLessons: 'Ukończone Lekcje',
      hoursLearned: 'Godziny Nauki',
      averageScore: 'Średni Wynik',
      currentStreak: 'Aktualna Seria',
      days: 'dni',
    },
    
    // Tutor Dashboard
    tutorDashboard: {
      title: 'Panel Nauczyciela',
      welcome: 'Witaj ponownie',
      myStudents: 'Moi Uczniowie',
      activeStudents: 'Aktywni Uczniowie',
      totalLessons: 'Wszystkie Lekcje',
      lessonsThisWeek: 'Lekcje w tym tygodniu',
      upcomingMeetings: 'Nadchodzące Spotkania',
      recentActivity: 'Ostatnia Aktywność',
      stats: 'Statystyki',
      noStudents: 'Brak uczniów',
      noMeetings: 'Brak nadchodzących spotkań',
    },
    
    // Lessons
    lessons: {
      title: 'Lekcje',
      myLessons: 'Moje Lekcje',
      assignedLessons: 'Przypisane Lekcje',
      availableLessons: 'Dostępne Lekcje',
      createLesson: 'Utwórz Lekcję',
      editLesson: 'Edytuj Lekcję',
      deleteLesson: 'Usuń Lekcję',
      assignLesson: 'Przypisz Lekcję',
      unassignLesson: 'Cofnij Przypisanie',
      viewLesson: 'Zobacz Lekcję',
      startLesson: 'Rozpocznij Lekcję',
      continueLesson: 'Kontynuuj Lekcję',
      reviewLesson: 'Przejrzyj Lekcję',
      lessonDetails: 'Szczegóły Lekcji',
      lessonContent: 'Treść Lekcji',
      exercises: 'Ćwiczenia',
      duration: 'Czas trwania',
      difficulty: 'Trudność',
      status: 'Status',
      published: 'Opublikowana',
      draft: 'Szkic',
      assigned: 'Przypisana',
      inProgress: 'W Trakcie',
      completed: 'Ukończona',
      notStarted: 'Nie Rozpoczęta',
      lessonHistory: 'Historia Lekcji',
      completedOn: 'Ukończono dnia',
      score: 'Wynik',
      timeSpent: 'Spędzony Czas',
      minutes: 'minuty',
      noLessons: 'Brak dostępnych lekcji',
      confirmDelete: 'Czy na pewno chcesz usunąć tę lekcję?',
    },
    
    // Lesson Viewer
    lessonViewer: {
      backToLessons: 'Powrót do Lekcji',
      lessonOverview: 'Przegląd Lekcji',
      exercises: 'Ćwiczenia',
      progress: 'Postęp',
      complete: 'Zakończ',
      checkAnswer: 'Sprawdź Odpowiedź',
      nextExercise: 'Następne Ćwiczenie',
      previousExercise: 'Poprzednie Ćwiczenie',
      submitAnswers: 'Wyślij Odpowiedzi',
      yourAnswer: 'Twoja Odpowiedź',
      correctAnswer: 'Poprawna Odpowiedź',
      explanation: 'Wyjaśnienie',
      correct: 'Poprawnie!',
      incorrect: 'Niepoprawnie',
      completed: 'Lekcja Ukończona!',
      finalScore: 'Końcowy Wynik',
      timeSpent: 'Spędzony Czas',
      backToDashboard: 'Powrót do Panelu',
      viewHistory: 'Zobacz Historię',
    },
    
    // Students (for Tutors)
    students: {
      title: 'Uczniowie',
      myStudents: 'Moi Uczniowie',
      addStudent: 'Dodaj Ucznia',
      inviteStudent: 'Zaproś Ucznia',
      studentDetails: 'Szczegóły Ucznia',
      studentProgress: 'Postęp Ucznia',
      assignedLessons: 'Przypisane Lekcje',
      completedLessons: 'Ukończone Lekcje',
      averageScore: 'Średni Wynik',
      totalHours: 'Łączne Godziny',
      lastActive: 'Ostatnio Aktywny',
      level: 'Poziom',
      email: 'Email',
      noStudents: 'Brak uczniów',
      searchStudents: 'Szukaj uczniów...',
      filterByLevel: 'Filtruj według poziomu',
      allLevels: 'Wszystkie Poziomy',
      beginner: 'Początkujący',
      intermediate: 'Średniozaawansowany',
      advanced: 'Zaawansowany',
    },
    
    // Invitations
    invitations: {
      title: 'Zaproszenia',
      sendInvitation: 'Wyślij Zaproszenie',
      pendingInvitations: 'Oczekujące Zaproszenia',
      studentEmail: 'Email Ucznia',
      invitationSent: 'Zaproszenie zostało wysłane',
      invitationExpired: 'Zaproszenie wygasło',
      invitationAccepted: 'Zaproszenie zaakceptowane',
      invitationDeclined: 'Zaproszenie odrzucone',
      resendInvitation: 'Wyślij Ponownie',
      cancelInvitation: 'Anuluj Zaproszenie',
      expiresOn: 'Wygasa',
      sentOn: 'Wysłano',
    },
    
    // Messages
    messages: {
      title: 'Wiadomości',
      conversations: 'Konwersacje',
      newMessage: 'Nowa Wiadomość',
      newConversation: 'Nowa Konwersacja',
      selectConversation: 'Wybierz konwersację',
      typeMessage: 'Wpisz wiadomość...',
      send: 'Wyślij',
      noMessages: 'Brak wiadomości',
      startConversation: 'Rozpocznij konwersację',
      searchMessages: 'Szukaj wiadomości...',
      today: 'Dziś',
      yesterday: 'Wczoraj',
      lastSeen: 'Ostatnio widziano',
      online: 'Online',
      offline: 'Offline',
    },
    
    // Schedule/Calendar
    schedule: {
      title: 'Terminarz',
      calendar: 'Kalendarz',
      upcomingMeetings: 'Nadchodzące Spotkania',
      scheduleMeeting: 'Zaplanuj Spotkanie',
      editMeeting: 'Edytuj Spotkanie',
      cancelMeeting: 'Anuluj Spotkanie',
      meetingDetails: 'Szczegóły Spotkania',
      noMeetings: 'Brak zaplanowanych spotkań',
      today: 'Dziś',
      thisWeek: 'Ten Tydzień',
      thisMonth: 'Ten Miesiąc',
      date: 'Data',
      time: 'Godzina',
      duration: 'Czas trwania',
      with: 'Z',
      topic: 'Temat',
      description: 'Opis',
      joinMeeting: 'Dołącz do Spotkania',
      meetingLink: 'Link do Spotkania',
      addToCalendar: 'Dodaj do Kalendarza',
    },
    
    // Navigation
    nav: {
      dashboard: 'Panel',
      lessons: 'Lekcje',
      students: 'Uczniowie',
      schedule: 'Terminarz',
      messages: 'Wiadomości',
      settings: 'Ustawienia',
      profile: 'Profil',
      tutor: 'Nauczyciel',
    },
    
    // Settings
    settings: {
      title: 'Ustawienia',
      profile: 'Profil',
      account: 'Konto',
      notifications: 'Powiadomienia',
      preferences: 'Preferencje',
      language: 'Język',
      theme: 'Motyw',
      light: 'Jasny',
      dark: 'Ciemny',
      emailNotifications: 'Powiadomienia Email',
      pushNotifications: 'Powiadomienia Push',
      saveChanges: 'Zapisz Zmiany',
      changesSaved: 'Zmiany zostały zapisane',
    },

    // Student Lesson Viewer
    studentLessonViewer: {
      // Loading & Errors
      loading: 'Ładowanie lekcji...',
      error: 'Błąd',
      lessonNotFound: 'Nie znaleziono lekcji',
      backToLessons: 'Powrót do lekcji',
      
      // Header
      byTutor: 'prowadzący',
      exercises: 'ćwiczenia',
      
      // Status labels
      statusNotStarted: 'Nie rozpoczęta',
      statusInProgress: 'W trakcie',
      statusCompleted: 'Ukończona',
      
      // Start Lesson Card
      readyToStart: 'Gotowy na rozpoczęcie tej lekcji?',
      beginJourney: 'Rozpocznij swoją naukę już teraz',
      startLesson: 'Rozpocznij lekcję',
      starting: 'Rozpoczynanie...',
      
      // Progress Stats
      yourProgress: 'Twój postęp',
      timeSpent: 'Czas poświęcony',
      minutes: 'min',
      startedOn: 'Rozpoczęta',
      
      // Lesson Content
      lessonContent: 'Treść lekcji',
      
      // Interactive Exercises
      exercises: 'Interaktywne ćwiczenia',
      exercisesDescription: 'Ukończ wszystkie ćwiczenia aby zakończyć lekcję',
      noExercises: 'Brak dostępnych ćwiczeń',
      noExercisesDescription: 'Ta lekcja nie ma jeszcze żadnych ćwiczeń',
      
      // Completion
      completing: 'Kończenie lekcji...',
      
      // Completed Lesson
      lessonCompleted: 'Lekcja ukończona!',
      completedMessage: 'Ukończyłeś już tę lekcję z wynikiem',
      viewDetailsHistory: 'Zobacz szczegółowe wyniki i odpowiedzi w historii lekcji',
      viewHistory: 'Zobacz historię i wyniki',
      viewLessonHistory: 'Zobacz historię lekcji',
      
      // Errors
      errorLoadingLesson: 'Nie udało się załadować szczegółów lekcji. Spróbuj ponownie.',
      errorStartingLesson: 'Nie udało się rozpocząć lekcji. Spróbuj ponownie.',
      errorCompletingLesson: 'Nie udało się ukończyć lekcji. Spróbuj ponownie.',
    },

    // Student Messages Page
    studentMessagesPage: {
      // Page Title
      title: 'Wiadomości',
      
      // Loading
      loading: 'Ładowanie wiadomości...',
      
      // Search
      searchPlaceholder: 'Szukaj konwersacji...',
      
      // Conversations List
      conversations: 'Konwersacje',
      noConversations: 'Brak konwersacji',
      noConversationsDescription: 'Rozpocznij rozmowę ze swoim korepetytorem',
      startConversation: 'Rozpocznij rozmowę',
      newChat: 'Nowa rozmowa',
      
      // Empty Selection
      selectConversation: 'Wybierz konwersację',
      selectConversationDescription: 'Wybierz konwersację z listy aby rozpocząć rozmowę',
      
      // Chat Header
      online: 'Online',
      typing: 'pisze...',
      
      // Messages
      today: 'Dzisiaj',
      yesterday: 'Wczoraj',
      justNow: 'Przed chwilą',
      you: 'Ty',
      
      // Message Input
      typeMessage: 'Napisz wiadomość...',
      sendMessage: 'Wyślij wiadomość',
      sending: 'Wysyłanie...',
      
      // New Chat Modal
      startNewConversation: 'Rozpocznij nową konwersację',
      selectTutor: 'Wybierz korepetytora aby rozpocząć rozmowę',
      noTutorsAvailable: 'Brak dostępnych korepetytorów',
      noTutorsDescription: 'Musisz najpierw być przypisany do korepetytora',
      cancel: 'Anuluj',
      start: 'Rozpocznij',
      
      // Errors
      errorLoading: 'Nie udało się załadować konwersacji',
      errorSending: 'Nie udało się wysłać wiadomości',
      tryAgain: 'Spróbuj ponownie',
      
      // Unread
      unread: 'nieprzeczytanych',
      newMessage: 'Nowa wiadomość',
      
      // Time formatting
      minutes: 'min',
      hours: 'godz',
      days: 'dni',
      weeks: 'tyg',
    },
  },
} as const;

export type Language = 'en' | 'pl';
export type TranslationKeys = typeof translations.en;