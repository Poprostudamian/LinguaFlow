export interface User {
  id: string;
  email: string;
  role: 'student' | 'tutor';
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedStudentIds?: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: 'student' | 'tutor';
  content: string;
  timestamp: string;
  read: boolean;
}

// Dodaj te interface'y do istniejącego pliku src/types/index.ts

export interface User {
  id: string;
  email: string;
  role: 'student' | 'tutor';
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

// Updated Lesson interface for the new lesson management system
export interface DatabaseLesson {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export interface StudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
}

export interface LessonWithAssignments extends DatabaseLesson {
  assignedCount: number;
  completedCount: number;
  assignedStudents: string[];
  student_lessons: StudentLesson[];
}

// Legacy Lesson interface - keep for compatibility with existing components
export interface Lesson {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedStudentIds?: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: 'student' | 'tutor';
  content: string;
  timestamp: string;
  read: boolean;
}

// Additional types for lesson creation and updates
export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  assignedStudentIds: string[];
  status?: 'draft' | 'published';
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: 'draft' | 'published';
}