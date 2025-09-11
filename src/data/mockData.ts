// src/data/mockData.ts - KOMPLETNY PLIK
import { Lesson, Student, Message } from '../types';

export const allLessons: Lesson[] = [
  {
    id: '1',
    title: 'Spanish Conversation Practice',
    date: '2025-01-20',
    time: '14:00',
    tutor: 'Maria Rodriguez',
    status: 'upcoming',
    assignedStudentIds: ['student1']
  },
  {
    id: '2',
    title: 'Grammar Fundamentals',
    date: '2025-01-22',
    time: '16:30',
    tutor: 'Carlos Mendez',
    status: 'upcoming',
    assignedStudentIds: ['student1']
  },
  {
    id: '3',
    title: 'Pronunciation Workshop',
    date: '2025-01-24',
    time: '10:00',
    tutor: 'Ana Garcia',
    status: 'upcoming',
    assignedStudentIds: ['student1']
  },
  {
    id: '4',
    title: 'Business Spanish',
    date: '2025-01-15',
    time: '09:00',
    tutor: 'Maria Rodriguez',
    status: 'completed',
    assignedStudentIds: ['student1']
  },
  {
    id: '5',
    title: 'Listening Comprehension',
    date: '2025-01-12',
    time: '11:00',
    tutor: 'Carlos Mendez',
    status: 'completed',
    assignedStudentIds: ['student1']
  },
  {
    id: '6',
    title: 'French Basics',
    date: '2025-01-25',
    time: '15:00',
    tutor: 'Pierre Dubois',
    status: 'upcoming',
    assignedStudentIds: ['2']
  },
  {
    id: '7',
    title: 'German Grammar',
    date: '2025-01-26',
    time: '13:00',
    tutor: 'Hans Mueller',
    status: 'upcoming',
    assignedStudentIds: ['3']
  },
  {
    id: '8',
    title: 'Italian Culture',
    date: '2025-01-27',
    time: '16:00',
    tutor: 'Giuseppe Rossi',
    status: 'upcoming',
    assignedStudentIds: ['4']
  }
];

export const allMessages: Message[] = [
  {
    id: '1',
    sender: 'Maria Rodriguez',
    senderRole: 'tutor',
    content: 'Great progress in today\'s conversation practice! Keep working on your pronunciation.',
    timestamp: '10:30 AM',
    read: false
  },
  {
    id: '2',
    sender: 'Carlos Mendez',
    senderRole: 'tutor',
    content: 'Don\'t forget to review the grammar exercises we covered yesterday.',
    timestamp: '09:15 AM',
    read: true
  },
  {
    id: '3',
    sender: 'Ana Garcia',
    senderRole: 'tutor',
    content: 'Your pronunciation has improved significantly! Well done.',
    timestamp: '08:45 AM',
    read: true
  },
  {
    id: '4',
    sender: 'Alex Johnson',
    senderRole: 'student',
    content: 'Hi! I have a question about the pronunciation exercise.',
    timestamp: '10:30 AM',
    read: false
  },
  {
    id: '5',
    sender: 'Sarah Chen',
    senderRole: 'student',
    content: 'Thank you for the grammar lesson yesterday!',
    timestamp: '09:15 AM',
    read: true
  },
  {
    id: '6',
    sender: 'David Kim',
    senderRole: 'student',
    content: 'Could we schedule an extra session this week?',
    timestamp: '08:45 AM',
    read: true
  }
];

export const studentMockData = {
  kpis: {
    lessonsCompleted: 24,
    studyStreak: 7,
    totalHours: 48
  },
  upcomingLessons: allLessons.filter(lesson => 
    lesson.assignedStudentIds?.includes('student1') && lesson.status === 'upcoming'
  ).slice(0, 3),
  allLessons: allLessons.filter(lesson => 
    lesson.assignedStudentIds?.includes('student1')
  ),
  messages: allMessages.filter(message => 
    message.senderRole === 'tutor'
  )
};

export const tutorMockData = {
  kpis: {
    totalStudents: 15,
    activeLessons: 8,
    teachingHours: 120
  },
  students: [
    {
      id: 'student1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      level: 'Beginner',
      progress: 65,
      lessonsCompleted: 12,
      totalHours: 24
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      level: 'Intermediate',
      progress: 78,
      lessonsCompleted: 18,
      totalHours: 36
    },
    {
      id: '3',
      name: 'David Kim',
      email: 'david@example.com',
      level: 'Advanced',
      progress: 92,
      lessonsCompleted: 28,
      totalHours: 56
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      level: 'Beginner',
      progress: 43,
      lessonsCompleted: 8,
      totalHours: 16
    },
    {
      id: '5',
      name: 'Miguel Santos',
      email: 'miguel@example.com',
      level: 'Intermediate',
      progress: 71,
      lessonsCompleted: 15,
      totalHours: 30
    }
  ] as Student[],
  allLessons: allLessons,
  messages: allMessages.filter(message => 
    message.senderRole === 'student'
  )
};