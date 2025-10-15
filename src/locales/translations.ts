// src/locales/translations.ts
export const translations = {
  en: {
    // Months
    months: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
    },
    
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

    // Student Schedule Page
    studentSchedulePage: {
      // Page Title & Header
      title: 'Schedule',
      description: 'View your upcoming lessons and meetings',
      refresh: 'Refresh',
      
      // Loading
      loading: 'Loading your schedule...',
      
      // Error
      errorLoading: 'Error loading schedule',
      
      // Quick Stats
      todaysMeetings: "Today's Meetings",
      upcomingMeetings: 'Upcoming Meetings',
      scheduled: 'scheduled',
      
      // Calendar Navigation
      today: 'Today',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',

      hasMeetings: 'Has meetings',
      
      // Days of Week
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      
      // Selected Day Panel
      selectedDay: 'Selected Day',
      meetingsOnDay: 'meeting on this day',
      meetingsOnDayPlural: 'meetings on this day',
      noMeetingsOnDay: 'No meetings on this day',
      
      // Meeting Status
      statusScheduled: 'Scheduled',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      statusUnknown: 'Unknown',
      
      // Meeting Details
      duration: 'min',
      participant: 'participant',
      participants: 'participants',
      joinMeeting: 'Join Meeting',
      
      // Upcoming Section
      upcomingMeetingsTitle: 'Upcoming Meetings',
      noUpcomingMeetings: 'No upcoming meetings',
      noUpcomingDescription: 'You have no scheduled meetings at the moment',
      
      // Time Formatting
      at: 'at',
    },

// TUTOR ----------------------------------------------------
    
    // Tutor Dashboard
    tutorDashboard: {
      // Page Title
      title: 'Tutor Dashboard',
      subtitle: 'Real-time statistics from your database',
      
      // Loading
      loading: 'Loading real data from database...',
      loadingStats: 'Loading statistics...',
      
      // Error
      databaseError: 'Database Error',
      tryAgain: 'Try Again',
      
      // Actions
      refresh: 'Refresh',
      
      // Success
      lessonCreatedSuccess: 'Lesson created successfully and assigned to students!',
      
      // Database Connection
      liveDatabaseConnection: 'Live Database Connection',
      studentsCount: 'Students',
      teachingHoursCount: 'Teaching Hours',
      completionRateCount: 'Completion Rate',
      
      // KPI Cards
      totalStudents: 'Total Students',
      activeStudents: 'Active Students',
      teachingHours: 'Teaching Hours',
      completionRate: 'Completion Rate',
      
      // Student Roster
      myStudents: 'My Students',
      noStudentsFound: 'No students found',
      addStudentsHint: 'Add students in the Students tab to get started',
      progress: 'Progress',
      lessons: 'lessons',
      hours: 'h',
      andMoreStudents: 'And {count} more students...',
      
      // Create Lesson Form
      createNewLesson: 'Create New Lesson',
      lessonTitle: 'Lesson Title',
      lessonTitlePlaceholder: 'e.g., Spanish Conversation Practice',
      description: 'Description',
      descriptionPlaceholder: 'Brief description of the lesson...',
      content: 'Content',
      contentPlaceholder: 'Lesson content, instructions, exercises...',
      assignToStudents: 'Assign to Students ({count} available)',
      noStudentsAvailable: 'No students available',
      addStudentsFirst: 'Add students in the Students tab first',
      selectAll: 'Select all',
      createLesson: 'Create Lesson',
      creating: 'Creating...',
      required: '*',
      
      // Calendar Section
      today: 'Today',
      hasMeetings: 'Has meetings',
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      noMeetingsScheduled: 'No meetings scheduled',
      student: 'student',
      students: 'students',
      joinMeeting: 'Join Meeting',
      minutes: 'min',
    },
    // Tutor Lesson Management Page
    tutorLessonManagementPage: {
      // Page Title & Header
      title: 'Lesson Management',
      subtitle: 'Create and manage your lessons',
      createLesson: 'Create Lesson',
      refresh: 'Refresh',
      
      // Loading & Errors
      loading: 'Loading lessons...',
      errorLoading: 'Failed to load lessons',
      
      // KPI Cards
      totalLessons: 'Total Lessons',
      publishedLessons: 'Published',
      draftLessons: 'Drafts',
      avgAssignments: 'Avg. Assignments',
      
      // Tabs
      allLessons: 'All Lessons',
      
      // Search
      searchPlaceholder: 'Search lessons by title or description...',
      
      // Empty States
      noLessonsFound: 'No lessons found',
      noLessonsYet: 'No lessons yet',
      tryAdjusting: 'Try adjusting your search terms',
      createFirstLesson: 'Create your first lesson to get started',
      
      // Lesson Card
      assigned: 'Assigned',
      completed: 'Completed',
      rate: 'Rate',
      created: 'Created',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      deleteConfirm: 'Delete',
      published: 'Published',
      draft: 'Draft',
      
      // Modal Titles
      createNewLesson: 'Create New Lesson',
      viewLesson: 'View Lesson',
      editLesson: 'Edit Lesson',
      
      // Modal Tabs
      lessonInfo: 'Lesson Info',
      exercises: 'Exercises',
      exercisesCount: 'Exercises ({count})',
      
      // Form Fields
      lessonTitle: 'Lesson Title',
      lessonTitleRequired: 'Lesson Title *',
      lessonTitlePlaceholder: 'e.g., Spanish Grammar Basics',
      description: 'Description',
      descriptionPlaceholder: 'Brief description of the lesson...',
      lessonContent: 'Lesson Content',
      contentPlaceholder: 'Enter lesson content, instructions...',
      status: 'Status',
      
      // Student Assignment
      assignToStudents: 'Assign to Students ({count} selected)',
      noStudentsAvailable: 'No students available',
      
      // Exercise Types
      abcdQuestion: 'ABCD Question',
      flashcards: 'Flashcards',
      textAnswer: 'Text Answer',
      
      // Exercise Builder - Multiple Choice
      question: 'Question',
      questionRequired: 'Question *',
      questionPlaceholder: 'e.g., What is the capital of France?',
      options: 'Options (A, B, C, D)',
      option: 'Option',
      correctAnswer: 'Correct Answer',
      correctAnswerRequired: 'Correct Answer *',
      explanation: 'Explanation (optional)',
      explanationPlaceholder: 'Explain why this is the correct answer...',
      points: 'Points',
      
      // Exercise Builder - Flashcards
      title: 'Title',
      titleRequired: 'Title *',
      titlePlaceholder: 'e.g., Spanish Vocabulary - Food',
      addCard: 'Add Card',
      card: 'Card',
      front: 'Front',
      frontPlaceholder: 'Question',
      back: 'Back',
      backPlaceholder: 'Answer',
      noFlashcardsYet: 'No flashcards yet. Click "Add Card" to start.',
      
      // Exercise Builder - Text Answer
      sampleAnswer: 'Sample Answer (optional)',
      sampleAnswerPlaceholder: 'Provide a sample correct answer for reference...',
      maxLength: 'Max Length (characters)',
      
      // Exercise Actions
      saveExercise: 'Save Exercise',
      cancel: 'Cancel',
      addAnotherExercise: 'Add another exercise:',
      chooseExerciseType: 'Choose an exercise type to add to your lesson:',
      
      // Exercise List
      noExercisesInLesson: 'No exercises in this lesson',
      exercisesAdded: 'exercise(s) added',
      atLeastOneRequired: 'At least 1 exercise required',
      
      // Modal Actions
      close: 'Close',
      creating: 'Creating...',
      saving: 'Saving...',
      saveChanges: 'Save Changes',
      
      // Toast Messages
      enterTitle: 'Please enter a lesson title',
      addOneExercise: 'Please add at least one exercise before creating the lesson',
      lessonCreated: 'Lesson "{title}" created with {count} exercise(s)!',
      lessonUpdated: 'Lesson "{title}" updated successfully!',
      lessonDeleted: 'Lesson deleted successfully',
      failedToSave: 'Failed to save lesson',
      failedToDelete: 'Failed to delete lesson',
    },
    
     // Tutor Messages Page
    tutorMessagesPage: {
      // Page Title
      title: 'Messages',
      
      // Loading
      loading: 'Loading messages...',
      
      // Search
      searchPlaceholder: 'Search conversations...',
      
      // Conversations List
      conversations: 'Conversations',
      noConversations: 'No conversations yet',
      noConversationsDescription: 'Start a conversation with your students',
      startNewChat: 'Start New Chat',
      newChat: 'New Chat',
      
      // Empty Selection
      selectConversation: 'Select a conversation',
      selectConversationDescription: 'Choose a conversation from the list to start messaging',
      
      // Chat Header
      student: 'Student',
      online: 'Online',
      typing: 'typing...',
      
      // Messages
      today: 'Today',
      yesterday: 'Yesterday',
      justNow: 'Just now',
      you: 'You',
      noMessagesYet: 'No messages yet',
      
      // Message Input
      typeMessage: 'Type your message...',
      sendMessage: 'Send message',
      sending: 'Sending...',
      
      // New Chat Modal
      startNewConversation: 'Start New Conversation',
      selectStudent: 'Select a student to start chatting',
      noStudentsAvailable: 'No students available for messaging',
      noStudentsDescription: 'Add students first in the Students tab',
      cancel: 'Cancel',
      
      // Errors
      errorLoading: 'Failed to load conversations',
      errorLoadingMessages: 'Failed to load messages',
      errorSending: 'Failed to send message',
      errorStarting: 'Failed to start conversation',
      tableError: 'Make sure the messaging tables are created.',
    },

// Tutor Schedule Page
    tutorSchedulePage: {
      // Page Title & Header
      title: 'Schedule',
      description: 'Manage your meetings and schedule new sessions',
      refresh: 'Refresh',
      createMeeting: 'Create Meeting',
      
      // Loading & Error
      loading: 'Loading meetings...',
      errorLoading: 'Error loading meetings',
      errorDeleting: 'Failed to delete meeting',
      
      // Quick Stats
      todaysMeetings: "Today's Meetings",
      thisWeekMeetings: 'This Week',
      next7Days: 'Next 7 Days',
      
      // Calendar Navigation
      today: 'Today',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      
      // Days of Week (skrócone)
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      
      // Days of Week (pełne nazwy dla formatDate)
      sundayFull: 'Sunday',
      mondayFull: 'Monday',
      tuesdayFull: 'Tuesday',
      wednesdayFull: 'Wednesday',
      thursdayFull: 'Thursday',
      fridayFull: 'Friday',
      saturdayFull: 'Saturday',
      
      // Months (pełne nazwy dla formatDate)
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
      
      // Selected Day Panel
      selectedDay: 'Selected Day',
      meetingsOnDay: 'meeting on this day',
      meetingsOnDayPlural: 'meetings on this day',
      noMeetingsOnDay: 'No meetings on this day',
      
      // Meeting Status
      statusScheduled: 'Scheduled',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      statusUnknown: 'Unknown',
      
      // Meeting Details
      duration: 'min',
      participant: 'participant',
      participants: 'participants',
      joinMeeting: 'Join Meeting',
      edit: 'Edit',
      delete: 'Delete',
      meetingLink: 'Meeting Link',
      
      // Upcoming Section
      upcomingMeetingsTitle: 'Upcoming Meetings',
      noUpcomingMeetings: 'No meetings scheduled',
      noUpcomingDescription: 'Create your first meeting to get started',
      scheduledFor: 'Scheduled for',
      
      // Dialogs
      confirmDelete: 'Are you sure you want to delete this meeting?',

      
      // Time Formatting
      at: 'at',
      more: 'more',
      
      // Delete Confirmation
      deleteConfirm: 'Are you sure you want to delete this meeting?',
      deleteSuccess: 'Meeting deleted successfully',
      deleteFailed: 'Failed to delete meeting',
      
      // Create Meeting
      createMeetingTitle: 'Create New Meeting',
      meetingCreated: 'Meeting created successfully',
      meetingFailed: 'Failed to create meeting',
    },


  // Tutor Students Page
    tutorStudentsPage: {
      // Page Title & Header
      title: 'Students',
      subtitle: 'Manage your students and track their progress',
      inviteStudent: 'Invite Student',
      refresh: 'Refresh',
      
      // Loading & Error
      loading: 'Loading students...',
      errorLoading: 'Error loading students',
      
      // Quick Stats (KPI Cards)
      totalStudents: 'Total Students',
      activeStudents: 'Active Students',
      pendingInvitations: 'Pending Invitations',
      averageProgress: 'Average Progress',
      
      // Tabs
      allStudents: 'All Students',
      activeTab: 'Active',
      invitationsTab: 'Invitations',
      
      // Search
      searchPlaceholder: 'Search by name or email...',
      
      // Empty States - Students
      noStudentsYet: 'No students yet',
      noStudentsFound: 'No students found',
      tryAdjustingSearch: 'Try adjusting your search terms',
      inviteFirstStudent: 'Invite your first student to get started',
      
      // Empty States - Invitations
      noPendingInvitations: 'No pending invitations',
      noPendingDescription: 'All your invitations have been accepted or expired',
      
      // Student Card
      progress: 'Progress',
      lessons: 'Lessons',
      hours: 'Hours',
      joined: 'Joined',
      sendMessage: 'Send Message',
      level: 'Level',
      active: 'Active',
      inactive: 'Inactive',
      
      // Levels
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      
      // Invite Modal
      inviteModalTitle: 'Invite New Student',
      studentEmail: 'Student Email',
      studentEmailPlaceholder: 'student@example.com',
      personalMessage: 'Personal Message (Optional)',
      personalMessagePlaceholder: 'Add a personal message to your invitation...',
      sendInvitation: 'Send Invitation',
      sending: 'Sending...',
      cancel: 'Cancel',
      
      // Invitations List
      invitationTo: 'Invitation to',
      sentOn: 'Sent on',
      expiresOn: 'Expires on',
      resend: 'Resend',
      cancelInvitation: 'Cancel',
      statusPending: 'Pending',
      statusAccepted: 'Accepted',
      statusExpired: 'Expired',
      statusCancelled: 'Cancelled',
      
      // Toast Messages
      invitationSent: 'Invitation sent to',
      invitationResent: 'Invitation resent to',
      invitationCancelled: 'Invitation cancelled',
      enterValidEmail: 'Please enter a valid email address',
      errorSendingInvitation: 'Error sending invitation',
      errorResendingInvitation: 'Error resending invitation',
      errorCancellingInvitation: 'Error cancelling invitation',
      
      // Actions
      viewProgress: 'View Progress',
      assignLesson: 'Assign Lesson',
      removeStudent: 'Remove Student',
    },

    // Landing Page
    landingPage: {
      // Navigation
      features: 'Features',
      howItWorks: 'How It Works',
      login: 'Login',
      getStarted: 'Get Started',
      
      // Mobile Menu
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      
      // Hero Section
      heroTitle: 'Transform Language Learning',
      heroSubtitle: 'The all-in-one platform connecting tutors and students for personalized, interactive language education.',
      startTeaching: 'Start Teaching',
      startLearning: 'Start Learning',
      freeToStart: '✨ Free to get started • No credit card required',
      
      // Stats Section
      activeTutors: 'Active Tutors',
      studentsLearning: 'Students Learning',
      lessonsCompleted: 'Lessons Completed',
      satisfactionRate: 'Satisfaction Rate',
      
      // Features Section
      featuresTitle: 'Everything You Need',
      featuresSubtitle: 'Powerful tools designed for modern language education',
      
      // Feature Items
      interactiveLessonsTitle: 'Interactive Lessons',
      interactiveLessonsDesc: 'Create and assign custom lessons with exercises, flashcards, and assessments tailored to each student\'s needs.',
      
      smartSchedulingTitle: 'Smart Scheduling',
      smartSchedulingDesc: 'Manage meetings and sessions with an integrated calendar. Never miss a lesson with automated reminders.',
      
      realtimeCommunicationTitle: 'Real-time Communication',
      realtimeCommunicationDesc: 'Stay connected with built-in messaging. Discuss progress, ask questions, and provide feedback instantly.',
      
      studentManagementTitle: 'Student Management',
      studentManagementDesc: 'Track progress, monitor completion rates, and manage multiple students from one intuitive dashboard.',
      
      progressTrackingTitle: 'Progress Tracking',
      progressTrackingDesc: 'Detailed analytics and reports show learning progress, completed exercises, and time spent on each lesson.',
      
      personalizedLearningTitle: 'Personalized Learning',
      personalizedLearningDesc: 'Adapt content to individual learning styles. Create custom exercises that match each student\'s level.',
      
      // How It Works Section
      howItWorksTitle: 'How It Works',
      howItWorksSubtitle: 'Simple steps to start your journey',
      
      forTutors: 'For Tutors',
      tutorStep1: 'Sign up and create your profile',
      tutorStep2: 'Invite students via email',
      tutorStep3: 'Create custom lessons and exercises',
      tutorStep4: 'Schedule meetings and track progress',
      
      forStudents: 'For Students',
      studentStep1: 'Accept your tutor\'s invitation',
      studentStep2: 'Access assigned lessons',
      studentStep3: 'Complete interactive exercises',
      studentStep4: 'Track your learning journey',
      
      // Testimonials Section
      testimonialsTitle: 'What People Say',
      
      testimonial1Name: 'Maria Garcia',
      testimonial1Role: 'Spanish Tutor',
      testimonial1Text: 'LinguaFlow has transformed how I teach. The interactive lessons keep my students engaged!',
      
      testimonial2Name: 'John Smith',
      testimonial2Role: 'English Student',
      testimonial2Text: 'Finally, a platform that makes learning fun and organized. I\'ve improved so much!',
      
      testimonial3Name: 'Sophie Chen',
      testimonial3Role: 'Mandarin Tutor',
      testimonial3Text: 'Managing multiple students is effortless. The progress tracking is invaluable.',
      
      // CTA Section
      ctaTitle: 'Ready to Get Started?',
      ctaSubtitle: 'Join thousands of tutors and students already using LinguaFlow',
      createFreeAccount: 'Create Free Account',
      
      // Footer
      footerTagline: 'Empowering language education through technology.',
      
      footerProduct: 'Product',
      footerPricing: 'Pricing',
      
      footerCompany: 'Company',
      footerAbout: 'About',
      footerBlog: 'Blog',
      footerContact: 'Contact',
      
      footerLegal: 'Legal',
      footerPrivacy: 'Privacy',
      footerTerms: 'Terms',
      footerSecurity: 'Security',
      
      footerCopyright: '© 2025 LinguaFlow. All rights reserved.',
    },
  },
  //--------------------------------------------------PL-------------------------------------------------------------------------------------------------------------------------
  pl: {

    // Months
    months: {
      january: 'Styczeń',
      february: 'Luty',
      march: 'Marzec',
      april: 'Kwiecień',
      may: 'Maj',
      june: 'Czerwiec',
      july: 'Lipiec',
      august: 'Sierpień',
      september: 'Wrzesień',
      october: 'Październik',
      november: 'Listopad',
      december: 'Grudzień',
    },
    
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

    // Student Schedule Page
    studentSchedulePage: {
      // Page Title & Header
      title: 'Harmonogram',
      description: 'Zobacz nadchodzące lekcje i spotkania',
      refresh: 'Odśwież',
      
      // Loading
      loading: 'Ładowanie harmonogramu...',
      
      // Error
      errorLoading: 'Błąd wczytywania harmonogramu',
      
      // Quick Stats
      todaysMeetings: 'Dzisiejsze spotkania',
      upcomingMeetings: 'Nadchodzące spotkania',
      scheduled: 'zaplanowanych',
      
      // Calendar Navigation
      today: 'Dzisiaj',
      previousMonth: 'Poprzedni miesiąc',
      nextMonth: 'Następny miesiąc',
      
      // Days of Week
      sunday: 'Nd',
      monday: 'Pn',
      tuesday: 'Wt',
      wednesday: 'Śr',
      thursday: 'Czw',
      friday: 'Pt',
      saturday: 'Sob',
      
      // Selected Day Panel
      selectedDay: 'Wybrany dzień',
      meetingsOnDay: 'spotkanie tego dnia',
      meetingsOnDayPlural: 'spotkań tego dnia',
      noMeetingsOnDay: 'Brak spotkań tego dnia',
      
      // Meeting Status
      statusScheduled: 'Zaplanowane',
      statusInProgress: 'W trakcie',
      statusCompleted: 'Ukończone',
      statusCancelled: 'Anulowane',
      statusUnknown: 'Nieznany',
      
      // Meeting Details
      duration: 'min',
      participant: 'uczestnik',
      participants: 'uczestników',
      joinMeeting: 'Dołącz do spotkania',
      
      // Upcoming Section
      upcomingMeetingsTitle: 'Nadchodzące spotkania',
      noUpcomingMeetings: 'Brak nadchodzących spotkań',
      noUpcomingDescription: 'Nie masz obecnie zaplanowanych spotkań',
      
      // Time Formatting
      at: 'o',
    },
// TUTOR ---------------------------------------------------------------------------
     // Tutor Dashboard
    tutorDashboard: {
      // Page Title
      title: 'Panel korepetytora',
      subtitle: 'Statystyki w czasie rzeczywistym z Twojej bazy danych',
      
      // Loading
      loading: 'Ładowanie danych z bazy...',
      loadingStats: 'Ładowanie statystyk...',
      
      // Error
      databaseError: 'Błąd bazy danych',
      tryAgain: 'Spróbuj ponownie',
      
      // Actions
      refresh: 'Odśwież',
      
      // Success
      lessonCreatedSuccess: 'Lekcja utworzona pomyślnie i przypisana do uczniów!',
      
      // Database Connection
      liveDatabaseConnection: 'Połączenie z bazą danych',
      studentsCount: 'Uczniowie',
      teachingHoursCount: 'Godziny nauczania',
      completionRateCount: 'Wskaźnik ukończenia',
      
      // KPI Cards
      totalStudents: 'Liczba uczniów',
      activeStudents: 'Aktywni uczniowie',
      teachingHours: 'Godziny nauczania',
      completionRate: 'Wskaźnik ukończenia',
      
      // Student Roster
      myStudents: 'Moi uczniowie',
      noStudentsFound: 'Nie znaleziono uczniów',
      addStudentsHint: 'Dodaj uczniów w zakładce Uczniowie, aby rozpocząć',
      progress: 'Postęp',
      lessons: 'lekcji',
      hours: 'godz',
      andMoreStudents: 'I jeszcze {count} uczniów...',

      // Calendar Section
      today: 'Dziś',
      hasMeetings: 'Spotkanie',
      sunday: 'Nd',
      monday: 'Pon',
      tuesday: 'Wtr',
      wednesday: 'Śrd',
      thursday: 'Czw',
      friday: 'Pt',
      saturday: 'Sob',
      noMeetingsScheduled: 'Brak zaplanowanych spotkań',
      student: 'student',
      students: 'studenci',
      joinMeeting: 'Dołącz do spotkania',
      minutes: 'min',
      
      // Create Lesson Form
      createNewLesson: 'Utwórz nową lekcję',
      lessonTitle: 'Tytuł lekcji',
      lessonTitlePlaceholder: 'np. Konwersacje po hiszpańsku',
      description: 'Opis',
      descriptionPlaceholder: 'Krótki opis lekcji...',
      content: 'Treść',
      contentPlaceholder: 'Treść lekcji, instrukcje, ćwiczenia...',
      assignToStudents: 'Przypisz do uczniów (dostępnych: {count})',
      noStudentsAvailable: 'Brak dostępnych uczniów',
      addStudentsFirst: 'Najpierw dodaj uczniów w zakładce Uczniowie',
      selectAll: 'Zaznacz wszystkich',
      createLesson: 'Utwórz lekcję',
      creating: 'Tworzenie...',
      required: '*',
    },

    // Tutor Lesson Management Page
    tutorLessonManagementPage: {
      // Page Title & Header
      title: 'Zarządzanie lekcjami',
      subtitle: 'Twórz i zarządzaj swoimi lekcjami',
      createLesson: 'Utwórz lekcję',
      refresh: 'Odśwież',
      
      // Loading & Errors
      loading: 'Ładowanie lekcji...',
      errorLoading: 'Nie udało się załadować lekcji',
      
      // KPI Cards
      totalLessons: 'Wszystkie lekcje',
      publishedLessons: 'Opublikowane',
      draftLessons: 'Szkice',
      avgAssignments: 'Śr. przypisań',
      
      // Tabs
      allLessons: 'Wszystkie lekcje',
      
      // Search
      searchPlaceholder: 'Szukaj lekcji po tytule lub opisie...',
      
      // Empty States
      noLessonsFound: 'Nie znaleziono lekcji',
      noLessonsYet: 'Brak lekcji',
      tryAdjusting: 'Spróbuj zmienić wyszukiwane frazy',
      createFirstLesson: 'Utwórz swoją pierwszą lekcję aby rozpocząć',
      
      // Lesson Card
      assigned: 'Przypisano',
      completed: 'Ukończono',
      rate: 'Wskaźnik',
      created: 'Utworzono',
      view: 'Podgląd',
      edit: 'Edytuj',
      delete: 'Usuń',
      deleteConfirm: 'Usunąć',
      published: 'Opublikowana',
      draft: 'Szkic',
      
      // Modal Titles
      createNewLesson: 'Utwórz nową lekcję',
      viewLesson: 'Podgląd lekcji',
      editLesson: 'Edytuj lekcję',
      
      // Modal Tabs
      lessonInfo: 'Informacje',
      exercises: 'Ćwiczenia',
      exercisesCount: 'Ćwiczenia ({count})',
      
      // Form Fields
      lessonTitle: 'Tytuł lekcji',
      lessonTitleRequired: 'Tytuł lekcji *',
      lessonTitlePlaceholder: 'np. Podstawy gramatyki hiszpańskiej',
      description: 'Opis',
      descriptionPlaceholder: 'Krótki opis lekcji...',
      lessonContent: 'Treść lekcji',
      contentPlaceholder: 'Wprowadź treść lekcji, instrukcje...',
      status: 'Status',
      
      // Student Assignment
      assignToStudents: 'Przypisz uczniom (wybrano: {count})',
      noStudentsAvailable: 'Brak dostępnych uczniów',
      
      // Exercise Types
      abcdQuestion: 'Pytanie ABCD',
      flashcards: 'Fiszki',
      textAnswer: 'Odpowiedź tekstowa',
      
      // Exercise Builder - Multiple Choice
      question: 'Pytanie',
      questionRequired: 'Pytanie *',
      questionPlaceholder: 'np. Jaka jest stolica Francji?',
      options: 'Opcje (A, B, C, D)',
      option: 'Opcja',
      correctAnswer: 'Poprawna odpowiedź',
      correctAnswerRequired: 'Poprawna odpowiedź *',
      explanation: 'Wyjaśnienie (opcjonalnie)',
      explanationPlaceholder: 'Wyjaśnij dlaczego to jest poprawna odpowiedź...',
      points: 'Punkty',
      
      // Exercise Builder - Flashcards
      title: 'Tytuł',
      titleRequired: 'Tytuł *',
      titlePlaceholder: 'np. Słownictwo hiszpańskie - Jedzenie',
      addCard: 'Dodaj fiszkę',
      card: 'Fiszka',
      front: 'Przód',
      frontPlaceholder: 'Pytanie',
      back: 'Tył',
      backPlaceholder: 'Odpowiedź',
      noFlashcardsYet: 'Brak fiszek. Kliknij "Dodaj fiszkę" aby rozpocząć.',
      
      // Exercise Builder - Text Answer
      sampleAnswer: 'Przykładowa odpowiedź (opcjonalnie)',
      sampleAnswerPlaceholder: 'Podaj przykładową poprawną odpowiedź jako odniesienie...',
      maxLength: 'Maks. długość (znaki)',
      
      // Exercise Actions
      saveExercise: 'Zapisz ćwiczenie',
      cancel: 'Anuluj',
      addAnotherExercise: 'Dodaj kolejne ćwiczenie:',
      chooseExerciseType: 'Wybierz typ ćwiczenia do dodania do lekcji:',
      
      // Exercise List
      noExercisesInLesson: 'Brak ćwiczeń w tej lekcji',
      exercisesAdded: 'ćwiczeń dodanych',
      atLeastOneRequired: 'Wymagane przynajmniej 1 ćwiczenie',
      
      // Modal Actions
      close: 'Zamknij',
      creating: 'Tworzenie...',
      saving: 'Zapisywanie...',
      saveChanges: 'Zapisz zmiany',
      
      // Toast Messages
      enterTitle: 'Proszę wprowadzić tytuł lekcji',
      addOneExercise: 'Proszę dodać przynajmniej jedno ćwiczenie przed utworzeniem lekcji',
      lessonCreated: 'Lekcja "{title}" utworzona z {count} ćwiczeniami!',
      lessonUpdated: 'Lekcja "{title}" zaktualizowana pomyślnie!',
      lessonDeleted: 'Lekcja usunięta pomyślnie',
      failedToSave: 'Nie udało się zapisać lekcji',
      failedToDelete: 'Nie udało się usunąć lekcji',
    },

    // Tutor Messages Page
    tutorMessagesPage: {
      // Page Title
      title: 'Wiadomości',
      
      // Loading
      loading: 'Ładowanie wiadomości...',
      
      // Search
      searchPlaceholder: 'Szukaj konwersacji...',
      
      // Conversations List
      conversations: 'Konwersacje',
      noConversations: 'Brak konwersacji',
      noConversationsDescription: 'Rozpocznij rozmowę ze swoimi uczniami',
      startNewChat: 'Rozpocznij nową rozmowę',
      newChat: 'Nowa rozmowa',
      
      // Empty Selection
      selectConversation: 'Wybierz konwersację',
      selectConversationDescription: 'Wybierz konwersację z listy aby rozpocząć rozmowę',
      
      // Chat Header
      student: 'Uczeń',
      online: 'Online',
      typing: 'pisze...',
      
      // Messages
      today: 'Dzisiaj',
      yesterday: 'Wczoraj',
      justNow: 'Przed chwilą',
      you: 'Ty',
      noMessagesYet: 'Brak wiadomości',
      
      // Message Input
      typeMessage: 'Napisz wiadomość...',
      sendMessage: 'Wyślij wiadomość',
      sending: 'Wysyłanie...',
      
      // New Chat Modal
      startNewConversation: 'Rozpocznij nową konwersację',
      selectStudent: 'Wybierz ucznia aby rozpocząć rozmowę',
      noStudentsAvailable: 'Brak dostępnych uczniów do wiadomości',
      noStudentsDescription: 'Najpierw dodaj uczniów w zakładce Uczniowie',
      cancel: 'Anuluj',
      
      // Errors
      errorLoading: 'Nie udało się załadować konwersacji',
      errorLoadingMessages: 'Nie udało się załadować wiadomości',
      errorSending: 'Nie udało się wysłać wiadomości',
      errorStarting: 'Nie udało się rozpocząć konwersacji',
      tableError: 'Upewnij się, że tabele wiadomości zostały utworzone.',
    },

    // Tutor Schedule Page
    tutorSchedulePage: {
      // Page Title & Header
      title: 'Harmonogram',
      description: 'Zarządzaj spotkaniami i planuj nowe sesje',
      refresh: 'Odśwież',
      createMeeting: 'Utwórz spotkanie',
      
      // Loading & Error
      loading: 'Ładowanie spotkań...',
      errorLoading: 'Błąd wczytywania spotkań',
      errorDeleting: 'Nie udało się usunąć spotkania',
      
      // Quick Stats
      todaysMeetings: 'Dzisiejsze spotkania',
      thisWeekMeetings: 'Ten tydzień',
      next7Days: 'Następne 7 dni',
      
      // Calendar Navigation
      today: 'Dzisiaj',
      previousMonth: 'Poprzedni miesiąc',
      nextMonth: 'Następny miesiąc',
      
      // Days of Week (skrócone)
      sunday: 'Nd',
      monday: 'Pn',
      tuesday: 'Wt',
      wednesday: 'Śr',
      thursday: 'Czw',
      friday: 'Pt',
      saturday: 'Sob',
      
      // Days of Week (pełne nazwy dla formatDate)
      sundayFull: 'Niedziela',
      mondayFull: 'Poniedziałek',
      tuesdayFull: 'Wtorek',
      wednesdayFull: 'Środa',
      thursdayFull: 'Czwartek',
      fridayFull: 'Piątek',
      saturdayFull: 'Sobota',
      
      // Months (pełne nazwy dla formatDate - dopełniacz)
      january: 'stycznia',
      february: 'lutego',
      march: 'marca',
      april: 'kwietnia',
      may: 'maja',
      june: 'czerwca',
      july: 'lipca',
      august: 'sierpnia',
      september: 'września',
      october: 'października',
      november: 'listopada',
      december: 'grudnia',
      
      // Selected Day Panel
      selectedDay: 'Wybrany dzień',
      meetingsOnDay: 'spotkanie tego dnia',
      meetingsOnDayPlural: 'spotkań tego dnia',
      noMeetingsOnDay: 'Brak spotkań tego dnia',
      
      // Meeting Status
      statusScheduled: 'Zaplanowane',
      statusInProgress: 'W trakcie',
      statusCompleted: 'Ukończone',
      statusCancelled: 'Anulowane',
      statusUnknown: 'Nieznany',
      
      // Meeting Details
      duration: 'min',
      participant: 'uczestnik',
      participants: 'uczestników',
      joinMeeting: 'Dołącz do spotkania',
      edit: 'Edytuj',
      delete: 'Usuń',
      meetingLink: 'Link do spotkania',
      
      // Upcoming Section
      upcomingMeetingsTitle: 'Nadchodzące spotkania',
      noUpcomingMeetings: 'Brak zaplanowanych spotkań',
      noUpcomingDescription: 'Utwórz pierwsze spotkanie aby rozpocząć',
      scheduledFor: 'Zaplanowane na',
      
      // Dialogs
      confirmDelete: 'Czy na pewno chcesz usunąć to spotkanie?',
      
      // Time Formatting
      at: 'o',
      more: 'więcej',
      
      // Delete Confirmation
      deleteConfirm: 'Czy na pewno chcesz usunąć to spotkanie?',
      deleteSuccess: 'Spotkanie usunięte pomyślnie',
      deleteFailed: 'Nie udało się usunąć spotkania',
      
      // Create Meeting
      createMeetingTitle: 'Utwórz nowe spotkanie',
      meetingCreated: 'Spotkanie utworzone pomyślnie',
      meetingFailed: 'Nie udało się utworzyć spotkania',
    },

     // Tutor Students Page
    tutorStudentsPage: {
      // Page Title & Header
      title: 'Uczniowie',
      subtitle: 'Zarządzaj swoimi uczniami i śledź ich postępy',
      inviteStudent: 'Zaproś ucznia',
      refresh: 'Odśwież',
      
      // Loading & Error
      loading: 'Ładowanie uczniów...',
      errorLoading: 'Błąd wczytywania uczniów',
      
      // Quick Stats (KPI Cards)
      totalStudents: 'Liczba uczniów',
      activeStudents: 'Aktywni uczniowie',
      pendingInvitations: 'Oczekujące zaproszenia',
      averageProgress: 'Średni postęp',
      
      // Tabs
      allStudents: 'Wszyscy uczniowie',
      activeTab: 'Aktywni',
      invitationsTab: 'Zaproszenia',
      
      // Search
      searchPlaceholder: 'Szukaj po nazwisku lub e-mail...',
      
      // Empty States - Students
      noStudentsYet: 'Brak uczniów',
      noStudentsFound: 'Nie znaleziono uczniów',
      tryAdjustingSearch: 'Spróbuj zmienić kryteria wyszukiwania',
      inviteFirstStudent: 'Zaproś pierwszego ucznia aby rozpocząć',
      
      // Empty States - Invitations
      noPendingInvitations: 'Brak oczekujących zaproszeń',
      noPendingDescription: 'Wszystkie zaproszenia zostały zaakceptowane lub wygasły',
      
      // Student Card
      progress: 'Postęp',
      lessons: 'Lekcje',
      hours: 'Godziny',
      joined: 'Dołączył',
      sendMessage: 'Wyślij wiadomość',
      level: 'Poziom',
      active: 'Aktywny',
      inactive: 'Nieaktywny',
      
      // Levels
      beginner: 'Początkujący',
      intermediate: 'Średniozaawansowany',
      advanced: 'Zaawansowany',
      
      // Invite Modal
      inviteModalTitle: 'Zaproś nowego ucznia',
      studentEmail: 'E-mail ucznia',
      studentEmailPlaceholder: 'uczen@example.com',
      personalMessage: 'Wiadomość osobista (opcjonalnie)',
      personalMessagePlaceholder: 'Dodaj osobistą wiadomość do zaproszenia...',
      sendInvitation: 'Wyślij zaproszenie',
      sending: 'Wysyłanie...',
      cancel: 'Anuluj',
      
      // Invitations List
      invitationTo: 'Zaproszenie do',
      sentOn: 'Wysłano',
      expiresOn: 'Wygasa',
      resend: 'Wyślij ponownie',
      cancelInvitation: 'Anuluj',
      statusPending: 'Oczekujące',
      statusAccepted: 'Zaakceptowane',
      statusExpired: 'Wygasłe',
      statusCancelled: 'Anulowane',
      
      // Toast Messages
      invitationSent: 'Zaproszenie wysłane do',
      invitationResent: 'Zaproszenie wysłane ponownie do',
      invitationCancelled: 'Zaproszenie anulowane',
      enterValidEmail: 'Wprowadź prawidłowy adres e-mail',
      errorSendingInvitation: 'Błąd wysyłania zaproszenia',
      errorResendingInvitation: 'Błąd ponownego wysyłania zaproszenia',
      errorCancellingInvitation: 'Błąd anulowania zaproszenia',
      
      // Actions
      viewProgress: 'Zobacz postęp',
      assignLesson: 'Przypisz lekcję',
      removeStudent: 'Usuń ucznia',
    },

    // Landing Page
    landingPage: {
      // Navigation
      features: 'Funkcje',
      howItWorks: 'Jak to działa',
      login: 'Zaloguj się',
      getStarted: 'Rozpocznij',
      
      // Mobile Menu
      lightMode: 'Tryb jasny',
      darkMode: 'Tryb ciemny',
      
      // Hero Section
      heroTitle: 'Zrewolucjonizuj naukę języków',
      heroSubtitle: 'Kompleksowa platforma łącząca korepetytorów i uczniów dla spersonalizowanej, interaktywnej nauki języków.',
      startTeaching: 'Rozpocznij nauczanie',
      startLearning: 'Zacznij się uczyć',
      freeToStart: '✨ Bezpłatny start • Nie potrzeba karty kredytowej',
      
      // Stats Section
      activeTutors: 'Aktywnych korepetytorów',
      studentsLearning: 'Uczących się studentów',
      lessonsCompleted: 'Ukończonych lekcji',
      satisfactionRate: 'Wskaźnik zadowolenia',
      
      // Features Section
      featuresTitle: 'Wszystko czego potrzebujesz',
      featuresSubtitle: 'Zaawansowane narzędzia zaprojektowane dla nowoczesnej edukacji językowej',
      
      // Feature Items
      interactiveLessonsTitle: 'Interaktywne lekcje',
      interactiveLessonsDesc: 'Twórz i przypisuj spersonalizowane lekcje z ćwiczeniami, fiszkami i testami dostosowanymi do potrzeb każdego ucznia.',
      
      smartSchedulingTitle: 'Inteligentne planowanie',
      smartSchedulingDesc: 'Zarządzaj spotkaniami i sesjami za pomocą zintegrowanego kalendarza. Nigdy nie przegap lekcji dzięki automatycznym przypomnieniom.',
      
      realtimeCommunicationTitle: 'Komunikacja w czasie rzeczywistym',
      realtimeCommunicationDesc: 'Pozostań w kontakcie dzięki wbudowanemu systemowi wiadomości. Omawiaj postępy, zadawaj pytania i udzielaj informacji natychmiast.',
      
      studentManagementTitle: 'Zarządzanie uczniami',
      studentManagementDesc: 'Śledź postępy, monitoruj wskaźniki ukończenia i zarządzaj wieloma uczniami z jednego intuicyjnego panelu.',
      
      progressTrackingTitle: 'Śledzenie postępów',
      progressTrackingDesc: 'Szczegółowe analizy i raporty pokazują postępy w nauce, ukończone ćwiczenia i czas spędzony na każdej lekcji.',
      
      personalizedLearningTitle: 'Spersonalizowana nauka',
      personalizedLearningDesc: 'Dostosuj treści do indywidualnych stylów uczenia się. Twórz niestandardowe ćwiczenia dopasowane do poziomu każdego ucznia.',
      
      // How It Works Section
      howItWorksTitle: 'Jak to działa',
      howItWorksSubtitle: 'Proste kroki aby rozpocząć swoją podróż',
      
      forTutors: 'Dla korepetytorów',
      tutorStep1: 'Zarejestruj się i utwórz swój profil',
      tutorStep2: 'Zaproś uczniów przez email',
      tutorStep3: 'Twórz spersonalizowane lekcje i ćwiczenia',
      tutorStep4: 'Planuj spotkania i śledź postępy',
      
      forStudents: 'Dla uczniów',
      studentStep1: 'Zaakceptuj zaproszenie od korepetytora',
      studentStep2: 'Uzyskaj dostęp do przypisanych lekcji',
      studentStep3: 'Wykonuj interaktywne ćwiczenia',
      studentStep4: 'Śledź swoją drogę nauki',
      
      // Testimonials Section
      testimonialsTitle: 'Co mówią użytkownicy',
      
      testimonial1Name: 'Maria Garcia',
      testimonial1Role: 'Korepetytor języka hiszpańskiego',
      testimonial1Text: 'LinguaFlow całkowicie zmienił sposób w jaki uczę. Interaktywne lekcje angażują moich uczniów!',
      
      testimonial2Name: 'John Smith',
      testimonial2Role: 'Uczeń języka angielskiego',
      testimonial2Text: 'W końcu platforma, która sprawia że nauka jest przyjemna i zorganizowana. Zrobiłem ogromne postępy!',
      
      testimonial3Name: 'Sophie Chen',
      testimonial3Role: 'Korepetytor języka mandaryńskiego',
      testimonial3Text: 'Zarządzanie wieloma uczniami jest bezproblemowe. Śledzenie postępów jest bezcenne.',
      
      // CTA Section
      ctaTitle: 'Gotowy aby rozpocząć?',
      ctaSubtitle: 'Dołącz do tysięcy korepetytorów i uczniów już korzystających z LinguaFlow',
      createFreeAccount: 'Utwórz darmowe konto',
      
      // Footer
      footerTagline: 'Wspieramy edukację językową poprzez technologię.',
      
      footerProduct: 'Produkt',
      footerPricing: 'Cennik',
      
      footerCompany: 'Firma',
      footerAbout: 'O nas',
      footerBlog: 'Blog',
      footerContact: 'Kontakt',
      
      footerLegal: 'Prawne',
      footerPrivacy: 'Prywatność',
      footerTerms: 'Warunki',
      footerSecurity: 'Bezpieczeństwo',
      
      footerCopyright: '© 2025 LinguaFlow. Wszelkie prawa zastrzeżone.',
    },
  },
} as const;

export type Language = 'en' | 'pl';
export type TranslationKeys = typeof translations.en;